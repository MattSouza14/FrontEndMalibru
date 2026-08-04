import { apiRequest, resolveApiUrl, uploadApiRequest } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listSignedTerms(token, usuarioId) {
  const query =
    usuarioId != null && usuarioId !== '' ? `?usuarioId=${encodeURIComponent(usuarioId)}` : '';

  return apiRequest(`/api/admin/termos-assinados${query}`, {
    headers: authHeaders(token),
  });
}

export async function getSignedTerm(token, id) {
  return apiRequest(`/api/admin/termos-assinados/${id}`, {
    headers: authHeaders(token),
  });
}

export async function uploadSignedTerm(token, { file, titulo, usuarioId, dataAssinatura }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('titulo', titulo);

  if (usuarioId != null && usuarioId !== '') {
    formData.append('usuarioId', String(usuarioId));
  }

  if (dataAssinatura) {
    formData.append('dataAssinatura', dataAssinatura);
  }

  return uploadApiRequest('/api/admin/termos-assinados', token, formData);
}

export async function updateSignedTerm(token, id, payload) {
  return apiRequest(`/api/admin/termos-assinados/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteSignedTerm(token, id) {
  return apiRequest(`/api/admin/termos-assinados/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function fetchSignedTermFileBlob(token, previewUrl) {
  const url = resolveApiUrl(previewUrl);

  const response = await fetch(url, {
    headers: authHeaders(token),
  });

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
