import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessMaintenance, canAccessTiModules } from '../src/shared/lib/roles.js';
import { maintenancePayload, maintenanceStatus, validateMaintenance } from '../src/features/inventory/utils/maintenance.js';
const valid = { equipamentoId: '1', descricaoProblema: ' Defeito ', dataEnvio: '2026-09-10', contatoFornecedor: '', valor: '', dataRetorno: '', encerrada: false, versao: 0 };
test('manutenção aceita apenas TI ADMIN e COMPRAS sem ampliar acesso ao inventário', () => {
  for (const role of ['TI', 'ADMIN', 'COMPRAS']) assert.equal(canAccessMaintenance({ roles: [role] }), true);
  for (const role of ['USER', 'SUPORTE', 'RH']) assert.equal(canAccessMaintenance({ roles: [role] }), false);
  assert.equal(canAccessTiModules({ roles: ['COMPRAS'] }), false);
});
test('manutenção valida retorno, encerramento e valor', () => {
  assert.equal(validateMaintenance(valid, '2026-09-17'), null);
  for (const changes of [{ encerrada: true }, { dataRetorno: '2026-09-09' }, { dataEnvio: '2026-09-18' }, { valor: '-1' }, { valor: '1.234' }]) assert.ok(validateMaintenance({ ...valid, ...changes }, '2026-09-17'));
  assert.equal(validateMaintenance({ ...valid, encerrada: true, dataRetorno: valid.dataEnvio, valor: '0.00' }, '2026-09-17'), null);
});
test('payload mantém precisão decimal, opcionais nulos e versão zero', () => {
  const payload = maintenancePayload(valid);
  assert.equal(payload.valor, null); assert.equal(payload.contatoFornecedor, null); assert.equal(payload.dataRetorno, null); assert.equal(payload.versao, 0);
  assert.equal(maintenancePayload({ ...valid, valor: '1250.50' }).valor, '1250.50');
});
test('retorno e encerramento são estados distintos', () => {
  assert.equal(maintenanceStatus(valid), 'Em manutenção');
  assert.equal(maintenanceStatus({ ...valid, dataRetorno: '2026-09-17' }), 'Aguardando encerramento');
  assert.equal(maintenanceStatus({ ...valid, encerrada: true }), 'Encerrada');
});
