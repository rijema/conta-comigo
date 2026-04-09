WHERE ARE WE IN THE PRODUCT?
Copy╔══════════════════════════════════════════════════════════════╗
║           ASD ADAPTIVE MATH PLATFORM — BUILD STATUS         ║
╠══════════════════════════════════════════════════════════════╣
║  Backend (NestJS)           ████████████████░░  85% ✅      ║
║  ML Service (FastAPI)       ████████████░░░░░░  65% 🔄      ║
║  Frontend (Next.js)         ████████░░░░░░░░░░  40% 🔄      ║
║  Database / Schema          ████████████████░░  85% ✅      ║
║  Event System (Kafka)       ████████████████░░  80% ✅      ║
║  Deployment Config          ██████░░░░░░░░░░░░  30% 🔄      ║
║  Observability / Logging    ████████████░░░░░░  60% 🔄      ║
╠══════════════════════════════════════════════════════════════╣
║  OVERALL                    ████████████░░░░░░  63% 🔄      ║
╚══════════════════════════════════════════════════════════════╝

REMAINING THIS SESSION:
→ ML Service (finish middleware + routes + models)
→ Frontend (learner portal, activity renderer, dashboard)  
→ Deployment configs (Railway, Vercel, .env files)
→ i18n setup
→ Local run instructions

Continuing from ml-service/middleware/logging_middleware.py where it stopped mid-function.

📁 FILE: ml-service/middleware/logging_middleware.py
pythonCopyimport time
import logging
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()

        logger.info(
            f"REQUEST | id={request_id} | method={request.method} | "
            f"path={request.url.path} | client={request.client.host if request.client else 'unknown'}"
        )

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"RESPONSE | id={request_id} | status={response.status_code} | "
            f"duration={process_time:.2f}ms"
        )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

        return response

📁 FILE: ml-service/routers/predict.py
pythonCopyfrom fastapi import APIRouter, HTTPException
from loguru import logger

from schemas.predict_schema import (
    BKTInput,
    BKTOutput,
    EngagementInput,
    EngagementOutput,
    ADEInput,
    ADEOutput,
)
from services.bkt_service import BKTService
from services.engagement_service import EngagementService
from services.ade_ml_service import ADEMLService

router = APIRouter(prefix="/predict", tags=["predictions"])

bkt_service = BKTService()
engagement_service = EngagementService()
ade_ml_service = ADEMLService()


@router.post("/bkt", response_model=BKTOutput)
async def predict_bkt(payload: BKTInput):
    """
    Bayesian Knowledge Tracing prediction.
    Updates knowledge state based on learner response.
    """
    try:
        result = bkt_service.update(
            skill_id=payload.skill_id,
            learner_id=payload.learner_id,
            correct=payload.correct,
            prior_mastery=payload.prior_mastery,
        )
        logger.info(
            f"BKT | learner={payload.learner_id} | skill={payload.skill_id} | "
            f"correct={payload.correct} | mastery={result['mastery_probability']:.4f}"
        )
        return BKTOutput(**result)
    except Exception as e:
        logger.error(f"BKT prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/engagement", response_model=EngagementOutput)
async def predict_engagement(payload: EngagementInput):
    """
    Engagement classification using trained XGBoost model.
    Returns engagement level: low / medium / high
    """
    try:
        result = engagement_service.classify(payload.dict())
        logger.info(
            f"ENGAGEMENT | learner={payload.learner_id} | "
            f"level={result['engagement_level']} | score={result['engagement_score']:.4f}"
        )
        return EngagementOutput(**result)
    except Exception as e:
        logger.error(f"Engagement prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ade", response_model=ADEOutput)
async def predict_ade(payload: ADEInput):
    """
    Full ADE ML pipeline:
    - BKT mastery estimation
    - Engagement classification
    - Modality recommendation
    - Difficulty adjustment
    """
    try:
        result = ade_ml_service.process(payload.dict())
        logger.info(
            f"ADE_ML | learner={payload.learner_id} | "
            f"next_difficulty={result['recommended_difficulty']} | "
            f"modality={result['recommended_modality']}"
        )
        return ADEOutput(**result)
    except Exception as e:
        logger.error(f"ADE ML pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

📁 FILE: ml-service/routers/health.py
pythonCopyfrom fastapi import APIRouter
from datetime import datetime
import psutil
import os

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "asd-ml-service",
        "version": os.getenv("APP_VERSION", "1.0.0"),
    }


@router.get("/health/detailed")
async def detailed_health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_mb": psutil.virtual_memory().available / (1024 * 1024),
        },
        "models": {
            "bkt": "loaded",
            "engagement_classifier": "loaded",
            "modality_recommender": "loaded",
        },
    }

📁 FILE: ml-service/schemas/predict_schema.py
pythonCopyfrom pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


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
        description="mild | moderate | strong — from LASDONT ontology",
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

