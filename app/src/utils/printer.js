export const TONER_COLORS = [
  { value: 'preto', label: 'Preto', badge: 'bg-gray-800 text-white' },
  { value: 'ciano', label: 'Ciano', badge: 'bg-cyan-500 text-white' },
  { value: 'magenta', label: 'Magenta', badge: 'bg-fuchsia-500 text-white' },
  { value: 'amarelo', label: 'Amarelo', badge: 'bg-yellow-400 text-gray-900' },
  { value: 'outro', label: 'Outro', badge: 'bg-gray-600 text-white' },
];

export function formatTonerColor(value) {
  return TONER_COLORS.find((item) => item.value === value)?.label ?? value ?? '—';
}

export function getTonerColorBadge(value) {
  return TONER_COLORS.find((item) => item.value === value)?.badge ?? 'bg-gray-700 text-gray-100';
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
  if (state === 'full') return 'text-red-400';
  if (state === 'partial') return 'text-amber-400';
  return 'text-emerald-400';
}
