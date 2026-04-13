from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class ModalityEnum(str, Enum):
    visual = "visual"
    auditory = "auditory"
    kinesthetic = "kinesthetic"
    mixed = "mixed"


class DifficultyEnum(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class EngagementLevelEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# ─── BKT ──────────────────────────────────────────────────────────────────────

class BKTInput(BaseModel):
    learner_id: str = Field(..., description="UUID of the learner")
    skill_id: str = Field(..., description="BNCC skill identifier e.g. EF01MA01")
    correct: bool = Field(..., description="Whether the learner answered correctly")
    prior_mastery: float = Field(
        default=0.1,
        ge=0.0,
        le=1.0,
        description="Prior probability of mastery",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "learner_id": "550e8400-e29b-41d4-a716-446655440000",
                "skill_id": "EF01MA01",
                "correct": True,
                "prior_mastery": 0.3,
            }
        }


class BKTOutput(BaseModel):
    learner_id: str
    skill_id: str
    mastery_probability: float = Field(..., ge=0.0, le=1.0)
    is_mastered: bool
    recommended_next_difficulty: DifficultyEnum
    confidence: float = Field(..., ge=0.0, le=1.0)
    xai_explanation: Dict[str, Any]


# ─── Engagement ───────────────────────────────────────────────────────────────

class EngagementInput(BaseModel):
    learner_id: str
    session_duration_seconds: float = Field(..., ge=0)
    response_time_avg_seconds: float = Field(..., ge=0)
    correct_answers_ratio: float = Field(..., ge=0.0, le=1.0)
    hint_requests: int = Field(..., ge=0)
    activity_switches: int = Field(..., ge=0)
    idle_time_seconds: float = Field(..., ge=0)
    consecutive_errors: int = Field(..., ge=0)
    sensory_profile: Optional[str] = Field(default="balanced")

    class Config:
        json_schema_extra = {
            "example": {
                "learner_id": "550e8400-e29b-41d4-a716-446655440000",
                "session_duration_seconds": 1200,
                "response_time_avg_seconds": 8.5,
                "correct_answers_ratio": 0.72,
                "hint_requests": 3,
                "activity_switches": 2,
                "idle_time_seconds": 45,
                "consecutive_errors": 1,
                "sensory_profile": "visual_strength",
            }
        }


class EngagementOutput(BaseModel):
    learner_id: str
    engagement_level: EngagementLevelEnum
    engagement_score: float = Field(..., ge=0.0, le=1.0)
    frustration_risk: float = Field(..., ge=0.0, le=1.0)
    recommendations: List[str]
    xai_explanation: Dict[str, Any]


# ─── Full ADE ML Pipeline ─────────────────────────────────────────────────────

class SkillAttempt(BaseModel):
    skill_id: str
    correct: bool
    response_time_seconds: float
    difficulty: DifficultyEnum


class ADEInput(BaseModel):
    learner_id: str
    session_id: str
    skill_attempts: List[SkillAttempt]
    current_mastery_map: Dict[str, float] = Field(
        default_factory=dict,
        description="Map of skill_id -> mastery probability",
    )
    session_duration_seconds: float = Field(default=0)
    hint_requests: int = Field(default=0)
    consecutive_errors: int = Field(default=0)
    sensory_profile: Optional[str] = Field(default="balanced")
    asd_support_level: Optional[str] = Field(
        default="mild",
        description="mild | moderate | strong - from LASDONT ontology",
    )
    preferred_modality: Optional[ModalityEnum] = Field(default=ModalityEnum.visual)


class ADEOutput(BaseModel):
    learner_id: str
    session_id: str
    recommended_difficulty: DifficultyEnum
    recommended_modality: ModalityEnum
    updated_mastery_map: Dict[str, float]
    engagement_level: EngagementLevelEnum
    frustration_risk: float
    suggested_break: bool
    next_skill_ids: List[str]
    xai_explanation: Dict[str, Any]
    confidence_score: float