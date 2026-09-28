from typing import Any, Optional
from pydantic import BaseModel, Field

class TargetIn(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None
    environment: Optional[str] = None
    scope: Optional[list[str]] = None
    requestTimeout: Optional[int] = None
    maxRequestRate: Optional[int] = None
    isAuthorized: Optional[bool] = None

class TestConnectionIn(BaseModel): url: str
class ToggleIn(BaseModel): enabled: bool
class StartAssessmentIn(BaseModel): moduleIds: list[str] = Field(default_factory=list)
class StatusIn(BaseModel): status: str
class ChainDecisionIn(BaseModel): action: str; reason: str = ""
