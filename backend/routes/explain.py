"""Model explanation API routes."""

from __future__ import annotations

from typing import Any

import numpy as np
import shap
from flask import Blueprint, current_app, jsonify, request

from utils.preprocessing import ValidationError, build_model_dataframe, infer_feature_names

explain_bp = Blueprint("explain", __name__, url_prefix="")

CLASS_LABELS = {0: "NONE", 1: "MINR", 2: "SERS", 3: "FATL"}


def _extract_class_shap(shap_values, class_idx: int) -> np.ndarray:
    """Normalize SHAP output shape and return a 1D vector for one class."""
    if isinstance(shap_values, list):
        return np.asarray(shap_values[class_idx][0])

    values = np.asarray(shap_values)
    if values.ndim == 3:
        # Expected shape: (n_samples, n_features, n_classes)
        return values[0, :, class_idx]
    if values.ndim == 2:
        return values[0]
    return values.reshape(-1)


@explain_bp.post("/explain")
def explain_prediction():
    """Return SHAP explanation for a single prediction."""
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

        x_transformed = preprocessing_pipeline.transform(input_df)
        x_selected = variance_threshold.transform(x_transformed)
        feature_names = infer_feature_names(preprocessing_pipeline, x_selected, variance_threshold)

        # Compute prediction first so we can explain that specific class.
        class_idx = int(model.predict(x_selected)[0])
        class_label = CLASS_LABELS.get(class_idx, str(class_idx))

        # Use TreeExplainer for tree models and fallback to generic Explainer.
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(x_selected)
        except Exception:
            explainer = shap.Explainer(model, x_selected)
            explanation = explainer(x_selected)
            shap_values = explanation.values

        class_shap = _extract_class_shap(shap_values, class_idx)
        feature_values = np.asarray(x_selected[0]).reshape(-1)

        contributions = []
        for idx, value in enumerate(class_shap):
            contributions.append(
                {
                    "feature": feature_names[idx] if idx < len(feature_names) else f"feature_{idx}",
                    "feature_value": float(feature_values[idx]) if idx < len(feature_values) else None,
                    "shap_value": float(value),
                    "abs_shap_value": float(abs(value)),
                }
            )

        contributions.sort(key=lambda item: item["abs_shap_value"], reverse=True)
        top_features = contributions[:10]

        return (
            jsonify(
                {
                    "prediction": class_label,
                    "class_index": class_idx,
                    "shap_values": contributions,
                    "top_feature_contributions": top_features,
                }
            ),
            200,
        )
    except Exception as exc:
        current_app.logger.exception("Explanation error: %s", exc)
        return jsonify({"error": "Failed to generate explanation."}), 500
