import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getMyProfile(token) {
  return apiRequest('/api/usuarios/me', {
    headers: authHeaders(token),
  });
}

export async function updateProfile(token, payload) {
  return apiRequest('/api/usuarios/me', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
