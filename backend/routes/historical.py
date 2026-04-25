"""Historical accidents query API routes."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from flask import Blueprint, current_app, jsonify, request

historical_bp = Blueprint("historical", __name__, url_prefix="")

ALLOWED_SEVERITIES = {"NONE", "MINR", "SERS", "FATL"}


def _parse_iso_date(value: str, field_name: str) -> datetime:
    """Parse ISO date strings with useful validation messages."""
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception as exc:
        raise ValueError(f"{field_name} must be ISO-8601 format.") from exc


@historical_bp.get("/historical")
def get_historical_records():
    """Query MongoDB accidents with optional filters."""
    try:
        query: dict[str, Any] = {}
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        state = request.args.get("state")
        severity = request.args.get("severity")

        if start_date or end_date:
            date_filter: dict[str, Any] = {}
            if start_date:
                date_filter["$gte"] = _parse_iso_date(start_date, "start_date")
            if end_date:
                date_filter["$lte"] = _parse_iso_date(end_date, "end_date")
            query["date"] = date_filter

        if state:
            query["state"] = state.strip().upper()

        if severity:
            normalized_severity = severity.strip().upper()
            if normalized_severity not in ALLOWED_SEVERITIES:
                return jsonify({"error": "severity must be one of NONE, MINR, SERS, FATL."}), 400
            query["severity"] = normalized_severity

        db = current_app.extensions["mongo_db"]
        collection = db[current_app.config["MONGODB_COLLECTION"]]
        cursor = collection.find(query).sort("date", -1).limit(500)

        records = []
        for item in cursor:
            item["_id"] = str(item["_id"])
            records.append(item)

        return jsonify({"count": len(records), "results": records}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        current_app.logger.exception("Historical query error: %s", exc)
        return jsonify({"error": "Failed to fetch historical records."}), 500
