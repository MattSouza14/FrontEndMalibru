import { apiRequest, authHeaders } from '../../../shared/api/client.js';

export async function listCertificates() {
  return apiRequest('/api/admin/certificates', {
    headers: authHeaders(),
  });
}

export async function getCertificate(id) {
  return apiRequest(`/api/admin/certificates/${id}`, {
    headers: authHeaders(),
  });
}

export async function createCertificate(payload) {
  return apiRequest('/api/admin/certificates', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateCertificate(id, payload) {
  return apiRequest(`/api/admin/certificates/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteCertificate(id) {
  return apiRequest(`/api/admin/certificates/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}
