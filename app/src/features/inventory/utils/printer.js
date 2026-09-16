export const TONER_COLORS = [
  { value: 'preto', label: 'Preto', badge: 'bg-ws-canvas text-ws-bright border border-ws-border-strong' },
  { value: 'ciano', label: 'Ciano', badge: 'bg-cyan-900/50 text-ws-cyan border border-cyan-800/50' },
  { value: 'magenta', label: 'Magenta', badge: 'bg-fuchsia-900/50 text-fuchsia-300 border border-fuchsia-800/50' },
  { value: 'amarelo', label: 'Amarelo', badge: 'bg-yellow-900/40 text-ws-yellow border border-yellow-800/50' },
  { value: 'outro', label: 'Outro', badge: 'bg-ws-elevated text-ws-muted border border-ws-border-strong' },
];

export function formatTonerColor(value) {
  return TONER_COLORS.find((item) => item.value === value)?.label ?? value ?? '—';
}

export function getTonerColorBadge(value) {
  return TONER_COLORS.find((item) => item.value === value)?.badge ?? 'bg-ws-elevated text-ws-secondary border border-ws-border-strong';
}

export function getPrinterFillState(printer) {
  const linked = printer.tonersVinculados ?? 0;
  const capacity = printer.qtdToners ?? 1;
  if (linked >= capacity) return 'full';
  if (linked > 0) return 'partial';
  return 'empty';
}

export function getPrinterFillLabel(state) {
  if (state === 'full') return 'Lotada';
  if (state === 'partial') return 'Parcial';
  return 'Vazia';
}

export function getPrinterFillClass(state) {
  if (state === 'full') return 'text-ws-red';
  if (state === 'partial') return 'text-amber-400';
  return 'text-emerald-400';
}
