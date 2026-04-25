"""Flask application entry point for aviation risk services."""

from __future__ import annotations

import joblib
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient

from config import Config
from routes.explain import explain_bp
from routes.historical import historical_bp
from routes.predict import predict_bp


def _load_artifacts(app: Flask) -> None:
    """Load all ML artifacts once at app startup."""
    app.extensions["ml_artifacts"] = {
        "model": joblib.load(app.config["BEST_MODEL_PATH"]),
        "preprocessing_pipeline": joblib.load(app.config["PREPROCESSING_PIPELINE_PATH"]),
        "variance_threshold": joblib.load(app.config["VARIANCE_THRESHOLD_PATH"]),
        "conformal_predictor": joblib.load(app.config["CONFORMAL_PREDICTOR_PATH"]),
    }


def create_app() -> Flask:
    """Application factory used by Flask and production servers."""
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)

    # Create MongoDB client once and reuse it in blueprints.
    mongo_client = MongoClient(app.config["MONGODB_URI"])
    app.extensions["mongo_client"] = mongo_client
    app.extensions["mongo_db"] = mongo_client[app.config["MONGODB_DB_NAME"]]

    # Load model artifacts so prediction APIs are warm.
    _load_artifacts(app)

    # Register API blueprints.
    app.register_blueprint(predict_bp)
    app.register_blueprint(explain_bp)
    app.register_blueprint(historical_bp)

    @app.get("/health")
    def health() -> tuple[dict, int]:
        """Simple service health endpoint."""
        return {"status": "ok"}, 200

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        """Catch-all error fallback for unhandled exceptions."""
        app.logger.exception("Unhandled exception: %s", error)
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
