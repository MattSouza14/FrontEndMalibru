export const CHART_PALETTE = [
  '#3b82f6',
  '#15803d',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#ec4899',
  '#64748b',
  '#0ea5e9',
];

export const TAILWIND_FILL_MAP = {
  'bg-blue-500': '#3b82f6',
  'bg-primary': '#15803d',
  'bg-indigo-500': '#6366f1',
  'bg-slate-500': '#64748b',
  'bg-teal-500': '#14b8a6',
  'bg-violet-500': '#8b5cf6',
  'bg-emerald-500': '#10b981',
  'bg-amber-500': '#f59e0b',
  'bg-yellow-400': '#facc15',
  'bg-red-500': '#ef4444',
  'bg-gray-300': '#d1d5db',
  'bg-gray-500': '#6b7280',
  'bg-gray-900': '#111827',
  'bg-cyan-500': '#06b6d4',
  'bg-fuchsia-500': '#d946ef',
};

export function resolveChartFill(item, index) {
  if (item.fill) return item.fill;
  if (item.color && TAILWIND_FILL_MAP[item.color]) {
    return TAILWIND_FILL_MAP[item.color];
  }
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
