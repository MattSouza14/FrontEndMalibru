import { apiRequest, authHeaders } from '../../../shared/api/client.js';

export async function getMyProfile() {
  return apiRequest('/api/usuarios/me', {
    headers: authHeaders(),
  });
}

export async function updateProfile(payload) {
  return apiRequest('/api/usuarios/me', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}
