import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function openChamado(token, payload) {
  return apiRequest('/api/chamados', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function listMyChamados(token) {
  return apiRequest('/api/chamados', {
    headers: authHeaders(token),
  });
}

export async function getMyChamado(token, id) {
  return apiRequest(`/api/chamados/${id}`, {
    headers: authHeaders(token),
  });
}

export async function listAdminChamados(token, status) {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/api/admin/chamados${query}`, {
    headers: authHeaders(token),
  });
}

export async function getAdminChamado(token, id) {
  return apiRequest(`/api/admin/chamados/${id}`, {
    headers: authHeaders(token),
  });
}

export async function updateChamadoStatus(token, id, status) {
  return apiRequest(`/api/admin/chamados/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}
