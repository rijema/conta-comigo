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