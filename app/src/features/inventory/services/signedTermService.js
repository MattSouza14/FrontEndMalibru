import { apiRequest, resolveApiUrl, uploadApiRequest, authHeaders, authFetch } from '../../../shared/api/client.js';

export async function listSignedTerms(usuarioId) {
  const query =
    usuarioId != null && usuarioId !== '' ? `?usuarioId=${encodeURIComponent(usuarioId)}` : '';

  return apiRequest(`/api/admin/termos-assinados${query}`, {
    headers: authHeaders(),
  });
}

export async function getSignedTerm(id) {
  return apiRequest(`/api/admin/termos-assinados/${id}`, {
    headers: authHeaders(),
  });
}

export async function uploadSignedTerm({ file, titulo, usuarioId, dataAssinatura }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('titulo', titulo);

  if (usuarioId != null && usuarioId !== '') {
    formData.append('usuarioId', String(usuarioId));
  }

  if (dataAssinatura) {
    formData.append('dataAssinatura', dataAssinatura);
  }

  return uploadApiRequest('/api/admin/termos-assinados', formData);
}

export async function updateSignedTerm(id, payload) {
  return apiRequest(`/api/admin/termos-assinados/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteSignedTerm(id) {
  return apiRequest(`/api/admin/termos-assinados/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function fetchSignedTermFileBlob(previewUrl) {
  const url = resolveApiUrl(previewUrl);
  const response = await authFetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw {
      status: response.status,
      code: data?.code ?? 'ERRO_DESCONHECIDO',
      message: data?.message ?? 'Falha ao carregar arquivo',
    };
  }

  return response.blob();
}
