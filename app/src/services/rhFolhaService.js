import { resolveApiUrl } from './api';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw {
      status: response.status,
      ...(data || { code: 'ERRO_DESCONHECIDO', message: 'Falha na requisição' }),
    };
  }
  return data;
}

async function parseBlobResponse(response) {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw {
      status: response.status,
      ...(data || { code: 'ERRO_DESCONHECIDO', message: 'Falha na requisição' }),
    };
  }
  return response.blob();
}

export async function analisarFolhaFortes(token, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(resolveApiUrl('/api/rh/folha/analisar'), {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });

  return parseJsonResponse(response);
}

export async function dividirFolhaFortes(token, file, cpfsPorParte, incluirLinhasSemCpf = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cpfsPorParte', String(cpfsPorParte));
  formData.append('incluirLinhasSemCpf', String(incluirLinhasSemCpf));

  const response = await fetch(resolveApiUrl('/api/rh/folha/dividir'), {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });

  return parseBlobResponse(response);
}

export async function extrairFolhaFortes(token, file, cpfs, formatoSaida = 'UNICO') {
  const formData = new FormData();
  formData.append('file', file);
  cpfs.forEach((cpf) => formData.append('cpfs', cpf));
  formData.append('formatoSaida', formatoSaida);

  const response = await fetch(resolveApiUrl('/api/rh/folha/extrair'), {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });

  return parseBlobResponse(response);
}
