from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class ActivityRecommendationRequest(BaseModel):
    learner_id: str
    current_skill_code: str
    current_mastery: float = Field(..., ge=0.0, le=1.0)
    engagement_score: float = Field(..., ge=0.0, le=1.0)
    support_level: str = Field("Moderated", description="Mild | Moderated | Strong")
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recent_performance: List[bool] = Field(default_factory=list, description="Recent correct/incorrect")
    preferred_modality: Optional[str] = None


class ActivityRecommendation(BaseModel):
    recommended_skill_code: str
    recommended_modality: str
    recommended_difficulty: int = Field(..., ge=1, le=5)
    difficulty_adjustment: int = Field(0, ge=-2, le=2)
    feedback_type: str
    confidence: float
    xai_explanation: str


class ActivityRecommendationResponse(BaseModel):
    learner_id: str
    recommendation: ActivityRecommendation
    alternative_recommendations: List[ActivityRecommendation]
    reasoning_chain: List[str]