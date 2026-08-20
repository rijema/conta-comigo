"""ADE ML Service - Full Adaptive Decision Engine ML Pipeline

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

# BNCC skill prerequisite graph (simplified - Anos Iniciais focus)
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
            "ontology_reference": "LASDONT.owl - Strength_and_Weakness_Class mapping",
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
