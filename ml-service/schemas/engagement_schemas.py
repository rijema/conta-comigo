from typing import List, Dict, Optional
from enum import Enum


class EngagementLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    DISENGAGED = "disengaged"


class EngagementRequest(BaseModel):
    response_time_ms: int = Field(..., ge=0, description="Response time in milliseconds")
    hints_used: int = Field(0, ge=0, description="Number of hints requested")
    attempts_count: int = Field(1, ge=1, description="Number of attempts")
    error_rate: float = Field(0.0, ge=0.0, le=1.0, description="Error rate in session")
    session_duration_minutes: float = Field(10.0, ge=0.0, description="Session duration")
    time_of_day_hour: float = Field(10.0, ge=0.0, le=23.99, description="Hour of day")
    consecutive_correct: int = Field(0, ge=0, description="Consecutive correct answers")
    mastery_probability: float = Field(0.3, ge=0.0, le=1.0, description="Current BKT mastery")
    learner_id: Optional[str] = None


class EngagementResponse(BaseModel):
    engagement_level: EngagementLevel
    engagement_score: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    intervention_suggestions: List[str]
    xai_feature_importance: Dict[str, float]