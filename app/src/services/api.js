const API_URL = import.meta.env.VITE_API_URL

async function parseResponse(response) {
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw {
      status: response.status,
      ...data,
    };
  }
  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return parseResponse(response);
}

export async function uploadApiRequest(endpoint, token, formData) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return parseResponse(response);
}
