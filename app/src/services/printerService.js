import { apiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listPrinters(token, empresa) {
  const query = empresa ? `?empresa=${encodeURIComponent(empresa)}` : '';
  return apiRequest(`/api/admin/impressoras${query}`, {
    headers: authHeaders(token),
  });
}

export async function listPrinterCompanies(token) {
  return apiRequest('/api/admin/impressoras/empresas', {
    headers: authHeaders(token),
  });
}

export async function getPrinter(token, id) {
  return apiRequest(`/api/admin/impressoras/${id}`, {
    headers: authHeaders(token),
  });
}

export async function listPrinterToners(token, id) {
  return apiRequest(`/api/admin/impressoras/${id}/toners`, {
    headers: authHeaders(token),
  });
}

export async function createPrinter(token, payload) {
  return apiRequest('/api/admin/impressoras', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updatePrinter(token, id, payload) {
  return apiRequest(`/api/admin/impressoras/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deletePrinter(token, id) {
  return apiRequest(`/api/admin/impressoras/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function linkTonerToPrinter(token, printerId, tonerId) {
  return apiRequest(`/api/admin/impressoras/${printerId}/toners/vincular`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ tonerId }),
  });
}

export async function unlinkTonerFromPrinter(token, printerId, tonerId) {
  return apiRequest(`/api/admin/impressoras/${printerId}/toners/${tonerId}/desvincular`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}
