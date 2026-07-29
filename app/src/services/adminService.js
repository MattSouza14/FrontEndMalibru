import { apiRequest, uploadApiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listUsers(token) {
  return apiRequest('/api/admin/usuarios', {
    headers: authHeaders(token),
  });
}

export async function activateUser(token, id) {
  return apiRequest(`/api/admin/usuarios/${id}/ativar`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

export async function deactivateUser(token, id) {
  return apiRequest(`/api/admin/usuarios/${id}/desativar`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

export async function listAvailableRoles(token) {
  return apiRequest('/api/admin/usuarios/roles', {
    headers: authHeaders(token),
  });
}

export async function updateUserRoles(token, id, roles) {
  return apiRequest(`/api/admin/usuarios/${id}/roles`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ roles }),
  });
}

export async function importUsersCsv(token, file) {
  const formData = new FormData();
  formData.append('file', file);

  return uploadApiRequest('/api/admin/usuarios/import', token, formData);
}
