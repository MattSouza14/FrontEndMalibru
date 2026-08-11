import { apiRequest, uploadApiRequest, authHeaders } from './api';

export async function listEquipments() {
  return apiRequest('/api/admin/equipamentos', {
    headers: authHeaders(),
  });
}

export async function listEquipmentCompanies() {
  return apiRequest('/api/admin/equipamentos/empresas', {
    headers: authHeaders(),
  });
}

export async function getEquipment(id) {
  return apiRequest(`/api/admin/equipamentos/${id}`, {
    headers: authHeaders(),
  });
}

export async function createEquipment(payload) {
  return apiRequest('/api/admin/equipamentos', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateEquipment(id, payload) {
  return apiRequest(`/api/admin/equipamentos/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteEquipment(id) {
  return apiRequest(`/api/admin/equipamentos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function linkEquipmentToUser(usuarioId, equipamentoId) {
  return apiRequest(`/api/admin/equipamentos/usuarios/${usuarioId}/vincular`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ equipamentoId }),
  });
}

export async function unlinkEquipmentFromUser(usuarioId, equipamentoId) {
  return apiRequest(
    `/api/admin/equipamentos/usuarios/${usuarioId}/desvincular/${equipamentoId}`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
}

export async function importEquipmentsCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  return uploadApiRequest('/api/admin/equipamentos/import', formData);
}
