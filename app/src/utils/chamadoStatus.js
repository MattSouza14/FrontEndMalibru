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
  ABERTO: 'bg-amber-100 text-amber-800',
  EM_ATENDIMENTO: 'bg-blue-100 text-blue-800',
  AGUARDANDO_USUARIO: 'bg-yellow-100 text-yellow-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
  FECHADO: 'bg-gray-100 text-gray-600',
  CANCELADO: 'bg-red-100 text-red-800',
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusClass(status) {
  return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';
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
