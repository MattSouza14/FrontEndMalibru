import { apiRequest, uploadApiRequest, authHeaders } from '../../../shared/api/client.js';

export async function listUsers() {
  return apiRequest('/api/admin/usuarios', {
    headers: authHeaders(),
  });
}

export async function activateUser(id) {
  return apiRequest(`/api/admin/usuarios/${id}/ativar`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
}

export async function deactivateUser(id) {
  return apiRequest(`/api/admin/usuarios/${id}/desativar`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
}

export async function listAvailableRoles() {
  return apiRequest('/api/admin/usuarios/roles', {
    headers: authHeaders(),
  });
}

export async function updateUserRoles(id, roles) {
  return apiRequest(`/api/admin/usuarios/${id}/roles`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ roles }),
  });
}

export async function updateUser(id, payload) {
  return apiRequest(`/api/admin/usuarios/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function importUsersCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  return uploadApiRequest('/api/admin/usuarios/import', formData);
}
