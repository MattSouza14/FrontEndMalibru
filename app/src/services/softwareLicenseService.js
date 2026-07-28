import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listSoftwareLicenses(token) {
  return apiRequest('/api/admin/software-licenses', {
    headers: authHeaders(token),
  });
}

export async function getSoftwareLicense(token, id) {
  return apiRequest(`/api/admin/software-licenses/${id}`, {
    headers: authHeaders(token),
  });
}

export async function listSoftwareLicensesByUser(token, usuarioId) {
  return apiRequest(`/api/admin/software-licenses/usuarios/${usuarioId}`, {
    headers: authHeaders(token),
  });
}

export async function createSoftwareLicense(token, payload) {
  return apiRequest('/api/admin/software-licenses', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateSoftwareLicense(token, id, payload) {
  return apiRequest(`/api/admin/software-licenses/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteSoftwareLicense(token, id) {
  return apiRequest(`/api/admin/software-licenses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
