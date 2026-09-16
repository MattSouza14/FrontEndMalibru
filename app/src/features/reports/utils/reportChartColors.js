export const CHART_PALETTE = [
  '#007acc',
  '#7cb342',
  '#569cd6',
  '#fbbf24',
  '#f48771',
  '#4ec9b0',
  '#9cdcfe',
  '#ce9178',
  '#888888',
  '#094771',
];

export const TAILWIND_FILL_MAP = {
  'bg-blue-500': '#007acc',
  'bg-primary': '#007acc',
  'bg-indigo-500': '#569cd6',
  'bg-slate-500': '#888888',
  'bg-teal-500': '#4ec9b0',
  'bg-violet-500': '#569cd6',
  'bg-emerald-500': '#7cb342',
  'bg-amber-500': '#fbbf24',
  'bg-yellow-400': '#dcdcaa',
  'bg-red-500': '#f48771',
  'bg-ws-border-strong': '#444444',
  'bg-gray-500': '#888888',
  'bg-gray-900': '#1a1a1a',
  'bg-cyan-500': '#4ec9b0',
  'bg-fuchsia-500': '#ce9178',
};

export function resolveChartFill(item, index) {
  if (item.fill) return item.fill;
  if (item.color && TAILWIND_FILL_MAP[item.color]) {
    return TAILWIND_FILL_MAP[item.color];
  }
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
