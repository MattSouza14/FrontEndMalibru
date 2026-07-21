import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getMyOfficeLicense(token) {
  return apiRequest('/api/usuarios/me/office-license', {
    headers: authHeaders(token),
  });
}

export async function getMyEquipments(token) {
  return apiRequest('/api/usuarios/me/equipamentos', {
    headers: authHeaders(token),
  });
}
