"""Input validation and transformation helpers for inference."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

REQUIRED_FIELDS = {
    "departure_airport",
    "date",
    "aircraft_type",
    "pilot_hours",
    "weather_conditions",
}


class ValidationError(ValueError):
    """Raised when request payload validation fails."""


def validate_payload(payload: dict[str, Any]) -> None:
    """Validate required keys and basic data types."""
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object.")

    missing_fields = [field for field in REQUIRED_FIELDS if field not in payload]
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(sorted(missing_fields))}")

    if not isinstance(payload["departure_airport"], str) or not payload["departure_airport"].strip():
        raise ValidationError("departure_airport must be a non-empty string.")

    if not isinstance(payload["aircraft_type"], str) or not payload["aircraft_type"].strip():
        raise ValidationError("aircraft_type must be a non-empty string.")

    if not isinstance(payload["weather_conditions"], str) or not payload["weather_conditions"].strip():
        raise ValidationError("weather_conditions must be a non-empty string.")

    try:
        pilot_hours = float(payload["pilot_hours"])
        if pilot_hours < 0:
            raise ValidationError("pilot_hours must be >= 0.")
    except (TypeError, ValueError) as exc:
        raise ValidationError("pilot_hours must be a numeric value.") from exc

    try:
        datetime.fromisoformat(str(payload["date"]).replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValidationError("date must be an ISO-8601 date string.") from exc


def build_model_dataframe(payload: dict[str, Any]) -> pd.DataFrame:
    """Build a one-row DataFrame in schema expected by the preprocessing pipeline."""
    validate_payload(payload)

    model_input = {
        "departure_airport": payload["departure_airport"].strip().upper(),
        "date": payload["date"],
        "aircraft_type": payload["aircraft_type"].strip(),
        "pilot_hours": float(payload["pilot_hours"]),
        "weather_conditions": payload["weather_conditions"].strip(),
    }
    return pd.DataFrame([model_input])


def infer_feature_names(preprocessing_pipeline, transformed_x, variance_threshold=None) -> list[str]:
    """Infer human-readable feature names after preprocessing and selection."""
    feature_names: list[str] = []

    if hasattr(preprocessing_pipeline, "get_feature_names_out"):
        try:
            feature_names = list(preprocessing_pipeline.get_feature_names_out())
        except Exception:
            feature_names = []

    if not feature_names:
        feature_names = [f"feature_{i}" for i in range(transformed_x.shape[1])]

    if variance_threshold is not None and hasattr(variance_threshold, "get_support"):
        try:
            support_mask = variance_threshold.get_support()
            if len(support_mask) == len(feature_names):
                feature_names = [name for name, keep in zip(feature_names, support_mask) if keep]
        except Exception:
            pass

    if len(feature_names) != transformed_x.shape[1]:
        feature_names = [f"feature_{i}" for i in range(transformed_x.shape[1])]

    return feature_names
