import { apiRequest } from './api';

export async function listEmpresas() {
  return apiRequest('/api/empresas');
}
