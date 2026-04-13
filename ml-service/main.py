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
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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