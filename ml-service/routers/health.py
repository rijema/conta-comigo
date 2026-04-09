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