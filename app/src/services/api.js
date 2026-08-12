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

const AUTH_PUBLIC_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/ativar',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/empresas',
]);

function isAuthPublicEndpoint(endpoint) {
  const path = resolveApiUrl(endpoint).split('?')[0];
  return AUTH_PUBLIC_PATHS.has(path);
}

let refreshPromise = null;

async function tryRefreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(resolveApiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('refresh_failed');
        }
        return response;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function dispatchUnauthorized() {
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

async function fetchWithAuthRetry(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  let response = await fetch(url, options);

  if (response.status === 401 && !isAuthPublicEndpoint(endpoint)) {
    try {
      await tryRefreshSession();
      response = await fetch(url, options);
    } catch {
      dispatchUnauthorized();
    }
  }

  if (response.status === 401 && !isAuthPublicEndpoint(endpoint)) {
    dispatchUnauthorized();
  }

  return response;
}

async function parseResponse(response) {
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const retryAfter = response.headers.get('Retry-After');
    throw {
      status: response.status,
      ...(retryAfter ? { retryAfter: Number(retryAfter) } : {}),
      ...data,
    };
  }

  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, credentials = 'include', ...rest } = options;

  const response = await fetchWithAuthRetry(endpoint, {
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

  const response = await fetchWithAuthRetry(endpoint, {
    method: 'POST',
    credentials,
    ...rest,
    body: formData,
  });

  return parseResponse(response);
}

export async function authFetch(endpoint, options = {}) {
  const response = await fetchWithAuthRetry(endpoint, {
    credentials: 'include',
    ...options,
  });

  return response;
}
