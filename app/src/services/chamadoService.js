import { apiRequest, authHeaders } from './api';

export async function openChamado(payload) {
  return apiRequest('/api/chamados', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function listMyChamados() {
  return apiRequest('/api/chamados', {
    headers: authHeaders(),
  });
}

export async function getMyChamado(id) {
  return apiRequest(`/api/chamados/${id}`, {
    headers: authHeaders(),
  });
}

export async function listAdminChamados(status) {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/api/admin/chamados${query}`, {
    headers: authHeaders(),
  });
}

export async function getAdminChamado(id) {
  return apiRequest(`/api/admin/chamados/${id}`, {
    headers: authHeaders(),
  });
}

export async function updateChamadoStatus(id, status) {
  return apiRequest(`/api/admin/chamados/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function listMyChamadoMessages(id) {
  return apiRequest(`/api/chamados/${id}/mensagens`, {
    headers: authHeaders(),
  });
}

export async function postMyChamadoMessage(id, mensagem) {
  return apiRequest(`/api/chamados/${id}/mensagens`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mensagem }),
  });
}

export async function listAdminChamadoMessages(id) {
  return apiRequest(`/api/admin/chamados/${id}/mensagens`, {
    headers: authHeaders(),
  });
}

export async function postAdminChamadoMessage(id, mensagem) {
  return apiRequest(`/api/admin/chamados/${id}/mensagens`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mensagem }),
  });
}
