export default function ReportBarList({
  items = [],
  valueSuffix = '',
  emptyMessage = 'Sem dados.',
  onItemClick,
  selectedKey,
}) {
  if (!items.length) {
    return <p className="text-sm text-ws-muted">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);
  const isInteractive = typeof onItemClick === 'function';

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const itemKey = item.key ?? item.label;
        const width = (item.value / max) * 100;
        const isSelected = selectedKey != null && selectedKey === itemKey;

        const content = (
          <>
            <div className="flex items-center justify-between gap-3 text-sm mb-1">
              <span className={`truncate ${isSelected ? 'text-primary font-medium' : 'text-ws-secondary'}`}>
                {item.label}
              </span>
              <span className="font-semibold text-ws-bright tabular-nums shrink-0">
                {item.value}
                {valueSuffix}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ws-elevated overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color || 'bg-primary/150'} transition-all`}
                style={{ width: `${Math.max(width, item.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={itemKey}>
            {isInteractive ? (
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className={`w-full text-left rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-ws-canvas ${
                  isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                }`}
                aria-pressed={isSelected}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