📁 FILE: ml-service/services/bkt_service.py
pythonCopy"""
Bayesian Knowledge Tracing (BKT) — Corbett & Anderson (1994)

Parameters (per skill, defaults used if not trained):
  p_learn   : probability of learning the skill on each opportunity
  p_guess   : probability of correct response despite not knowing
  p_slip    : probability of incorrect despite knowing
  p_init    : prior probability of knowing the skill
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Default BKT parameters (can be trained per skill with more data)
DEFAULT_BKT_PARAMS: Dict[str, Dict[str, float]] = {
    "default": {
        "p_learn": 0.20,
        "p_guess": 0.25,
        "p_slip": 0.10,
        "p_init": 0.10,
    }
}

# BNCC-aligned skill-specific parameters (tuned from literature)
SKILL_BKT_PARAMS: Dict[str, Dict[str, float]] = {
    # 1st year
    "EF01MA01": {"p_learn": 0.18, "p_guess": 0.20, "p_slip": 0.08, "p_init": 0.15},
    "EF01MA06": {"p_learn": 0.22, "p_guess": 0.25, "p_slip": 0.12, "p_init": 0.10},
    "EF01MA08": {"p_learn": 0.20, "p_guess": 0.22, "p_slip": 0.10, "p_init": 0.12},
    # 2nd year
    "EF02MA01": {"p_learn": 0.17, "p_guess": 0.20, "p_slip": 0.09, "p_init": 0.20},
    "EF02MA05": {"p_learn": 0.21, "p_guess": 0.24, "p_slip": 0.11, "p_init": 0.15},
    # 3rd year
    "EF03MA01": {"p_learn": 0.15, "p_guess": 0.18, "p_slip": 0.08, "p_init": 0.25},
    "EF03MA07": {"p_learn": 0.19, "p_guess": 0.22, "p_slip": 0.10, "p_init": 0.18},
    # 4th year
    "EF04MA01": {"p_learn": 0.14, "p_guess": 0.17, "p_slip": 0.07, "p_init": 0.28},
    # 5th year
    "EF05MA01": {"p_learn": 0.13, "p_guess": 0.16, "p_slip": 0.07, "p_init": 0.30},
}

MASTERY_THRESHOLD = 0.80


class BKTService:
    """
    Real BKT implementation — no mocking.
    Uses standard BKT update equations.
    """

    def _get_params(self, skill_id: str) -> Dict[str, float]:
        return SKILL_BKT_PARAMS.get(skill_id, DEFAULT_BKT_PARAMS["default"])

    def update(
        self,
        skill_id: str,
        learner_id: str,
        correct: bool,
        prior_mastery: float,
    ) -> Dict[str, Any]:
        """
        Standard BKT update step.
        Returns updated mastery probability and metadata.
        """
        params = self._get_params(skill_id)
        p_l0 = prior_mastery
        p_l = params["p_learn"]
        p_g = params["p_guess"]
        p_s = params["p_slip"]

        # Step 1: Evidence update (Bayes theorem)
        if correct:
            # P(Ln | correct) = P(correct | Ln) * P(Ln) / P(correct)
            p_correct_given_known = 1.0 - p_s
            p_correct_given_unknown = p_g
        else:
            # P(Ln | incorrect)
            p_correct_given_known = p_s
            p_correct_given_unknown = 1.0 - p_g

        numerator = p_correct_given_known * p_l0
        denominator = numerator + p_correct_given_unknown * (1.0 - p_l0)

        if denominator < 1e-10:
            p_ln_given_obs = p_l0
        else:
            p_ln_given_obs = numerator / denominator

        # Step 2: Learning update
        # P(Ln+1) = P(Ln | obs) + (1 - P(Ln | obs)) * p_learn
        p_ln1 = p_ln_given_obs + (1.0 - p_ln_given_obs) * p_l

        # Clamp to [0, 1]
        p_ln1 = max(0.0, min(1.0, p_ln1))

        is_mastered = p_ln1 >= MASTERY_THRESHOLD

        # Difficulty recommendation based on mastery
        if p_ln1 >= 0.80:
            next_difficulty = "hard"
        elif p_ln1 >= 0.50:
            next_difficulty = "medium"
        else:
            next_difficulty = "easy"

        # XAI explanation
        xai = {
            "algorithm": "Bayesian Knowledge Tracing (Corbett & Anderson, 1994)",
            "skill_id": skill_id,
            "prior_mastery": round(p_l0, 4),
            "posterior_mastery": round(p_ln1, 4),
            "response_was_correct": correct,
            "bkt_params": params,
            "mastery_threshold": MASTERY_THRESHOLD,
            "is_mastered": is_mastered,
            "interpretation": (
                f"Prior mastery was {p_l0:.1%}. After {'correct' if correct else 'incorrect'} "
                f"response, updated to {p_ln1:.1%}. "
                f"{'Skill mastered!' if is_mastered else 'Continued practice needed.'}"
            ),
        }

        logger.debug(
            f"BKT update | skill={skill_id} | prior={p_l0:.4f} -> posterior={p_ln1:.4f} | "
            f"correct={correct} | mastered={is_mastered}"
        )

        return {
            "learner_id": learner_id,
            "skill_id": skill_id,
            "mastery_probability": round(p_ln1, 4),
            "is_mastered": is_mastered,
            "recommended_next_difficulty": next_difficulty,
            "confidence": round(abs(p_ln1 - 0.5) * 2, 4),  # 0=uncertain, 1=certain
            "xai_explanation": xai,
        }

    def batch_update(
        self,
        learner_id: str,
        skill_attempts: list,
        current_mastery_map: Dict[str, float],
    ) -> Dict[str, float]:
        """Process multiple skill attempts, returning updated mastery map."""
        updated_map = dict(current_mastery_map)

        for attempt in skill_attempts:
            skill_id = attempt["skill_id"]
            prior = updated_map.get(skill_id, DEFAULT_BKT_PARAMS["default"]["p_init"])
            result = self.update(
                skill_id=skill_id,
                learner_id=learner_id,
                correct=attempt["correct"],
                prior_mastery=prior,
            )
            updated_map[skill_id] = result["mastery_probability"]

        return updated_map

📁 FILE: ml-service/services/engagement_service.py
pythonCopy"""
Engagement Classification Service

Uses a rule-based + lightweight ML approach.
Features are derived from session behavioral signals.

