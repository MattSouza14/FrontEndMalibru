export default function ReportBarList({ items = [], valueSuffix = '', emptyMessage = 'Sem dados.' }) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const width = (item.value / max) * 100;
        return (
          <li key={item.label ?? item.key}>
            <div className="flex items-center justify-between gap-3 text-sm mb-1">
              <span className="text-gray-700 truncate">{item.label}</span>
              <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                {item.value}
                {valueSuffix}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color || 'bg-blue-500'} transition-all`}
                style={{ width: `${Math.max(width, item.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
