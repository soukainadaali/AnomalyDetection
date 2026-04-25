"""Prediction API routes."""

from __future__ import annotations

from typing import Any

import numpy as np
from flask import Blueprint, current_app, jsonify, request

from utils.preprocessing import ValidationError, build_model_dataframe

predict_bp = Blueprint("predict", __name__, url_prefix="")

CLASS_LABELS = {0: "NONE", 1: "MINR", 2: "SERS", 3: "FATL"}
CLASS_SEVERITY_WEIGHT = {0: 0.0, 1: 0.33, 2: 0.66, 3: 1.0}


def _compute_uncertainty(conformal_predictor, x_selected, alpha: float = 0.1) -> list[str]:
    """Compute conformal prediction set labels for uncertainty interval."""
    try:
        _, y_sets = conformal_predictor.predict(x_selected, alpha=alpha)
        y_sets = np.asarray(y_sets)
        if y_sets.ndim == 3:
            y_sets = y_sets[:, :, 0]
        active_labels = np.where(y_sets[0])[0]
        return [CLASS_LABELS.get(int(idx), str(idx)) for idx in active_labels]
    except Exception:
        # Fallback when MAPIE artifact cannot produce set predictions.
        return []


@predict_bp.post("/predict")
def predict_risk():
    """Predict injury severity class with confidence and uncertainty."""
    payload: dict[str, Any] = request.get_json(silent=True) or {}

    try:
        input_df = build_model_dataframe(payload)
    except ValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    try:
        artifacts = current_app.extensions["ml_artifacts"]
        preprocessing_pipeline = artifacts["preprocessing_pipeline"]
        variance_threshold = artifacts["variance_threshold"]
        model = artifacts["model"]
        conformal_predictor = artifacts["conformal_predictor"]

        # Apply preprocessing and feature selection.
        x_transformed = preprocessing_pipeline.transform(input_df)
        x_selected = variance_threshold.transform(x_transformed)

        # Class prediction and probabilities.
        class_idx = int(model.predict(x_selected)[0])
        proba = model.predict_proba(x_selected)[0]
        confidence = float(np.max(proba))
        prediction_label = CLASS_LABELS.get(class_idx, str(class_idx))

        # Risk score emphasizes high-severity outcomes.
        risk_score = float(
            np.sum([proba[i] * CLASS_SEVERITY_WEIGHT.get(i, 0.0) for i in range(len(proba))])
        )

        # Conformal prediction set acts as uncertainty interval.
        uncertainty_interval = _compute_uncertainty(conformal_predictor, x_selected, alpha=0.1)
        if not uncertainty_interval:
            uncertainty_interval = [prediction_label]

        return (
            jsonify(
                {
                    "prediction": prediction_label,
                    "confidence": round(confidence, 4),
                    "uncertainty_interval": uncertainty_interval,
                    "risk_score": round(risk_score, 4),
                }
            ),
            200,
        )
    except Exception as exc:
        current_app.logger.exception("Prediction error: %s", exc)
        return jsonify({"error": "Failed to generate prediction."}), 500
