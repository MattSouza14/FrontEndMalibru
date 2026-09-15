export function supportDate(value) {
  if (!value) return null;
  return new Date(/[Zz]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + '-03:00');
}
export function slaLabel(c, now = Date.now()) {
  if (!c.prazoAtendimento) return 'Sem SLA (legado)';
  if (c.status === 'CANCELADO' && !c.primeiroAtendimento) return 'Cancelado';
  const deadline = supportDate(c.prazoAtendimento).getTime();
  if (c.primeiroAtendimento) return supportDate(c.primeiroAtendimento).getTime() <= deadline ? 'Atendido no prazo' : 'Atendido em atraso';
  return now > deadline ? 'SLA vencido' : 'Dentro do prazo';
}
export const prioridadeLabel = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };
