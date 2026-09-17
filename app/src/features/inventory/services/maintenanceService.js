import { apiRequest, authFetch } from '../../../shared/api/client.js';

const base = '/api/admin/equipamentos/manutencoes';
export function listMaintenances() { return apiRequest(base); }
export function listMaintenanceEquipments() { return apiRequest(`${base}/equipamentos`); }
export async function loadMaintenanceData() {
  const [records, equipments] = await Promise.allSettled([listMaintenances(), listMaintenanceEquipments()]);
  return { records, equipments };
}
export function saveMaintenance(id, payload) {
  return apiRequest(id ? `${base}/${id}` : base, {
    method: id ? 'PUT' : 'POST', body: JSON.stringify(payload),
  });
}
export function maintenanceReportPdf(situacao) {
  return fetchPdf(`${base}/relatorio/pdf?situacao=${encodeURIComponent(situacao)}`);
}
export function maintenancePdf(id) { return fetchPdf(`${base}/${id}/pdf`); }
async function fetchPdf(endpoint) {
  const response = await authFetch(endpoint);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Não foi possível gerar o PDF.');
  }
  if (!response.headers.get('content-type')?.includes('application/pdf')) {
    throw new Error('O servidor não retornou um PDF válido.');
  }
  return response.blob();
}
