export function resolveApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export function authHeaders() {
  return {};
}

async function parseResponse(response) {
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw {
      status: response.status,
      ...data,
    };
  }
  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, credentials = 'include', ...rest } = options;

  const response = await fetch(resolveApiUrl(endpoint), {
    ...rest,
    credentials,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return parseResponse(response);
}

export async function uploadApiRequest(endpoint, formData, options = {}) {
  const { credentials = 'include', ...rest } = options;

  const response = await fetch(resolveApiUrl(endpoint), {
    method: 'POST',
    credentials,
    ...rest,
    body: formData,
  });
  return parseResponse(response);
}

export async function authFetch(endpoint, options = {}) {
  const response = await fetch(resolveApiUrl(endpoint), {
    credentials: 'include',
    ...options,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}
