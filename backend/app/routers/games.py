import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/api/games", tags=["games"])


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def _replace_normalized(db: Session, game: models.Game, payload: schemas.GamePayload) -> None:
    game.players.clear()
    game.rounds.clear()
    db.flush()

    for index, player in enumerate(payload.players):
        db.add(
            models.Player(
                id=player.id,
                game_id=game.id,
                name=player.name,
                sort_order=index,
            )
        )

    for round_payload in payload.rounds:
        round_row = models.Round(
            id=round_payload.id,
            game_id=game.id,
            number=round_payload.number,
        )
        db.add(round_row)
        db.flush()
        for entry in round_payload.entries:
            db.add(
                models.RoundEntry(
                    round_id=round_row.id,
                    player_id=entry.playerId,
                    busted=entry.busted,
                    number_cards=json.dumps(entry.numberCards),
                    bonuses=json.dumps(entry.bonuses),
                    has_double=entry.hasDouble,
                    computed_score=entry.score,
                )
            )


def _apply_payload(game: models.Game, payload: schemas.GamePayload) -> None:
    game.table_name = payload.tableName
    game.target_score = payload.targetScore
    game.created_at = _parse_iso(payload.createdAt)
    game.updated_at = _parse_iso(payload.updatedAt)
    game.payload_json = payload.model_dump_json()


def _totals(payload: schemas.GamePayload) -> dict[str, int]:
    totals = {player.name: 0 for player in payload.players}
    names = {player.id: player.name for player in payload.players}
    for round_payload in payload.rounds:
        for entry in round_payload.entries:
            name = names.get(entry.playerId)
            if name is not None:
                totals[name] += entry.score
    return totals


def _summary(game: models.Game) -> schemas.GameSummary:
    payload = schemas.GamePayload.model_validate_json(game.payload_json)
    return schemas.GameSummary(
        id=game.id,
        tableName=game.table_name,
        targetScore=game.target_score,
        players=[player.name for player in payload.players],
        roundCount=len(payload.rounds),
        updatedAt=payload.updatedAt,
        totals=_totals(payload),
    )


@router.get("", response_model=list[schemas.GameSummary])
def list_games(db: Session = Depends(get_db)):
    games = db.scalars(select(models.Game).order_by(models.Game.updated_at.desc())).all()
    return [_summary(game) for game in games]


@router.post("", response_model=schemas.GamePayload)
def create_game(payload: schemas.GamePayload, db: Session = Depends(get_db)):
    existing = db.get(models.Game, payload.id)
    if existing:
        raise HTTPException(status_code=409, detail="Spiel existiert bereits")
    game = models.Game(id=payload.id)
    _apply_payload(game, payload)
    db.add(game)
    db.flush()
    _replace_normalized(db, game, payload)
    db.commit()
    return payload


@router.get("/{game_id}", response_model=schemas.GamePayload)
def get_game(game_id: str, db: Session = Depends(get_db)):
    game = db.get(models.Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Spiel nicht gefunden")
    return schemas.GamePayload.model_validate_json(game.payload_json)


@router.put("/{game_id}", response_model=schemas.GamePayload)
def upsert_game(game_id: str, payload: schemas.GamePayload, db: Session = Depends(get_db)):
    if payload.id != game_id:
        raise HTTPException(status_code=400, detail="ID stimmt nicht überein")

    game = db.scalar(
        select(models.Game)
        .options(selectinload(models.Game.players), selectinload(models.Game.rounds))
        .where(models.Game.id == game_id)
    )
    if game is None:
        game = models.Game(id=game_id)
        _apply_payload(game, payload)
        db.add(game)
        db.flush()
    else:
        incoming = _parse_iso(payload.updatedAt)
        if game.updated_at and incoming < game.updated_at:
            return schemas.GamePayload.model_validate_json(game.payload_json)
        _apply_payload(game, payload)

    _replace_normalized(db, game, payload)
    db.commit()
    return payload


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: str, db: Session = Depends(get_db)):
    game = db.get(models.Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Spiel nicht gefunden")
    db.delete(game)
    db.commit()
