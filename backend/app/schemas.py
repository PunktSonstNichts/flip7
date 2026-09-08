from pydantic import BaseModel, Field


class PlayerPayload(BaseModel):
    id: str
    name: str


class RoundEntryPayload(BaseModel):
    playerId: str
    busted: bool = False
    secondChance: bool = False
    numberCards: list[int] = Field(default_factory=list)
    bonuses: list[int] = Field(default_factory=list)
    hasDouble: bool = False
    score: int = 0


class RoundPayload(BaseModel):
    id: str
    number: int
    entries: list[RoundEntryPayload] = Field(default_factory=list)


class GamePayload(BaseModel):
    id: str
    tableName: str | None = None
    targetScore: int = 200
    players: list[PlayerPayload]
    rounds: list[RoundPayload] = Field(default_factory=list)
    createdAt: str
    updatedAt: str


class GameSummary(BaseModel):
    id: str
    tableName: str | None
    targetScore: int
    players: list[str]
    roundCount: int
    updatedAt: str
    totals: dict[str, int]
