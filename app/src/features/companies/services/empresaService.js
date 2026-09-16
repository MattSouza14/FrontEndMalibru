import { apiRequest } from '../../../shared/api/client.js';

export async function listEmpresas() {
  return apiRequest('/api/empresas');
}
