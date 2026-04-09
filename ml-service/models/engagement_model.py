Engagement Classification Model
Uses gradient boosting (XGBoost/sklearn) to classify learner engagement level.

Features:
  - response_time_ms: Time taken to respond
  - hints_used: Number of hints requested
  - attempts_count: Number of attempts on this activity
  - error_rate: Rate of errors in session
  - session_duration_minutes: Current session length
  - time_of_day_hour: Hour of day (circadian)
  - consecutive_correct: Streak of correct answers

Output:
  - engagement_level: 'high', 'medium', 'low', 'disengaged'
  - engagement_score: float [0, 1]
  - confidence: float [0, 1]
"""

import numpy as np
import logging
from typing import Dict, List, Tuple
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

logger = logging.getLogger(__name__)


class EngagementModel:
    """
    Real engagement classification model.
    Uses GradientBoostingClassifier trained on synthetic-but-realistic data.
    In production: retrain monthly with real interaction logs.
    """

    FEATURE_NAMES = [
        "response_time_ms_normalized",
        "hints_used",
        "attempts_count",
        "error_rate",
        "session_duration_minutes",
        "time_of_day_hour",
        "consecutive_correct",
        "mastery_probability",
    ]

    ENGAGEMENT_LEVELS = ["disengaged", "low", "medium", "high"]
    ENGAGEMENT_SCORES = {"disengaged": 0.1, "low": 0.35, "medium": 0.65, "high": 0.9}

    def __init__(self):
        self.model: GradientBoostingClassifier | None = None
        self.scaler = StandardScaler()
        self._load_or_train()

    def _load_or_train(self) -> None:
        model_path = os.getenv("MODEL_PATH", "/app/models/engagement_model.joblib")

        if os.path.exists(model_path):
            try:
                loaded = joblib.load(model_path)
                self.model = loaded["model"]
                self.scaler = loaded["scaler"]
                logger.info(f"Engagement model loaded from {model_path}")
                return
            except Exception as e:
                logger.warning(f"Could not load model: {e}. Training new model.")

        self._train_initial_model()

    def _generate_synthetic_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate synthetic training data based on research literature
        on ASD learner engagement patterns.
        
        High engagement: fast responses, few hints, low errors, medium session
        Low engagement: slow responses, many hints, high errors
        Disengaged: very slow, many hints, consecutive wrong
        """
        np.random.seed(42)
        n_samples = 2000
        X_list = []
        y_list = []

        # High engagement (class 3)
        n_high = n_samples // 4
        X_list.append(np.column_stack([
            np.random.normal(0.3, 0.1, n_high),      # fast normalized response
            np.random.randint(0, 2, n_high),           # hints 0-1
            np.random.randint(1, 2, n_high),           # attempts 1
            np.random.beta(1, 4, n_high),              # low error rate
            np.random.uniform(5, 20, n_high),          # 5-20 min session
            np.random.uniform(8, 18, n_high),          # productive hours
            np.random.randint(3, 8, n_high),           # good streak
            np.random.uniform(0.6, 1.0, n_high),       # high mastery
        ]))
        y_list.extend([3] * n_high)

        # Medium engagement (class 2)
        n_med = n_samples // 4
        X_list.append(np.column_stack([
            np.random.normal(0.5, 0.15, n_med),
            np.random.randint(1, 3, n_med),
            np.random.randint(1, 3, n_med),
            np.random.beta(2, 3, n_med),
            np.random.uniform(10, 30, n_med),
            np.random.uniform(6, 20, n_med),
            np.random.randint(1, 5, n_med),
            np.random.uniform(0.3, 0.7, n_med),
        ]))
        y_list.extend([2] * n_med)

        # Low engagement (class 1)
        n_low = n_samples // 4
        X_list.append(np.column_stack([
            np.random.normal(0.7, 0.15, n_low),
            np.random.randint(2, 5, n_low),
            np.random.randint(2, 4, n_low),
            np.random.beta(3, 2, n_low),
            np.random.uniform(20, 45, n_low),
            np.random.uniform(0, 24, n_low),
            np.random.randint(0, 3, n_low),
            np.random.uniform(0.1, 0.4, n_low),
        ]))
        y_list.extend([1] * n_low)

        # Disengaged (class 0)
        n_dis = n_samples // 4
        X_list.append(np.column_stack([
            np.random.normal(0.9, 0.1, n_dis),
            np.random.randint(4, 8, n_dis),
            np.random.randint(3, 6, n_dis),
            np.random.beta(4, 1, n_dis),
            np.random.uniform(30, 60, n_dis),
            np.random.uniform(0, 24, n_dis),
            np.zeros(n_dis),
            np.random.uniform(0.0, 0.2, n_dis),
        ]))
        y_list.extend([0] * n_dis)

        X = np.vstack(X_list)
        y = np.array(y_list)

        # Shuffle
        idx = np.random.permutation(len(y))
        return X[idx], y[idx]

    def _train_initial_model(self) -> None:
        logger.info("Training engagement model on synthetic data...")
        X, y = self._generate_synthetic_training_data()
        X_scaled = self.scaler.fit_transform(X)

        self.model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            random_state=42,
        )
        self.model.fit(X_scaled, y)

        # Save model
        model_dir = os.path.dirname(os.getenv("MODEL_PATH", "/app/models/engagement_model.joblib"))
        os.makedirs(model_dir, exist_ok=True)

        try:
            joblib.dump(
                {"model": self.model, "scaler": self.scaler},
                os.getenv("MODEL_PATH", "/app/models/engagement_model.joblib"),
            )
        except Exception as e:
            logger.warning(f"Could not save model: {e}")

        logger.info("Engagement model trained successfully")

    def predict(self, features: Dict) -> Dict:
        """Predict engagement level from behavioral features."""
        if self.model is None:
            raise RuntimeError("Engagement model not initialized")

        # Normalize response time (assume max 60000ms = 1.0)
        rt_normalized = min(features.get("response_time_ms", 30000) / 60000.0, 1.0)

        feature_vector = np.array([[
            rt_normalized,
            features.get("hints_used", 0),
            features.get("attempts_count", 1),
            features.get("error_rate", 0.0),
            features.get("session_duration_minutes", 10.0),
            features.get("time_of_day_hour", 10.0),
            features.get("consecutive_correct", 0),
            features.get("mastery_probability", 0.3),
        ]])

        feature_scaled = self.scaler.transform(feature_vector)
        class_idx = int(self.model.predict(feature_scaled)[0])
        probabilities = self.model.predict_proba(feature_scaled)[0]

        level = self.ENGAGEMENT_LEVELS[class_idx]
        score = self.ENGAGEMENT_SCORES[level]
        confidence = float(probabilities[class_idx])

        # Feature importance for XAI
        importance = dict(zip(
            self.FEATURE_NAMES,
            self.model.feature_importances_.tolist(),
        ))

        logger.info(
            f"[ENGAGEMENT] Level={level} Score={score:.2f} "
            f"Confidence={confidence:.2f}"
        )

        return {
            "engagement_level": level,
            "engagement_score": score,
            "confidence": confidence,
            "class_index": class_idx,
            "xai_feature_importance": importance,
        }