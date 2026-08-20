"""
ASD Adaptive Math Platform - ML Service
FastAPI application serving BKT, engagement classification, and modality recommendation.

Architecture:
  POST /predict/bkt         - Bayesian Knowledge Tracing update
  POST /predict/engagement  - Engagement level classification  
  POST /predict/next-activity - Next activity recommendation
  GET  /health              - Health check
"""

import os
import logging
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field

from routers import bkt_router, engagement_router, recommendation_router
from middleware.logging_middleware import LoggingMiddleware

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ML Service starting up...")
    # Pre-load models on startup
    from services.bkt_service import BKTService
    from services.engagement_service import EngagementService
    app.state.bkt_service = BKTService()
    app.state.engagement_service = EngagementService()
    logger.info("ML models loaded successfully")
    yield
    logger.info("ML Service shutting down...")


app = FastAPI(
    title="ASD Adaptive Math - ML Service",
    description="Real BKT, engagement classification, and adaptive recommendation engine",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("BACKEND_URL", "http://localhost:3000"),
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom logging middleware
app.add_middleware(LoggingMiddleware)

# Routers
app.include_router(bkt_router.router, prefix="/predict", tags=["BKT"])
app.include_router(engagement_router.router, prefix="/predict", tags=["Engagement"])
app.include_router(recommendation_router.router, prefix="/predict", tags=["Recommendation"])


class BackendAttempt(BaseModel):
    isCorrect: bool
    timeSpentSeconds: float = 0
    hintsUsed: int = 0
    interactionSignals: Dict[str, Any] = Field(default_factory=dict)


class BackendPredictionRequest(BaseModel):
    userId: str
    recentAttempts: List[BackendAttempt] = Field(default_factory=list)
    currentSkillCode: str
    bnccSkills: List[str] = Field(default_factory=list)
    asdSupportLevel: str = "moderate"
    strengths: Dict[str, bool] = Field(default_factory=dict)
    weaknesses: Dict[str, bool] = Field(default_factory=dict)


@app.post("/predict")
async def backend_prediction(body: BackendPredictionRequest):
    """Compatibility endpoint consumed by the NestJS adaptive engine."""
    attempts = body.recentAttempts
    accuracy = sum(1 for attempt in attempts if attempt.isCorrect) / len(attempts) if attempts else 0.5
    hint_penalty = min(0.2, sum(attempt.hintsUsed for attempt in attempts) * 0.02)
    mastery = max(0.05, min(0.95, 0.3 + accuracy * 0.65 - hint_penalty))
    engagement = max(0.1, min(0.95, 0.35 + accuracy * 0.55 - hint_penalty))
    modality = next((name for name, enabled in body.strengths.items() if enabled), "visual")
    return {
        "masteryProbability": mastery,
        "engagementScore": engagement,
        "modalityRecommendation": modality,
        "confidence": 0.75 if attempts else 0.4,
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0",
        "models": {
            "bkt": "loaded",
            "engagement": "loaded",
        },
    }
