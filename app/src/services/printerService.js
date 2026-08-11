import { apiRequest, authHeaders } from './api';

export async function listPrinters(empresa) {
  const query = empresa ? `?empresa=${encodeURIComponent(empresa)}` : '';
  return apiRequest(`/api/admin/impressoras${query}`, {
    headers: authHeaders(),
  });
}

export async function listPrinterCompanies() {
  return apiRequest('/api/admin/impressoras/empresas', {
    headers: authHeaders(),
  });
}

export async function getPrinter(id) {
  return apiRequest(`/api/admin/impressoras/${id}`, {
    headers: authHeaders(),
  });
}

export async function listPrinterToners(id) {
  return apiRequest(`/api/admin/impressoras/${id}/toners`, {
    headers: authHeaders(),
  });
}

export async function createPrinter(payload) {
  return apiRequest('/api/admin/impressoras', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updatePrinter(id, payload) {
  return apiRequest(`/api/admin/impressoras/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deletePrinter(id) {
  return apiRequest(`/api/admin/impressoras/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function linkTonerToPrinter(printerId, tonerId) {
  return apiRequest(`/api/admin/impressoras/${printerId}/toners/vincular`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ tonerId }),
  });
}

export async function unlinkTonerFromPrinter(printerId, tonerId) {
  return apiRequest(`/api/admin/impressoras/${printerId}/toners/${tonerId}/desvincular`, {
    method: 'POST',
    headers: authHeaders(),
  });
}
