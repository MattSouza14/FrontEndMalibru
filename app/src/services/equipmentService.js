import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listEquipments(token) {
  return apiRequest('/api/admin/equipamentos', {
    headers: authHeaders(token),
  });
}

export async function getEquipment(token, id) {
  return apiRequest(`/api/admin/equipamentos/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createEquipment(token, payload) {
  return apiRequest('/api/admin/equipamentos', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateEquipment(token, id, payload) {
  return apiRequest(`/api/admin/equipamentos/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteEquipment(token, id) {
  return apiRequest(`/api/admin/equipamentos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function linkEquipmentToUser(token, usuarioId, equipamentoId) {
  return apiRequest(`/api/admin/equipamentos/usuarios/${usuarioId}/vincular`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ equipamentoId }),
  });
}

export async function unlinkEquipmentFromUser(token, usuarioId, equipamentoId) {
  return apiRequest(
    `/api/admin/equipamentos/usuarios/${usuarioId}/desvincular/${equipamentoId}`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
}
