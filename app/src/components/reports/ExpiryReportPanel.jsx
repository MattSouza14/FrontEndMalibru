import ProgressBar from '../ui/ProgressBar';

export default function ExpiryReportPanel({ segments, topItems, dateField, renderLabel }) {
  if (!segments.length && !topItems?.length) {
    return <p className="text-sm text-gray-500">Nenhum registro para exibir.</p>;
  }

  return (
    <div className="space-y-4">
      {segments.length > 0 && (
        <>
          <ProgressBar segments={segments} />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`size-2 rounded-full ${s.color}`} />
                {s.label}: {s.value}
              </span>
            ))}
          </div>
        </>
      )}
      {topItems?.length > 0 && (
        <div className={segments.length > 0 ? 'pt-3 border-t border-gray-100' : ''}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Próximos vencimentos
          </p>
          <ul className="space-y-2">
            {topItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-800 truncate">{renderLabel(item)}</span>
                <span className="text-gray-500 tabular-nums shrink-0 text-xs">
                  {item[dateField]?.split('-').reverse().join('/')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