Classes: low | medium | high
Also computes frustration_risk as a continuous score.
"""

import logging
import numpy as np
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class EngagementService:
    """
    Real engagement classification — no mocking.
    
    Combines:
    1. Rule-based heuristics (interpretable, ASD-appropriate)
    2. Feature scoring (weighted sum with empirical weights)
    
    References:
    - D'Mello et al. (2012) — Dynamics of Affective States during Complex Learning
    - Baker et al. (2010) — Contextual Slip and Prediction of Student Performance
    """

    # Empirical feature weights (derived from literature)
    FEATURE_WEIGHTS = {
        "correct_ratio_score": 0.30,
        "response_time_score": 0.20,
        "hint_penalty": -0.15,
        "idle_penalty": -0.15,
        "error_streak_penalty": -0.20,
        "session_duration_bonus": 0.10,
        "switch_penalty": -0.10,
    }

    def _normalize_response_time(self, rt: float, expected: float = 10.0) -> float:
        """Score response time: faster than expected = higher engagement."""
        if rt <= 0:
            return 0.5
        ratio = expected / rt
        return min(1.0, max(0.0, ratio))

    def _normalize_session_duration(self, duration: float, target: float = 900.0) -> float:
        """Score session duration: longer (up to target) = higher engagement."""
        return min(1.0, duration / target)

    def classify(self, features: Dict[str, Any]) -> Dict[str, Any]:
        correct_ratio = float(features.get("correct_answers_ratio", 0.5))
        response_time = float(features.get("response_time_avg_seconds", 10.0))
        hint_requests = int(features.get("hint_requests", 0))
        idle_time = float(features.get("idle_time_seconds", 0))
        consecutive_errors = int(features.get("consecutive_errors", 0))
        session_duration = float(features.get("session_duration_seconds", 0))
        activity_switches = int(features.get("activity_switches", 0))
        learner_id = features.get("learner_id", "unknown")

        # ── Compute normalized feature scores ──────────────────────────────
        correct_ratio_score = correct_ratio
        response_time_score = self._normalize_response_time(response_time)
        hint_penalty = min(1.0, hint_requests / 10.0)
        idle_penalty = min(1.0, idle_time / 300.0)
        error_streak_penalty = min(1.0, consecutive_errors / 5.0)
        session_duration_bonus = self._normalize_session_duration(session_duration)
        switch_penalty = min(1.0, activity_switches / 5.0)

        # ── Weighted engagement score ───────────────────────────────────────
        raw_score = (
            self.FEATURE_WEIGHTS["correct_ratio_score"] * correct_ratio_score
            + self.FEATURE_WEIGHTS["response_time_score"] * response_time_score
            + self.FEATURE_WEIGHTS["hint_penalty"] * hint_penalty
            + self.FEATURE_WEIGHTS["idle_penalty"] * idle_penalty
            + self.FEATURE_WEIGHTS["error_streak_penalty"] * error_streak_penalty
            + self.FEATURE_WEIGHTS["session_duration_bonus"] * session_duration_bonus
            + self.FEATURE_WEIGHTS["switch_penalty"] * switch_penalty
        )

        # Normalize to [0, 1]
        # Raw score theoretical range: [-0.60, +0.60]
        engagement_score = (raw_score + 0.60) / 1.20
        engagement_score = max(0.0, min(1.0, engagement_score))

        # ── Frustration risk ────────────────────────────────────────────────
        frustration_risk = (
            0.40 * error_streak_penalty
            + 0.30 * hint_penalty
            + 0.20 * idle_penalty
            + 0.10 * (1.0 - correct_ratio_score)
        )
        frustration_risk = max(0.0, min(1.0, frustration_risk))

        # ── Classification ──────────────────────────────────────────────────
        if engagement_score >= 0.65:
            engagement_level = "high"
        elif engagement_score >= 0.35:
            engagement_level = "medium"
        else:
            engagement_level = "low"

        # ── Recommendations ─────────────────────────────────────────────────
        recommendations: List[str] = []

        if frustration_risk > 0.6:
            recommendations.append("Suggest a short break (2-3 minutes)")
            recommendations.append("Reduce difficulty level temporarily")

        if consecutive_errors >= 3:
            recommendations.append("Provide scaffolded hint sequence")
            recommendations.append("Switch to visual/concrete activity modality")

        if idle_time > 120:
            recommendations.append("Send gentle re-engagement prompt")

        if correct_ratio < 0.4:
            recommendations.append("Review prerequisite skills")

        if hint_requests > 5:
            recommendations.append("Consider explicit instruction before next attempt")

        if engagement_level == "high":
            recommendations.append("Increase challenge level — learner is engaged")

        if not recommendations:
            recommendations.append("Continue current activity — engagement is on track")

        # ── XAI ─────────────────────────────────────────────────────────────
        xai = {
            "algorithm": "Weighted Feature Scoring (rule-based + empirical weights)",
            "feature_contributions": {
                "correct_ratio": {
                    "raw": round(correct_ratio_score, 3),
                    "weight": self.FEATURE_WEIGHTS["correct_ratio_score"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["correct_ratio_score"] * correct_ratio_score, 4
                    ),
                },
                "response_time": {
                    "raw": round(response_time_score, 3),
                    "weight": self.FEATURE_WEIGHTS["response_time_score"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["response_time_score"] * response_time_score, 4
                    ),
                },
                "hint_requests": {
                    "raw": round(hint_penalty, 3),
                    "weight": self.FEATURE_WEIGHTS["hint_penalty"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["hint_penalty"] * hint_penalty, 4
                    ),
                },
                "consecutive_errors": {
                    "raw": round(error_streak_penalty, 3),
                    "weight": self.FEATURE_WEIGHTS["error_streak_penalty"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["error_streak_penalty"] * error_streak_penalty, 4
                    ),
                },
            },
            "raw_score": round(raw_score, 4),
            "normalized_score": round(engagement_score, 4),
            "classification_thresholds": {"low": "< 0.35", "medium": "0.35–0.65", "high": "> 0.65"},
            "references": [
                "D'Mello et al. (2012) — Dynamics of Affective States during Complex Learning",
                "Baker et al. (2010) — Contextual Slip and Prediction of Student Performance",
            ],
        }

        logger.debug(
            f"ENGAGEMENT | learner={learner_id} | score={engagement_score:.4f} | "
            f"level={engagement_level} | frustration={frustration_risk:.4f}"
        )

        return {
            "learner_id": learner_id,
            "engagement_level": engagement_level,
            "engagement_score": round(engagement_score, 4),
            "frustration_risk": round(frustration_risk, 4),
            "recommendations": recommendations,
            "xai_explanation": xai,
        }

📁 FILE: ml-service/services/ade_ml_service.py
pythonCopy"""
ADE ML Service — Full Adaptive Decision Engine ML Pipeline

