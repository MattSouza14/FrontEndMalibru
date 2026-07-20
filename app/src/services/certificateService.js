import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listCertificates(token) {
  return apiRequest('/api/admin/certificates', {
    headers: authHeaders(token),
  });
}

export async function getCertificate(token, id) {
  return apiRequest(`/api/admin/certificates/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createCertificate(token, payload) {
  return apiRequest('/api/admin/certificates', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateCertificate(token, id, payload) {
  return apiRequest(`/api/admin/certificates/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteCertificate(token, id) {
  return apiRequest(`/api/admin/certificates/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
