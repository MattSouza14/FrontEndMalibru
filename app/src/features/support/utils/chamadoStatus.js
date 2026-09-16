export const CHAMADO_STATUS = [
  'ABERTO',
  'EM_ATENDIMENTO',
  'AGUARDANDO_USUARIO',
  'RESOLVIDO',
  'FECHADO',
  'CANCELADO',
];

export const FERRAMENTAS_REMOTAS = [
  { value: 'ANYDESK', label: 'AnyDesk' },
  { value: 'TEAMVIEWER', label: 'TeamViewer' },
  { value: 'RUSTDESK', label: 'RustDesk' },
];

const STATUS_LABELS = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  AGUARDANDO_USUARIO: 'Aguardando usuário',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
};

const STATUS_CLASSES = {
  ABERTO: 'bg-amber-950/40 text-amber-400',
  EM_ATENDIMENTO: 'bg-primary/20 text-ws-sky',
  AGUARDANDO_USUARIO: 'bg-yellow-950/30 text-yellow-400',
  RESOLVIDO: 'bg-emerald-950/30 text-emerald-400',
  FECHADO: 'bg-ws-elevated text-ws-muted',
  CANCELADO: 'bg-red-950/40 text-ws-red',
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusClass(status) {
  return STATUS_CLASSES[status] ?? 'bg-ws-elevated text-ws-muted';
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFerramentaLabel(value) {
  return FERRAMENTAS_REMOTAS.find((f) => f.value === value)?.label ?? value;
}

export function isChamadoEncerrado(status) {
  return status === 'FECHADO' || status === 'CANCELADO';
}
