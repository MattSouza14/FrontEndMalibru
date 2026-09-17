import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, uploadApiRequest } from '../src/shared/api/client.js';
import { loadMaintenanceData, maintenanceReportPdf } from '../src/features/inventory/services/maintenanceService.js';
let originalFetch;
test('relatório transmite cada filtro e valida o PDF retornado', async () => {
  for (const status of ['todos', 'em_manutencao', 'retornados']) {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, `/api/admin/equipamentos/manutencoes/relatorio/pdf?situacao=${status}`);
      assert.equal(options.credentials, 'include');
      return new Response('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } });
    };
    assert.equal(await (await maintenanceReportPdf(status)).text(), '%PDF-1.7');
  }
  globalThis.fetch = async () => new Response('<html>erro</html>');
  await assert.rejects(maintenanceReportPdf('todos'), /PDF válido/);
});
beforeEach(() => {
  originalFetch = globalThis.fetch;
  globalThis.localStorage = { getItem: () => null };
  globalThis.sessionStorage = { getItem: () => null };
  globalThis.window = { location: { origin: 'http://localhost' }, dispatchEvent: () => {} };
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; delete globalThis.sessionStorage; delete globalThis.window; });
test('falha no histórico não descarta equipamentos e permite nova tentativa', async () => {
  const equipment = [{ id: 1, nome: 'Notebook', empresa: 'Empresa não informada' }];
  globalThis.fetch = async (url) => url.endsWith('/equipamentos')
    ? Response.json(equipment) : Response.json({ code: 'ERRO_INTERNO' }, { status: 500 });
  const failed = await loadMaintenanceData();
  assert.equal(failed.records.status, 'rejected');
  assert.equal(failed.records.reason.status, 500);
  assert.deepEqual(failed.equipments.value, equipment);
  globalThis.fetch = async (url) => Response.json(url.endsWith('/equipamentos') ? equipment : []);
  const recovered = await loadMaintenanceData();
  assert.equal(recovered.records.status, 'fulfilled');
  assert.deepEqual(recovered.records.value, []);
  assert.deepEqual(recovered.equipments.value, equipment);
});
test('falha nos equipamentos preserva o histórico e não vira lista vazia', async () => {
  const records = [{ id: 7, equipamentoNome: 'Notebook' }];
  globalThis.fetch = async (url) => url.endsWith('/equipamentos')
    ? Response.json({ code: 'ERRO_INTERNO' }, { status: 500 }) : Response.json(records);
  const result = await loadMaintenanceData();
  assert.deepEqual(result.records.value, records);
  assert.equal(result.equipments.status, 'rejected');
  assert.equal(result.equipments.reason.status, 500);
});
test('204 não tenta interpretar JSON vazio', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await apiRequest('/api/example'), null);
});
test('HTML de proxy não passa como resposta JSON válida', async () => {
  globalThis.fetch = async () => new Response('<html>erro</html>');
  await assert.rejects(apiRequest('/api/example'), e => e.code === 'RESPOSTA_INVALIDA');
});
test('upload preserva FormData e permite boundary gerado pelo navegador', async () => {
  const data = new FormData(); data.append('arquivo', 'exemplo');
  globalThis.fetch = async (_, options) => {
    assert.equal(options.body, data); assert.equal(options.headers.has('Content-Type'), false);
    assert.equal(options.credentials, 'include'); return new Response('{}');
  };
  await uploadApiRequest('/api/example', data);
});
test('requisições simultâneas compartilham uma renovação de sessão', async () => {
  const attempts = new Map(); let refreshCount = 0;
  globalThis.fetch = async (url) => {
    if (url === '/api/auth/refresh') { refreshCount++; await new Promise(resolve => setTimeout(resolve, 10)); return new Response('{}'); }
    const count = (attempts.get(url) || 0) + 1; attempts.set(url, count);
    return new Response('{}', { status: count === 1 ? 401 : 200 });
  };
  await Promise.all([apiRequest('/api/a'), apiRequest('/api/b')]);
  assert.equal(refreshCount, 1); assert.equal(attempts.get('/api/a'), 2); assert.equal(attempts.get('/api/b'), 2);
});
