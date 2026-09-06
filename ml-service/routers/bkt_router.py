from fastapi import APIRouter, Request, HTTPException
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
        result = bkt_service.update(
            skill_id=body.skill_code,
            learner_id=body.learner_id or "anonymous",
            correct=body.is_correct,
            prior_mastery=body.current_mastery,
        )
        logger.info(
            f"[BKT] Learner={body.learner_id} Skill={body.skill_code} "
            f"Mastery: {body.current_mastery:.3f} → {result['mastery_probability']:.3f}"
        )
        difficulty = {"easy": 1, "medium": 3, "hard": 5}[
            result["recommended_next_difficulty"]
        ]
        return BKTUpdateResponse(
            skill_code=body.skill_code,
            previous_mastery=body.current_mastery,
            updated_mastery=result["mastery_probability"],
            is_mastered=result["is_mastered"],
            recommended_difficulty=difficulty,
            xai_explanation=result["xai_explanation"]["interpretation"],
            bkt_params=result["xai_explanation"]["bkt_params"],
        )
    except Exception as e:
        logger.error(f"BKT update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
