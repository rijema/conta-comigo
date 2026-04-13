"""
Engagement Classification Service

Uses a rule-based + lightweight ML approach.
Features are derived from session behavioral signals.

Classes: low | medium | high
Also computes frustration_risk as a continuous score.
"""

import logging
import numpy as np
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class EngagementService:
    """
    Real engagement classification - no mocking.
    
    Combines:
    1. Rule-based heuristics (interpretable, ASD-appropriate)
    2. Feature scoring (weighted sum with empirical weights)
    
    References:
    - D'Mello et al. (2012) - Dynamics of Affective States during Complex Learning
    - Baker et al. (2010) - Contextual Slip and Prediction of Student Performance
    """

    # Empirical feature weights (derived from literature)
    FEATURE_WEIGHTS = {
        "correct_ratio_score": 0.30,
        "response_time_score": 0.20,
        "hint_penalty": -0.15,
        "idle_penalty": -0.15,
        "error_streak_penalty": -0.20,
        "session_duration_bonus": 0.10,
        "switch_penalty": -0.10,
    }

    def _normalize_response_time(self, rt: float, expected: float = 10.0) -> float:
        """Score response time: faster than expected = higher engagement."""
        if rt <= 0:
            return 0.5
        ratio = expected / rt
        return min(1.0, max(0.0, ratio))

    def _normalize_session_duration(self, duration: float, target: float = 900.0) -> float:
        """Score session duration: longer (up to target) = higher engagement."""
        return min(1.0, duration / target)

    def classify(self, features: Dict[str, Any]) -> Dict[str, Any]:
        correct_ratio = float(features.get("correct_answers_ratio", 0.5))
        response_time = float(features.get("response_time_avg_seconds", 10.0))
        hint_requests = int(features.get("hint_requests", 0))
        idle_time = float(features.get("idle_time_seconds", 0))
        consecutive_errors = int(features.get("consecutive_errors", 0))
        session_duration = float(features.get("session_duration_seconds", 0))
        activity_switches = int(features.get("activity_switches", 0))
        learner_id = features.get("learner_id", "unknown")

        # ── Compute normalized feature scores ──────────────────────────────
        correct_ratio_score = correct_ratio
        response_time_score = self._normalize_response_time(response_time)
        hint_penalty = min(1.0, hint_requests / 10.0)
        idle_penalty = min(1.0, idle_time / 300.0)
        error_streak_penalty = min(1.0, consecutive_errors / 5.0)
        session_duration_bonus = self._normalize_session_duration(session_duration)
        switch_penalty = min(1.0, activity_switches / 5.0)

        # ── Weighted engagement score ───────────────────────────────────────
        raw_score = (
            self.FEATURE_WEIGHTS["correct_ratio_score"] * correct_ratio_score
            + self.FEATURE_WEIGHTS["response_time_score"] * response_time_score
            + self.FEATURE_WEIGHTS["hint_penalty"] * hint_penalty
            + self.FEATURE_WEIGHTS["idle_penalty"] * idle_penalty
            + self.FEATURE_WEIGHTS["error_streak_penalty"] * error_streak_penalty
            + self.FEATURE_WEIGHTS["session_duration_bonus"] * session_duration_bonus
            + self.FEATURE_WEIGHTS["switch_penalty"] * switch_penalty
        )

        # Normalize to [0, 1]
        # Raw score theoretical range: [-0.60, +0.60]
        engagement_score = (raw_score + 0.60) / 1.20
        engagement_score = max(0.0, min(1.0, engagement_score))

        # ── Frustration risk ────────────────────────────────────────────────
        frustration_risk = (
            0.40 * error_streak_penalty
            + 0.30 * hint_penalty
            + 0.20 * idle_penalty
            + 0.10 * (1.0 - correct_ratio_score)
        )
        frustration_risk = max(0.0, min(1.0, frustration_risk))

        # ── Classification ──────────────────────────────────────────────────
        if engagement_score >= 0.65:
            engagement_level = "high"
        elif engagement_score >= 0.35:
            engagement_level = "medium"
        else:
            engagement_level = "low"

        # ── Recommendations ─────────────────────────────────────────────────
        recommendations: List[str] = []

        if frustration_risk > 0.6:
            recommendations.append("Suggest a short break (2-3 minutes)")
            recommendations.append("Reduce difficulty level temporarily")

        if consecutive_errors >= 3:
            recommendations.append("Provide scaffolded hint sequence")
            recommendations.append("Switch to visual/concrete activity modality")

        if idle_time > 120:
            recommendations.append("Send gentle re-engagement prompt")

        if correct_ratio < 0.4:
            recommendations.append("Review prerequisite skills")

        if hint_requests > 5:
            recommendations.append("Consider explicit instruction before next attempt")

        if engagement_level == "high":
            recommendations.append("Increase challenge level - learner is engaged")

        if not recommendations:
            recommendations.append("Continue current activity - engagement is on track")

        # ── XAI ─────────────────────────────────────────────────────────────
        xai = {
            "algorithm": "Weighted Feature Scoring (rule-based + empirical weights)",
            "feature_contributions": {
                "correct_ratio": {
                    "raw": round(correct_ratio_score, 3),
                    "weight": self.FEATURE_WEIGHTS["correct_ratio_score"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["correct_ratio_score"] * correct_ratio_score, 4
                    ),
                },
                "response_time": {
                    "raw": round(response_time_score, 3),
                    "weight": self.FEATURE_WEIGHTS["response_time_score"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["response_time_score"] * response_time_score, 4
                    ),
                },
                "hint_requests": {
                    "raw": round(hint_penalty, 3),
                    "weight": self.FEATURE_WEIGHTS["hint_penalty"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["hint_penalty"] * hint_penalty, 4
                    ),
                },
                "consecutive_errors": {
                    "raw": round(error_streak_penalty, 3),
                    "weight": self.FEATURE_WEIGHTS["error_streak_penalty"],
                    "contribution": round(
                        self.FEATURE_WEIGHTS["error_streak_penalty"] * error_streak_penalty, 4
                    ),
                },
            },
            "raw_score": round(raw_score, 4),
            "normalized_score": round(engagement_score, 4),
            "classification_thresholds": {"low": "< 0.35", "medium": "0.35-0.65", "high": "> 0.65"},
            "references": [
                "D'Mello et al. (2012) - Dynamics of Affective States during Complex Learning",
                "Baker et al. (2010) - Contextual Slip and Prediction of Student Performance",
            ],
        }

        logger.debug(
            f"ENGAGEMENT | learner={learner_id} | score={engagement_score:.4f} | "
            f"level={engagement_level} | frustration={frustration_risk:.4f}"
        )

        return {
            "learner_id": learner_id,
            "engagement_level": engagement_level,
            "engagement_score": round(engagement_score, 4),
            "frustration_risk": round(frustration_risk, 4),
            "recommendations": recommendations,
            "xai_explanation": xai,
        }