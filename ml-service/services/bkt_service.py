"""
Bayesian Knowledge Tracing (BKT) - Corbett & Anderson (1994)

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
    Real BKT implementation - no mocking.
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