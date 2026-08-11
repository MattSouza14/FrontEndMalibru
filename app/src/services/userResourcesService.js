import { apiRequest, authHeaders } from './api';

export async function getMyOfficeLicense() {
  return apiRequest('/api/usuarios/me/office-license', {
    headers: authHeaders(),
  });
}

export async function getMyEquipments() {
  return apiRequest('/api/usuarios/me/equipamentos', {
    headers: authHeaders(),
  });
}

export async function getMySoftwareLicenses() {
  return apiRequest('/api/usuarios/me/software-licenses', {
    headers: authHeaders(),
  });
}
