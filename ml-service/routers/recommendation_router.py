from schemas.recommendation_schemas import (
    ActivityRecommendationRequest,
    ActivityRecommendationResponse,
    ActivityRecommendation,
)
import logging
import re

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_next_skill(current_code: str, mastery: float) -> str:
    """Simple skill progression based on BNCC sequence."""
    # Extract year and number
    match = re.match(r"EF(\d{2})MA(\d{2})", current_code)
    if not match:
        return current_code

    year = int(match.group(1))
    num = int(match.group(2))

    if mastery >= 0.95:
        # Mastered → advance to next skill
        next_num = num + 1
        if next_num > 25:  # Rough limit per year
            year = min(year + 1, 5)
            next_num = 1
        return f"EF{year:02d}MA{next_num:02d}"
    else:
        # Not mastered → stay or remediate
        return current_code


@router.post("/next-activity", response_model=ActivityRecommendationResponse)
async def recommend_next_activity(
    request: Request, body: ActivityRecommendationRequest
):
    """
    Recommend next activity based on BKT state, engagement, and ontology profile.
    Combines ML predictions with ontology reasoning.
    """
    try:
        # Determine modality based on strengths (ontology-aware)
        modality = body.preferred_modality or _infer_modality(body.strengths, body.weaknesses)

        # Determine difficulty from mastery + engagement
        base_difficulty = _mastery_to_difficulty(body.current_mastery)
        engagement_adjustment = _engagement_to_adjustment(body.engagement_score)
        final_difficulty = max(1, min(5, base_difficulty + engagement_adjustment))

        # Determine next skill
        next_skill = _get_next_skill(body.current_skill_code, body.current_mastery)

        # Feedback type based on support level
        feedback_type = _support_level_to_feedback(body.support_level)

        # Build reasoning chain (XAI)
        reasoning_chain = [
            f"Current mastery for {body.current_skill_code}: {body.current_mastery:.2f}",
            f"Engagement score: {body.engagement_score:.2f}",
            f"Support level: {body.support_level}",
            f"Learner strengths: {', '.join(body.strengths) or 'none identified'}",
            f"Recommended modality: {modality} (from ontology inference)",
            f"Base difficulty: {base_difficulty}, engagement adjustment: {engagement_adjustment:+d}",
            f"Final difficulty: {final_difficulty}",
            f"Next skill: {next_skill}",
        ]

        primary = ActivityRecommendation(
            recommended_skill_code=next_skill,
            recommended_modality=modality,
            recommended_difficulty=final_difficulty,
            difficulty_adjustment=engagement_adjustment,
            feedback_type=feedback_type,
            confidence=0.82,
            xai_explanation=" | ".join(reasoning_chain),
        )

        # Alternative with different modality
        alt_modality = "text" if modality != "text" else "visual"
        alternative = ActivityRecommendation(
            recommended_skill_code=body.current_skill_code,  # Remediation
            recommended_modality=alt_modality,
            recommended_difficulty=max(1, final_difficulty - 1),
            difficulty_adjustment=-1,
            feedback_type="encouraging",
            confidence=0.65,
            xai_explanation=f"Alternative: remediation with {alt_modality} modality",
        )

        logger.info(
            f"[RECOMMEND] Learner={body.learner_id} "
            f"→ Skill={next_skill} Modality={modality} Difficulty={final_difficulty}"
        )

        return ActivityRecommendationResponse(
            learner_id=body.learner_id,
            recommendation=primary,
            alternative_recommendations=[alternative],
            reasoning_chain=reasoning_chain,
        )

    except Exception as e:
        logger.error(f"Recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _mastery_to_difficulty(mastery: float) -> int:
    if mastery < 0.2: return 1
    elif mastery < 0.4: return 2
    elif mastery < 0.6: return 3
    elif mastery < 0.8: return 4
    else: return 5


def _engagement_to_adjustment(engagement: float) -> int:
    if engagement < 0.25: return -2   # Very disengaged → much easier
    elif engagement < 0.45: return -1  # Low → easier
    elif engagement > 0.80: return 1   # High → can try harder
    return 0


def _infer_modality(strengths: list, weaknesses: list) -> str:
    if "Visual" in strengths: return "visual"
    if "Auditive" in strengths: return "auditory"
    if "Logical" in strengths: return "text"
    if "Motor" in weaknesses: return "video"  # Less motor demand
    return "visual"  # Default for ASD (LASDONT recommendation)


def _support_level_to_feedback(support_level: str) -> str:
    return {
        "Strong": "simplified_immediate",
        "Moderated": "guided",
        "Mild": "explanatory",
    }.get(support_level, "guided")