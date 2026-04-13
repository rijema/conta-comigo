from typing import Optional, Dict
from pydantic import BaseModel, Field


class BKTUpdateRequest(BaseModel):
    skill_code: str = Field(..., description="BNCC skill code e.g. EF01MA01")
    current_mastery: float = Field(..., ge=0.0, le=1.0, description="Current P(L)")
    is_correct: bool = Field(..., description="Whether the response was correct")
    mastery_threshold: float = Field(0.95, ge=0.5, le=1.0, description="Mastery threshold")
    learner_id: Optional[str] = Field(None, description="Learner UUID for logging")

    @validator("skill_code")
    def validate_skill_code(cls, v):
        import re
        if not re.match(r"EF\d{2}MA\d{2}", v):
            raise ValueError("skill_code must match pattern EF##MA## (e.g. EF01MA01)")
        return v


class BKTUpdateResponse(BaseModel):
    skill_code: str
    previous_mastery: float
    updated_mastery: float
    is_mastered: bool
    recommended_difficulty: int = Field(..., ge=1, le=5)
    xai_explanation: str
    bkt_params: Dict[str, float]