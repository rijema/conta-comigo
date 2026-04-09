Bayesian Knowledge Tracing (BKT) Model
Implementation based on Corbett & Anderson (1994)

Parameters:
  P(L0) = Prior probability of knowing a skill
  P(T)  = Probability of learning transition (not knowing → knowing)
  P(G)  = Probability of guess (correct without knowledge)
  P(S)  = Probability of slip (incorrect despite knowledge)
"""

import numpy as np
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class BKTParameters:
    """BKT parameters per BNCC skill, initialized from literature defaults."""
    p_l0: float = 0.3    # Prior knowledge
    p_t: float = 0.1     # Learning rate (transition)
    p_g: float = 0.2     # Guess probability
    p_s: float = 0.1     # Slip probability

    def validate(self) -> None:
        for name, val in [
            ("p_l0", self.p_l0), ("p_t", self.p_t),
            ("p_g", self.p_g), ("p_s", self.p_s)
        ]:
            if not 0.0 <= val <= 1.0:
                raise ValueError(f"BKT parameter {name}={val} must be in [0, 1]")


@dataclass
class BKTState:
    """Current BKT state for a learner-skill pair."""
    learner_id: str
    skill_code: str
    mastery_probability: float = 0.3
    attempts: int = 0
    correct_count: int = 0
    history: List[Dict] = field(default_factory=list)


class BKTModel:
    """
    Real Bayesian Knowledge Tracing implementation.
    No mocking — actual BKT update equations.
    """

    # BNCC-skill-specific parameters (can be tuned from data)
    SKILL_PARAMETERS: Dict[str, BKTParameters] = {
        # Year 1 — easier skills, higher prior
        "EF01MA01": BKTParameters(p_l0=0.5, p_t=0.15, p_g=0.25, p_s=0.08),
        "EF01MA02": BKTParameters(p_l0=0.4, p_t=0.12, p_g=0.20, p_s=0.10),
        "EF01MA06": BKTParameters(p_l0=0.3, p_t=0.10, p_g=0.20, p_s=0.10),
        "EF01MA08": BKTParameters(p_l0=0.2, p_t=0.08, p_g=0.15, p_s=0.12),
        # Year 2
        "EF02MA05": BKTParameters(p_l0=0.3, p_t=0.10, p_g=0.18, p_s=0.10),
        "EF02MA07": BKTParameters(p_l0=0.2, p_t=0.08, p_g=0.15, p_s=0.12),
        # Year 3
        "EF03MA07": BKTParameters(p_l0=0.2, p_t=0.08, p_g=0.12, p_s=0.15),
        "EF03MA08": BKTParameters(p_l0=0.15, p_t=0.07, p_g=0.12, p_s=0.15),
    }

    DEFAULT_PARAMS = BKTParameters()

    def get_params(self, skill_code: str) -> BKTParameters:
        return self.SKILL_PARAMETERS.get(skill_code, self.DEFAULT_PARAMS)

    def update(
        self,
        current_mastery: float,
        is_correct: bool,
        skill_code: str,
    ) -> float:
        """
        BKT update equation:
        
        Step 1: P(L_n | correct) = P(L_{n-1}) * (1 - P(S)) / P(correct)
        Step 1: P(L_n | incorrect) = P(L_{n-1}) * P(S) / P(incorrect)
        Step 2: P(L_{n+1}) = P(L_n | evidence) * (1 - P(T)) + (1 - P(L_n | evidence)) ... wait
        
        Correct formulation (Corbett & Anderson 1994):
        P(correct | L) = 1 - P(S)
        P(correct | ~L) = P(G)
        
        P(L_n | obs) = P(L_{n-1} | obs_prev) updated by Bayes
        P(L_{n+1}) = P(L_n | obs) + (1 - P(L_n | obs)) * P(T)
        """
        params = self.get_params(skill_code)
        params.validate()

        p_l = current_mastery
        p_t = params.p_t
        p_g = params.p_g
        p_s = params.p_s

        # Step 1: Bayesian update given observation
        if is_correct:
            # P(correct) = P(L)*P(~S) + P(~L)*P(G)
            p_correct = p_l * (1 - p_s) + (1 - p_l) * p_g
            if p_correct == 0:
                p_correct = 1e-10
            # P(L | correct)
            p_l_given_obs = (p_l * (1 - p_s)) / p_correct
        else:
            # P(incorrect) = P(L)*P(S) + P(~L)*P(1-G)
            p_incorrect = p_l * p_s + (1 - p_l) * (1 - p_g)
            if p_incorrect == 0:
                p_incorrect = 1e-10
            # P(L | incorrect)
            p_l_given_obs = (p_l * p_s) / p_incorrect

        # Step 2: Learning transition
        p_l_next = p_l_given_obs + (1 - p_l_given_obs) * p_t

        # Clamp to [0, 1]
        p_l_next = float(np.clip(p_l_next, 0.0, 1.0))

        logger.info(
            f"[BKT] Skill={skill_code} | P(L)={current_mastery:.3f} → "
            f"P(L|obs)={p_l_given_obs:.3f} → P(L_next)={p_l_next:.3f} | "
            f"correct={is_correct}"
        )

        return p_l_next

    def update_sequence(
        self,
        initial_mastery: float,
        responses: List[bool],
        skill_code: str,
    ) -> List[float]:
        """Update BKT state over a sequence of responses."""
        mastery = initial_mastery
        history = [mastery]

        for response in responses:
            mastery = self.update(mastery, response, skill_code)
            history.append(mastery)

        return history

    def is_mastered(self, mastery: float, threshold: float = 0.95) -> bool:
        """Determine if a skill is mastered (default threshold: 0.95)."""
        return mastery >= threshold

    def recommend_difficulty(self, mastery: float) -> int:
        """Map mastery probability to activity difficulty (1-5)."""
        if mastery < 0.2:
            return 1
        elif mastery < 0.4:
            return 2
        elif mastery < 0.6:
            return 3
        elif mastery < 0.8:
            return 4
        else:
            return 5