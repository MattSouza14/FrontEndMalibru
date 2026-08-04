export function resolveApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

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

  const response = await fetch(resolveApiUrl(endpoint), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return parseResponse(response);
}

export async function uploadApiRequest(endpoint, token, formData) {
  const response = await fetch(resolveApiUrl(endpoint), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return parseResponse(response);
}