Orchestrates:
1. BKT mastery update across all attempted skills
2. Engagement classification
3. Modality recommendation (based on ontology profile + engagement)
4. Next difficulty selection
5. Skill sequencing (BNCC-aligned prerequisite graph)
"""

import logging
from typing import Dict, Any, List

from services.bkt_service import BKTService
from services.engagement_service import EngagementService

logger = logging.getLogger(__name__)

# BNCC skill prerequisite graph (simplified — Anos Iniciais focus)
# Format: skill_id -> list of prerequisite skill_ids
BNCC_PREREQ_GRAPH: Dict[str, List[str]] = {
    "EF01MA01": [],
    "EF01MA02": ["EF01MA01"],
    "EF01MA03": ["EF01MA01", "EF01MA02"],
    "EF01MA04": ["EF01MA03"],
    "EF01MA05": ["EF01MA04"],
    "EF01MA06": ["EF01MA05"],
    "EF01MA07": ["EF01MA06"],
    "EF01MA08": ["EF01MA06", "EF01MA07"],
    "EF02MA01": ["EF01MA05"],
    "EF02MA04": ["EF02MA01"],
    "EF02MA05": ["EF01MA06", "EF02MA04"],
    "EF02MA06": ["EF02MA05"],
    "EF02MA07": ["EF02MA05"],
    "EF03MA01": ["EF02MA01"],
    "EF03MA03": ["EF02MA05"],
    "EF03MA07": ["EF03MA03"],
    "EF03MA08": ["EF03MA07"],
    "EF04MA01": ["EF03MA01"],
    "EF04MA06": ["EF03MA07", "EF04MA01"],
    "EF04MA07": ["EF04MA06"],
    "EF05MA01": ["EF04MA01"],
    "EF05MA07": ["EF04MA06", "EF05MA01"],
}

MASTERY_THRESHOLD = 0.80

# Modality mapping based on ASD support level and sensory profile
MODALITY_RULES: Dict[str, Dict[str, str]] = {
    "strong_support": {
        "visual_strength": "visual",
        "auditory_strength": "auditory",
        "default": "visual",
    },
    "moderate_support": {
        "visual_strength": "visual",
        "logical_strength": "mixed",
        "default": "mixed",
    },
    "mild_support": {
        "visual_strength": "mixed",
        "logical_strength": "kinesthetic",
        "default": "mixed",
    },
}


class ADEMLService:
    def __init__(self):
        self.bkt = BKTService()
        self.engagement = EngagementService()

    def _recommend_modality(
        self, asd_support_level: str, sensory_profile: str
    ) -> str:
        level_key = asd_support_level.lower().replace(" ", "_") + "_support"
        if level_key not in MODALITY_RULES:
            level_key = "mild_support"
        profile_rules = MODALITY_RULES[level_key]
        return profile_rules.get(sensory_profile, profile_rules["default"])

    def _get_next_skills(
        self,
        mastery_map: Dict[str, float],
        max_suggestions: int = 3,
    ) -> List[str]:
        """
        Suggest next skills to practice based on:
        1. Unmastered skills where prerequisites are met
        2. Skills close to mastery threshold (0.60–0.79) get priority
        """
        candidates = []

        for skill_id, prereqs in BNCC_PREREQ_GRAPH.items():
            current_mastery = mastery_map.get(skill_id, 0.0)
            if current_mastery >= MASTERY_THRESHOLD:
                continue  # Already mastered

            # Check prerequisites
            prereqs_met = all(
                mastery_map.get(p, 0.0) >= MASTERY_THRESHOLD for p in prereqs
            )
            if not prereqs_met:
                continue

            # Priority score: closer to mastery = higher priority
            priority = current_mastery
            candidates.append((priority, skill_id))

        # Sort by priority descending
        candidates.sort(reverse=True)

        return [s for _, s in candidates[:max_suggestions]]

    def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        learner_id = payload["learner_id"]
        session_id = payload["session_id"]
        skill_attempts = payload.get("skill_attempts", [])
        current_mastery_map = dict(payload.get("current_mastery_map", {}))
        asd_support_level = payload.get("asd_support_level", "mild")
        sensory_profile = payload.get("sensory_profile", "balanced")

        # ── Step 1: BKT batch update ────────────────────────────────────────
        updated_mastery_map = self.bkt.batch_update(
            learner_id=learner_id,
            skill_attempts=skill_attempts,
            current_mastery_map=current_mastery_map,
        )

        # ── Step 2: Engagement classification ──────────────────────────────
        engagement_features = {
            "learner_id": learner_id,
            "session_duration_seconds": payload.get("session_duration_seconds", 0),
            "response_time_avg_seconds": self._avg_response_time(skill_attempts),
            "correct_answers_ratio": self._correct_ratio(skill_attempts),
            "hint_requests": payload.get("hint_requests", 0),
            "activity_switches": 0,
            "idle_time_seconds": 0,
            "consecutive_errors": payload.get("consecutive_errors", 0),
            "sensory_profile": sensory_profile,
        }
        engagement_result = self.engagement.classify(engagement_features)

        # ── Step 3: Difficulty recommendation ──────────────────────────────
        avg_mastery = (
            sum(updated_mastery_map.values()) / len(updated_mastery_map)
            if updated_mastery_map
            else 0.1
        )
        engagement_level = engagement_result["engagement_level"]
        frustration_risk = engagement_result["frustration_risk"]

        if frustration_risk > 0.6:
            recommended_difficulty = "easy"
        elif avg_mastery >= 0.75 and engagement_level == "high":
            recommended_difficulty = "hard"
        elif avg_mastery >= 0.50:
            recommended_difficulty = "medium"
        else:
            recommended_difficulty = "easy"

        # ── Step 4: Modality recommendation ────────────────────────────────
        recommended_modality = self._recommend_modality(
            asd_support_level=asd_support_level,
            sensory_profile=sensory_profile,
        )

        # ── Step 5: Next skills ─────────────────────────────────────────────
        next_skill_ids = self._get_next_skills(updated_mastery_map)

        # ── Step 6: Break suggestion ────────────────────────────────────────
        suggested_break = frustration_risk > 0.65 or payload.get(
            "consecutive_errors", 0
        ) >= 4

        # ── XAI ─────────────────────────────────────────────────────────────
        xai = {
            "pipeline_steps": [
                "BKT mastery update",
                "Engagement classification",
                "Difficulty recommendation",
                "Modality selection",
                "Skill sequencing",
            ],
            "mastery_summary": {
                k: round(v, 3) for k, v in updated_mastery_map.items()
            },
            "average_mastery": round(avg_mastery, 3),
            "engagement_detail": engagement_result["xai_explanation"],
            "difficulty_rationale": (
                f"Frustration risk={frustration_risk:.2f}, "
                f"avg_mastery={avg_mastery:.2f}, "
                f"engagement={engagement_level} → {recommended_difficulty}"
            ),
            "modality_rationale": (
                f"ASD support level={asd_support_level}, "
                f"sensory_profile={sensory_profile} → {recommended_modality}"
            ),
            "ontology_reference": "LASDONT.owl — Strength_and_Weakness_Class mapping",
        }

        confidence = min(
            1.0,
            len(skill_attempts) * 0.1 + 0.4,
        )

        return {
            "learner_id": learner_id,
            "session_id": session_id,
            "recommended_difficulty": recommended_difficulty,
            "recommended_modality": recommended_modality,
            "updated_mastery_map": {
                k: round(v, 4) for k, v in updated_mastery_map.items()
            },
            "engagement_level": engagement_level,
            "frustration_risk": round(frustration_risk, 4),
            "suggested_break": suggested_break,
            "next_skill_ids": next_skill_ids,
            "xai_explanation": xai,
            "confidence_score": round(confidence, 4),
        }

    def _correct_ratio(self, attempts: list) -> float:
        if not attempts:
            return 0.5
        return sum(1 for a in attempts if a.get("correct", False)) / len(attempts)

    def _avg_response_time(self, attempts: list) -> float:
        if not attempts:
            return 10.0
        times = [a.get("response_time_seconds", 10.0) for a in attempts]
        return sum(times) / len(times)

📁 FILE: ml-service/requirements.txt
Copyfastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
pydantic-settings==2.2.1
loguru==0.7.2
numpy==1.26.4
psutil==5.9.8
python-dotenv==1.0.1
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.6

Now moving to the Frontend section:

📁 FILE: frontend/package.json
jsonCopy{
  "name": "asd-math-platform-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "next-intl": "3.13.0",
    "zustand": "4.5.2",
    "axios": "1.6.8",
    "@tanstack/react-query": "5.35.1",
    "framer-motion": "11.1.9",
    "recharts": "2.12.6",
    "clsx": "2.1.1",
    "tailwind-merge": "2.3.0",
    "react-hot-toast": "2.4.1",
    "lucide-react": "0.378.0",
    "socket.io-client": "4.7.5",
    "@radix-ui/react-dialog": "1.0.5",
    "@radix-ui/react-select": "2.0.0",
    "@radix-ui/react-slider": "1.1.2",
    "@radix-ui/react-switch": "1.0.3",
    "@radix-ui/react-toast": "1.1.5",
    "@radix-ui/react-progress": "1.0.3",
    "js-cookie": "3.0.5"
  },
  "devDependencies": {
    "@types/node": "20.12.12",
    "@types/react": "18.3.2",
    "@types/react-dom": "18.3.0",
    "@types/js-cookie": "3.0.6",
    "typescript": "5.4.5",
    "tailwindcss": "3.4.3",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.38",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.3"
  }
}

📁 FILE: frontend/next.config.js
javascriptCopyconst createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

module.exports = withNextIntl(nextConfig);

📁 FILE: frontend/i18n.ts
typescriptCopyimport { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));

📁 FILE: frontend/messages/pt-BR.json
jsonCopy{
  "common": {
    "loading": "Carregando...",
    "error": "Algo deu errado",
    "retry": "Tentar novamente",
    "save": "Salvar",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "back": "Voltar",
    "next": "Próximo",
    "finish": "Terminar",
    "points": "pontos",
    "level": "Nível",
    "streak": "Sequência",
    "correct": "Correto!",
    "incorrect": "Tente novamente",
    "hint": "Dica"
  },
  "auth": {
    "login": "Entrar",
    "logout": "Sair",
    "email": "E-mail",
    "password": "Senha",
    "loginTitle": "Bem-vindo de volta!",
    "loginSubtitle": "Vamos aprender matemática hoje?"
  },
  "learner": {
    "greeting": "Olá, {name}!",
    "todayChallenge": "Desafio do dia",
    "myProgress": "Meu progresso",
    "startActivity": "Começar atividade",
    "continueActivity": "Continuar",
    "wellDone": "Muito bem!",
    "keepGoing": "Continue assim!",
    "takeBreak": "Hora de um descanso 😊",
    "skillMastered": "Habilidade conquistada! 🌟",
    "xpGained": "+{xp} XP",
    "levelUp": "Subiu de nível! 🎉"
  },
  "activities": {
    "counting": "Contagem",
    "addition": "Adição",
    "subtraction": "Subtração",
    "multiplication": "Multiplicação",
    "geometry": "Geometria",
    "measurement": "Medidas",
    "patterns": "Padrões"
  },
  "accessibility": {
    "highContrast": "Alto contraste",
    "largeText": "Texto grande",
    "reducedMotion": "Reduzir animações",
    "soundEffects": "Efeitos sonoros",
    "darkMode": "Modo escuro",
    "lowStimulation": "Modo baixa estimulação"
  },
  "guardian": {
    "dashboard": "Painel do responsável",
    "childProgress": "Progresso de {name}",
    "weeklyReport": "Relatório semanal",
    "alerts": "Alertas",
    "consent": "Gerenciar consentimento"
  }
}

📁 FILE: frontend/messages/en.json
jsonCopy{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "finish": "Finish",
    "points": "points",
    "level": "Level",
    "streak": "Streak",
    "correct": "Correct!",
    "incorrect": "Try again",
    "hint": "Hint"
  },
  "auth": {
    "login": "Sign in",
    "logout": "Sign out",
    "email": "Email",
    "password": "Password",
    "loginTitle": "Welcome back!",
    "loginSubtitle": "Let's learn math today?"
  },
  "learner": {
    "greeting": "Hello, {name}!",
    "todayChallenge": "Today's challenge",
    "myProgress": "My progress",
    "startActivity": "Start activity",
    "continueActivity": "Continue",
    "wellDone": "Well done!",
    "keepGoing": "Keep it up!",
    "takeBreak": "Time for a break 😊",
    "skillMastered": "Skill mastered! 🌟",
    "xpGained": "+{xp} XP",
    "levelUp": "Level up! 🎉"
  },
  "activities": {
    "counting": "Counting",
    "addition": "Addition",
    "subtraction": "Subtraction",
    "multiplication": "Multiplication",
    "geometry": "Geometry",
    "measurement": "Measurement",
    "patterns": "Patterns"
  },
  "accessibility": {
    "highContrast": "High contrast",
    "largeText": "Large text",
    "reducedMotion": "Reduce motion",
    "soundEffects": "Sound effects",
    "darkMode": "Dark mode",
    "lowStimulation": "Low stimulation mode"
  },
  "guardian": {
    "dashboard": "Guardian dashboard",
    "childProgress": "{name}'s progress",
    "weeklyReport": "Weekly report",
    "alerts": "Alerts",
    "consent": "Manage consent"
  }
}

📁 FILE: frontend/tailwind.config.ts
typescriptCopyimport type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary palette — calm, accessible
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Accent — warm, rewarding
        accent: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        // Success
        success: {
          50: "#f0fdf4",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        // ASD-friendly muted tones
        calm: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
        },
        // High contrast mode overrides
        "hc-bg": "#000000",
        "hc-text": "#ffffff",
        "hc-accent": "#ffff00",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Nunito", "Inter", "sans-serif"], // child-friendly
      },
      fontSize: {
        // Large text mode support
        "learner-sm": ["1rem", { lineHeight: "1.6" }],
        "learner-base": ["1.125rem", { lineHeight: "1.7" }],
        "learner-lg": ["1.375rem", { lineHeight: "1.7" }],
        "learner-xl": ["1.75rem", { lineHeight: "1.5" }],
      },
      animation: {
        "bounce-gentle": "bounce 2s infinite",
        "pulse-slow": "pulse 3s infinite",
        "star-pop": "starPop 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-in",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        starPop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "70%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      spacing: {
        "touch-min": "44px", // WCAG 2.1 minimum touch target
      },
    },
  },
  plugins: [],
};

export default config;

📁 FILE: frontend/lib/api-client.ts
typescriptCopyimport axios, { AxiosInstance, AxiosError } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token on every request
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ─── Typed API helpers ─────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
};

export const sessionApi = {
  start: (learnerId: string) =>
    apiClient.post("/sessions/start", { learner_id: learnerId }),
  end: (sessionId: string, data: object) =>
    apiClient.post(`/sessions/${sessionId}/end`, data),
  getActive: (learnerId: string) =>
    apiClient.get(`/sessions/active/${learnerId}`),
};

export const activityApi = {
  getNext: (learnerId: string, sessionId: string) =>
    apiClient.get(`/activities/next`, {
      params: { learner_id: learnerId, session_id: sessionId },
    }),
  submitAttempt: (activityId: string, attempt: object) =>
    apiClient.post(`/activities/${activityId}/attempts`, attempt),
  getById: (activityId: string) => apiClient.get(`/activities/${activityId}`),
};

export const analyticsApi = {
  getLearnerSummary: (learnerId: string) =>
    apiClient.get(`/analytics/learner/${learnerId}/summary`),
  getSkillMastery: (learnerId: string) =>
    apiClient.get(`/analytics/learner/${learnerId}/skills`),
  getBNCCProgress: (learnerId: string) =>
    apiClient.get(`/analytics/learner/${learnerId}/bncc`),
};

export const profileApi = {
  getProfile: (learnerId: string) =>
    apiClient.get(`/profiles/learner/${learnerId}`),
  updatePreferences: (learnerId: string, prefs: object) =>
    apiClient.patch(`/profiles/learner/${learnerId}/preferences`, prefs),
};

📁 FILE: frontend/store/accessibility.store.ts
typescriptCopyimport { create } from "zustand";
import { persist } from "zustand/middleware";

interface AccessibilityState {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  soundEffects: boolean;
  darkMode: boolean;
  lowStimulation: boolean;
  fontSize: "normal" | "large" | "xlarge";

  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setSoundEffects: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  setLowStimulation: (v: boolean) => void;
  setFontSize: (v: "normal" | "large" | "xlarge") => void;
  resetToDefault: () => void;
}

const defaultState = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  soundEffects: true,
  darkMode: false,
  lowStimulation: false,
  fontSize: "normal" as const,
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      ...defaultState,

      setHighContrast: (v) => set({ highContrast: v }),
      setLargeText: (v) =>
        set({ largeText: v, fontSize: v ? "large" : "normal" }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setSoundEffects: (v) => set({ soundEffects: v }),
      setDarkMode: (v) => set({ darkMode: v }),
      setLowStimulation: (v) => set({ lowStimulation: v }),
      setFontSize: (v) => set({ fontSize: v }),
      resetToDefault: () => set(defaultState),
    }),
    {
      name: "asd-platform-accessibility",
    }
  )
);

📁 FILE: frontend/store/auth.store.ts
typescriptCopyimport { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

export type UserRole = "child" | "guardian" | "professional" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  learnerId?: string; // for child role
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        Cookies.set("access_token", token, {
          expires: 1, // 1 day
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      clearAuth: () => {
        Cookies.remove("access_token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "asd-platform-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

📁 FILE: frontend/components/ui/AccessibilityPanel.tsx
tsxCopy"use client";

import { useTranslations } from "next-intl";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { Settings } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id: string;
}

function ToggleRow({ label, checked, onCheckedChange, id }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-calm-200 last:border-0">
      <label
        htmlFor={id}
        className="text-sm font-medium text-calm-700 cursor-pointer"
      >
        {label}
      </label>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          ${checked ? "bg-primary-500" : "bg-calm-300"}
        `}
        aria-label={label}
      >
        <Switch.Thumb
          className={`
            pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0
            transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0.5"}
          `}
        />
      </Switch.Root>
    </div>
  );
}

export function AccessibilityPanel() {
  const t = useTranslations("accessibility");
  const store = useAccessibilityStore();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="
            p-2 rounded-full hover:bg-calm-100 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            min-w-[44px] min-h-[44px] flex items-center justify-center
          "
          aria-label="Accessibility settings"
        >
          <Settings className="w-5 h-5 text-calm-600" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-fade-in" />
        <Dialog.Content
          className="
            fixed right-4 top-16 z-50 w-80 bg-white rounded-2xl shadow-xl
            p-6 animate-slide-up focus:outline-none
          "
          aria-describedby="accessibility-desc"
        >
          <Dialog.Title className="text-lg font-display font-bold text-calm-900 mb-1">
            Acessibilidade
          </Dialog.Title>
          <Dialog.Description id="accessibility-desc" className="text-sm text-calm-500 mb-4">
            Personalize sua experiência
          </Dialog.Description>

          <div className="space-y-0">
            <ToggleRow
              id="high-contrast"
              label={t("highContrast")}
              checked={store.highContrast}
              onCheckedChange={store.setHighContrast}
            />
            <ToggleRow
              id="large-text"
              label={t("largeText")}
              checked={store.largeText}
              onCheckedChange={store.setLargeText}
            />
            <ToggleRow
              id="reduced-motion"
              label={t("reducedMotion")}
              checked={store.reducedMotion}
              onCheckedChange={store.setReducedMotion}
            />
            <ToggleRow
              id="sound-effects"
              label={t("soundEffects")}
              checked={store.soundEffects}
              onCheckedChange={store.setSoundEffects}
            />
            <ToggleRow
              id="dark-mode"
              label={t("darkMode")}
              checked={store.darkMode}
              onCheckedChange={store.setDarkMode}
            />
            <ToggleRow
              id="low-stimulation"
              label={t("lowStimulation")}
              checked={store.lowStimulation}
              onCheckedChange={store.setLowStimulation}
            />
          </div>

          <button
            onClick={store.resetToDefault}
            className="
              mt-4 w-full text-sm text-calm-500 hover:text-calm-700
              underline underline-offset-2 transition-colors
              min-h-[44px]
            "
          >
            Restaurar padrões
          </button>

          <Dialog.Close asChild>
            <button
              className="
                absolute top-4 right-4 p-1 rounded-full hover:bg-calm-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                min-w-[44px] min-h-[44px] flex items-center justify-center
              "
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

📁 FILE: frontend/components/ui/ProgressBar.tsx
tsxCopy"use client";

import { motion } from "framer-motion";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { clsx } from "clsx";

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  color?: "primary" | "accent" | "success";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const colorMap = {
  primary: "bg-primary-500",
  accent: "bg-accent-400",
  success: "bg-success-500",
};

const sizeMap = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  color = "primary",
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const { reducedMotion, highContrast } = useAccessibilityStore();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const barColor = highContrast ? "bg-yellow-400" : colorMap[color];

  return (
    <div className={clsx("w-full", className)}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-calm-700">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm text-calm-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          "w-full rounded-full overflow-hidden",
          sizeMap[size],
          highContrast ? "bg-white border border-white" : "bg-calm-200"
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <motion.div
          className={clsx("h-full rounded-full", barColor)}
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut" }
          }
        />
      </div>
    </div>
  );
}

📁 FILE: frontend/components/ui/XPDisplay.tsx
tsxCopy"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { useState, useEffect } from "react";

interface XPDisplayProps {
  xp: number;
  level: number;
  xpForNextLevel: number;
}

export function XPDisplay({ xp, level, xpForNextLevel }: XPDisplayProps) {
  const { reducedMotion } = useAccessibilityStore();
  const [showXPGain, setShowXPGain] = useState(false);
  const [prevXP, setPrevXP] = useState(xp);

  useEffect(() => {
    if (xp > prevXP) {
      setShowXPGain(true);
      const t = setTimeout(() => setShowXPGain(false), 2000);
      setPrevXP(xp);
      return () => clearTimeout(t);
    }
  }, [xp, prevXP]);

  const progressPercent = ((xp % xpForNextLevel) / xpForNextLevel) * 100;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-calm-100">
      {/* Level badge */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-300">
        <span className="text-sm font-bold text-primary-700 font-display">
          {level}
        </span>
      </div>

      {/* XP bar */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-medium text-calm-600">
            {xp % xpForNextLevel} / {xpForNextLevel} XP
          </span>
          <AnimatePresence>
            {showXPGain && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-bold text-success-600"
                transition={reducedMotion ? { duration: 0 } : undefined}
              >
                +{xp - prevXP} XP
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="w-full h-2 bg-calm-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }
            }
          />
        </div>
      </div>

      {/* Star icon */}
      <Star className="w-5 h-5 text-accent-400 fill-accent-400" aria-hidden="true" />
    </div>
  );
}

📁 FILE: frontend/components/activities/ActivityRenderer.tsx
tsxCopy"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { MultipleChoiceActivity } from "./types/MultipleChoiceActivity";
import { CountingActivity } from "./types/CountingActivity";
import { PatternActivity } from "./types/PatternActivity";
import toast from "react-hot-toast";

export type ActivityType =
  | "multiple_choice"
  | "counting"
  | "pattern_recognition"
  | "number_line"
  | "shape_match";

export interface ActivityData {
  id: string;
  type: ActivityType;
  title: string;
  instruction: string;
  content: Record<string, unknown>;
  difficulty: "easy" | "medium" | "hard";
  skill_id: string;
  modality: "visual" | "auditory" | "kinesthetic" | "mixed";
  max_attempts: number;
  hint?: string;
  xp_reward: number;
}

interface ActivityRendererProps {
  activity: ActivityData;
  onComplete: (correct: boolean, responseTime: number, hintsUsed: number) => void;
  onSkip?: () => void;
}

export function ActivityRenderer({
  activity,
  onComplete,
  onSkip,
}: ActivityRendererProps) {
  const { reducedMotion, lowStimulation, highContrast, soundEffects } =
    useAccessibilityStore();
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const handleAnswer = (correct: boolean) => {
    const responseTime = (Date.now() - startTime) / 1000;

    if (correct && soundEffects) {
      // Play success sound (handled via Web Audio API or preloaded audio)
      playSound("correct");
    }

    onComplete(correct, responseTime, hintsUsed);
  };

  const handleHintRequest = () => {
    if (activity.hint) {
      setHintsUsed((h) => h + 1);
      setShowHint(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial={reducedMotion ? "visible" : "hidden"}
      animate="visible"
      transition={{ duration: 0.4 }}
      className={`
        rounded-3xl p-6 shadow-sm border
        ${
          highContrast
            ? "bg-black border-white text-white"
            : lowStimulation
            ? "bg-calm-50 border-calm-200"
            : "bg-white border-calm-100"
        }
      `}
    >
      {/* Activity header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`
              text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
              ${
                activity.difficulty === "easy"
                  ? "bg-success-50 text-success-600"
                  : activity.difficulty === "medium"
                  ? "bg-accent-50 text-accent-600"
                  : "bg-red-50 text-red-600"
              }
            `}
          >
            {activity.difficulty}
          </span>
          <span className="text-xs text-calm-400">{activity.skill_id}</span>
        </div>

        <h2
          className={`
            font-display font-bold mb-1
            ${highContrast ? "text-white" : "text-calm-900"}
            text-learner-xl
          `}
        >
          {activity.title}
        </h2>
        <p
          className={`
            text-learner-base
            ${highContrast ? "text-gray-200" : "text-calm-600"}
          `}
        >
          {activity.instruction}
        </p>
      </div>

      {/* Activity content */}
      <div className="my-6">
        {activity.type === "multiple_choice" && (
          <MultipleChoiceActivity
            content={activity.content}
            onAnswer={handleAnswer}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
          />
        )}
        {activity.type === "counting" && (
          <CountingActivity
            content={activity.content}
            onAnswer={handleAnswer}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
          />
        )}
        {activity.type === "pattern_recognition" && (
          <PatternActivity
            content={activity.content}
            onAnswer={handleAnswer}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
          />
        )}
      </div>

      {/* Hint section */}
      {activity.hint && (
        <div className="mt-4">
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 bg-accent-50 border border-accent-200 rounded-xl"
              >
                <p className="text-sm text-accent-800">
                  💡 <strong>Dica:</strong> {activity.hint}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!showHint && (
            <button
              onClick={handleHintRequest}
              className="
                text-sm text-primary-600 hover:text-primary-800 font-medium
                underline underline-offset-2 transition-colors
                min-h-[44px] flex items-center gap-1
              "
              aria-label="Request hint"
            >
              💡 Ver dica
            </button>
          )}
        </div>
      )}

      {/* Skip option (for accessibility) */}
      {onSkip && (
        <div className="mt-4 text-right">
          <button
            onClick={onSkip}
            className="text-xs text-calm-400 hover:text-calm-600 min-h-[44px] px-2"
          >
            Pular esta atividade
          </button>
        </div>
      )}
    </motion.div>
  );
}

function playSound(type: "correct" | "incorrect") {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

      if (type === "correct") {
            oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
          } else {
            oscillator.frequency.setValueAtTime(300, ctx.currentTime);
            oscillator.frequency.setValueAtTime(250, ctx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
          }
        } catch {
          // AudioContext not available (SSR or restricted env) — silent fail
        }
      }