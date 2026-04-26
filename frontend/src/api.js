const API_BASE_URL = 'http://localhost:5000';

async function handleApiResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed. Please try again.');
  }

  return data;
}

async function apiFetch(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(
      'Cannot reach backend API. Make sure Flask is running on http://localhost:5000 and CORS is enabled.'
    );
  }
}

export async function predictRisk(payload) {
  return apiFetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function explainPrediction(payload) {
  return apiFetch('/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getHistoricalAccidents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.state) params.set('state', filters.state);

  const queryString = params.toString();
  const endpoint = queryString ? `/historical?${queryString}` : '/historical';
  return apiFetch(endpoint);
}
