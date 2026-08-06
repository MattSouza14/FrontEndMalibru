import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listToners(token) {
  return apiRequest('/api/admin/toners', {
    headers: authHeaders(token),
  });
}

export async function getToner(token, id) {
  return apiRequest(`/api/admin/toners/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createToner(token, payload) {
  return apiRequest('/api/admin/toners', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateToner(token, id, payload) {
  return apiRequest(`/api/admin/toners/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteToner(token, id) {
  return apiRequest(`/api/admin/toners/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
