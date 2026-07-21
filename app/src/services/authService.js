import { apiRequest } from './api';

export async function register({ nome, email, senha, setor }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha, setor }),
  });
}

export async function login({ email, senha }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export async function activateAccount(token) {
  return apiRequest('/api/auth/ativar', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}