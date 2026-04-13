from fastapi import APIRouter, Request
from schemas.bkt_schemas import BKTUpdateRequest, BKTUpdateResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/bkt", response_model=BKTUpdateResponse)
async def update_bkt(request: Request, body: BKTUpdateRequest):
    """
    Update Bayesian Knowledge Tracing state for a learner-skill pair.
    
    Returns updated mastery probability and recommended next difficulty.
    """
    try:
        bkt_service = request.app.state.bkt_service
        result = bkt_service.update_mastery(body)
        logger.info(
            f"[BKT] Learner={body.learner_id} Skill={body.skill_code} "
            f"Mastery: {body.current_mastery:.3f} → {result.updated_mastery:.3f}"
        )
        return result
    except Exception as e:
        logger.error(f"BKT update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))