import { apiRequest } from './api';

export async function refreshSession() {
  return apiRequest('/api/auth/refresh', { method: 'POST' });
}

export async function register({ nome, email, senha, setor, empresa }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha, setor, empresa }),
  });
}

export async function login({ email, senha }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
 
  }
}

export async function activateAccount(token) {
  return apiRequest('/api/auth/ativar', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function getMe() {
  return apiRequest('/api/auth/me');
}
