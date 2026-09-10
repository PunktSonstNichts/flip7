from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    table_name: Mapped[str | None] = mapped_column(String, nullable=True)
    target_score: Mapped[int] = mapped_column(Integer, default=200)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)
    payload_json: Mapped[str] = mapped_column(Text)

    players: Mapped[list["Player"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )
    rounds: Mapped[list["Round"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    game_id: Mapped[str] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String)
    sort_order: Mapped[int] = mapped_column(Integer)

    game: Mapped[Game] = relationship(back_populates="players")


class Round(Base):
    __tablename__ = "rounds"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    game_id: Mapped[str] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"))
    number: Mapped[int] = mapped_column(Integer)

    game: Mapped[Game] = relationship(back_populates="rounds")
    entries: Mapped[list["RoundEntry"]] = relationship(
        back_populates="round", cascade="all, delete-orphan"
    )


class RoundEntry(Base):
    __tablename__ = "round_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    round_id: Mapped[str] = mapped_column(ForeignKey("rounds.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column(String)
    busted: Mapped[bool] = mapped_column(Boolean, default=False)
    number_cards: Mapped[str] = mapped_column(Text, default="[]")
    bonuses: Mapped[str] = mapped_column(Text, default="[]")
    has_double: Mapped[bool] = mapped_column(Boolean, default=False)
    computed_score: Mapped[int] = mapped_column(Integer, default=0)

    round: Mapped[Round] = relationship(back_populates="entries")
