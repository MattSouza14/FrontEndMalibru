import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listOfficeLicenses(token) {
  return apiRequest('/api/admin/office-licenses', {
    headers: authHeaders(token),
  });
}

export async function getOfficeLicense(token, id) {
  return apiRequest(`/api/admin/office-licenses/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createOfficeLicense(token, payload) {
  return apiRequest('/api/admin/office-licenses', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateOfficeLicense(token, id, payload) {
  return apiRequest(`/api/admin/office-licenses/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteOfficeLicense(token, id) {
  return apiRequest(`/api/admin/office-licenses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
