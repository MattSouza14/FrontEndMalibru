import { apiRequest } from './api';

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
