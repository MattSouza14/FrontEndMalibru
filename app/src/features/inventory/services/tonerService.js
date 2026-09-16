import { apiRequest, authHeaders } from '../../../shared/api/client.js';

export async function listToners() {
  return apiRequest('/api/admin/toners', {
    headers: authHeaders(),
  });
}

export async function getToner(id) {
  return apiRequest(`/api/admin/toners/${id}`, {
    headers: authHeaders(),
  });
}

export async function createToner(payload) {
  return apiRequest('/api/admin/toners', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateToner(id, payload) {
  return apiRequest(`/api/admin/toners/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteToner(id) {
  return apiRequest(`/api/admin/toners/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}
