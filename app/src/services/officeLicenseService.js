import { apiRequest, authHeaders } from './api';

export async function listOfficeLicenses() {
  return apiRequest('/api/admin/office-licenses', {
    headers: authHeaders(),
  });
}

export async function getOfficeLicense(id) {
  return apiRequest(`/api/admin/office-licenses/${id}`, {
    headers: authHeaders(),
  });
}

export async function listOfficeLicenseUsers(licenseId) {
  return apiRequest(`/api/admin/office-licenses/${licenseId}/usuarios`, {
    headers: authHeaders(),
  });
}

export async function createOfficeLicense(payload) {
  return apiRequest('/api/admin/office-licenses', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateOfficeLicense(id, payload) {
  return apiRequest(`/api/admin/office-licenses/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteOfficeLicense(id) {
  return apiRequest(`/api/admin/office-licenses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function linkOfficeLicenseToUser(usuarioId, officeLicenseId) {
  return apiRequest(`/api/admin/office-licenses/usuarios/${usuarioId}/vincular`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ officeLicenseId }),
  });
}

export async function unlinkOfficeLicenseFromUser(usuarioId) {
  return apiRequest(`/api/admin/office-licenses/usuarios/${usuarioId}/desvincular`, {
    method: 'POST',
    headers: authHeaders(),
  });
}
