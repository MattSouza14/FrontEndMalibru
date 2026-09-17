export function maintenanceStatus(item) {
  if (item.encerrada) return 'Encerrada';
  return item.dataRetorno ? 'Aguardando encerramento' : 'Em manutenção';
}

export function maintenancePayload(form) {
  return {
    equipamentoId: Number(form.equipamentoId),
    descricaoProblema: form.descricaoProblema.trim(),
    dataEnvio: form.dataEnvio,
    contatoFornecedor: form.contatoFornecedor.trim() || null,
    valor: form.valor === '' ? null : form.valor,
    dataRetorno: form.dataRetorno || null,
    encerrada: form.encerrada,
    versao: form.versao,
  };
}

export function todayInSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function validateMaintenance(form, today = todayInSaoPaulo()) {
  if (!form.equipamentoId) return 'Selecione um equipamento cadastrado.';
  if (!form.descricaoProblema.trim()) return 'Descreva o problema do equipamento.';
  if (!form.dataEnvio || form.dataEnvio > today) return 'Informe uma data de envio até hoje.';
  if (form.dataRetorno && (form.dataRetorno < form.dataEnvio || form.dataRetorno > today)) return 'O retorno deve estar entre o envio e hoje.';
  if (form.encerrada && !form.dataRetorno) return 'Informe o retorno para encerrar a manutenção.';
  if (form.valor !== '' && (!/^\d{1,10}(\.\d{1,2})?$/.test(form.valor))) return 'Informe um valor não negativo com até duas casas decimais.';
  return null;
}
