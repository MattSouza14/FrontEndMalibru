import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slaLabel, supportDate } from '../src/utils/chamadoSla.js';
test('datas do SLA usam Brasília independentemente do fuso do navegador', () => {
  assert.equal(supportDate('2026-09-15T10:00:00').toISOString(), '2026-09-15T13:00:00.000Z');
  assert.equal(supportDate('2026-09-15T13:00:00Z').toISOString(), '2026-09-15T13:00:00.000Z');
});
test('primeiro atendimento congela o resultado do SLA', () => {
  const c = { prazoAtendimento: '2026-09-15T10:00:00', primeiroAtendimento: '2026-09-15T10:00:00' };
  assert.equal(slaLabel(c, Date.parse('2030-01-01')), 'Atendido no prazo');
  assert.equal(slaLabel({ ...c, primeiroAtendimento: '2026-09-15T10:00:01' }), 'Atendido em atraso');
});
test('cancelado sem atendimento e legado não são classificados como vencidos', () => {
  assert.equal(slaLabel({ status: 'CANCELADO', prazoAtendimento: '2020-01-01T10:00:00' }), 'Cancelado');
  assert.equal(slaLabel({}), 'Sem SLA (legado)');
});
test('chamado aberto vence depois do limite', () => {
  const c = { prazoAtendimento: '2026-09-15T10:00:00' };
  assert.equal(slaLabel(c, Date.parse('2026-09-15T13:00:00Z')), 'Dentro do prazo');
  assert.equal(slaLabel(c, Date.parse('2026-09-15T13:00:01Z')), 'SLA vencido');
});
