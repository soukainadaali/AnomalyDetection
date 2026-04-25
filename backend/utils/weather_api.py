"""OpenWeather API helper functions."""

from __future__ import annotations

from typing import Any

import requests


def fetch_openweather(lat: float, lon: float, api_key: str, units: str = "metric") -> dict[str, Any]:
    """Fetch current weather by coordinates from OpenWeather."""
    if not api_key:
        raise ValueError("OpenWeather API key is missing.")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": api_key, "units": units}
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()
