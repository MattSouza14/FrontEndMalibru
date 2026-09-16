import { getToken } from '../lib/authStorage.js';

export function resolveApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  const headers = new Headers(options.headers);
  const isSameOrigin = new URL(url, window.location.origin).origin === window.location.origin;
  if (isSameOrigin && !isAuthPublicEndpoint(endpoint) && !headers.has('Authorization')) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  options = { ...options, headers };
  let response = await fetch(url, options);

  if (response.status === 401 && !isAuthPublicEndpoint(endpoint) && !getToken()) {
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
  const body = response.status === 204 ? '' : await response.text();
  let data = null;
  if (body.trim()) {
    try {
      data = JSON.parse(body);
    } catch {
      if (response.ok) {
        throw {
          status: response.status,
          code: 'RESPOSTA_INVALIDA',
          message: 'A API retornou uma resposta inválida. Verifique a configuração do servidor.',
        };
      }
    }
  }

  if (!response.ok) {
    const retryAfter = response.headers.get('Retry-After');
    throw {
      message: [502, 503, 504].includes(response.status)
        ? 'Não foi possível conectar à API. Verifique se ela está rodando e se a porta configurada está correta.'
        : `A API retornou um erro (HTTP ${response.status}).`,
      ...(data && typeof data === 'object' ? data : {}),
      status: response.status,
      ...(retryAfter ? { retryAfter: Number(retryAfter) } : {}),
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
