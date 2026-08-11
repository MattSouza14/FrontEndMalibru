import { apiRequest, authHeaders } from './api';

export async function listSoftwareLicenses() {
  return apiRequest('/api/admin/software-licenses', {
    headers: authHeaders(),
  });
}

export async function getSoftwareLicense(id) {
  return apiRequest(`/api/admin/software-licenses/${id}`, {
    headers: authHeaders(),
  });
}

export async function listSoftwareLicensesByUser(usuarioId) {
  return apiRequest(`/api/admin/software-licenses/usuarios/${usuarioId}`, {
    headers: authHeaders(),
  });
}

export async function createSoftwareLicense(payload) {
  return apiRequest('/api/admin/software-licenses', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateSoftwareLicense(id, payload) {
  return apiRequest(`/api/admin/software-licenses/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteSoftwareLicense(id) {
  return apiRequest(`/api/admin/software-licenses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}
