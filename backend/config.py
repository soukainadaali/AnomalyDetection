"""Configuration for the Flask aviation risk backend."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Centralized settings with environment variable overrides."""

    BASE_DIR = Path(__file__).resolve().parent

    # Model artifact paths.
    BEST_MODEL_PATH = os.getenv(
        "BEST_MODEL_PATH",
        str(BASE_DIR / "baseline_models" / "best_model.pkl"),
    )
    PREPROCESSING_PIPELINE_PATH = os.getenv(
        "PREPROCESSING_PIPELINE_PATH",
        str(BASE_DIR / "outputs" / "preprocessing_pipeline.pkl"),
    )
    VARIANCE_THRESHOLD_PATH = os.getenv(
        "VARIANCE_THRESHOLD_PATH",
        str(BASE_DIR / "outputs" / "variance_threshold.pkl"),
    )
    CONFORMAL_PREDICTOR_PATH = os.getenv(
        "CONFORMAL_PREDICTOR_PATH",
        str(BASE_DIR / "uncertainty_outputs" / "mapie_classifier.pkl"),
    )

    # Flask options.
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # MongoDB options.
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "aviation_safety")
    MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "accidents")

    # External API keys.
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
