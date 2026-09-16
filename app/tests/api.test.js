import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, uploadApiRequest } from '../src/shared/api/client.js';
let originalFetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
  globalThis.localStorage = { getItem: () => null };
  globalThis.sessionStorage = { getItem: () => null };
  globalThis.window = { location: { origin: 'http://localhost' }, dispatchEvent: () => {} };
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; delete globalThis.sessionStorage; delete globalThis.window; });
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
