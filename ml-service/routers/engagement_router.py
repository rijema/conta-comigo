from schemas.engagement_schemas import EngagementRequest, EngagementResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/engagement", response_model=EngagementResponse)
async def classify_engagement(request: Request, body: EngagementRequest):
    """
    Classify learner engagement level from behavioral signals.
    Returns engagement level with ASD-specific intervention suggestions.
    """
    try:
        engagement_service = request.app.state.engagement_service
        result = engagement_service.classify_engagement(body)
        logger.info(
            f"[ENGAGEMENT] Learner={body.learner_id} "
            f"Level={result.engagement_level} Score={result.engagement_score:.2f}"
        )
        return result
    except Exception as e:
        logger.error(f"Engagement classification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))