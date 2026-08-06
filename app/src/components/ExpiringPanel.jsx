import { useNavigate } from 'react-router-dom';
import {
  daysUntil,
  expiryBadgeClass,
  expiryLabel,
  formatDate,
} from '../utils/expiry';
import ProgressBar, { expirySegmentColor } from './ui/ProgressBar';

function buildAgingSegments(items, dateField) {
  const buckets = {
    ok: { key: 'ok', value: 0, color: 'bg-emerald-500', label: 'A vencer (>30d)' },
    warn: { key: 'warn', value: 0, color: 'bg-yellow-400', label: '31–90 dias' },
    urgent: { key: 'urgent', value: 0, color: 'bg-amber-500', label: '1–30 dias' },
    overdue: { key: 'overdue', value: 0, color: 'bg-red-500', label: 'Vencido' },
  };

  items.forEach((item) => {
    const days = daysUntil(item[dateField]);
    if (days < 0) buckets.overdue.value += 1;
    else if (days <= 7) buckets.urgent.value += 1;
    else if (days <= 30) buckets.warn.value += 1;
    else buckets.ok.value += 1;
  });

  return Object.values(buckets);
}

export default function ExpiringPanel({
  title,
  loading,
  emptyMessage,
  items,
  dateField,
  linkTo,
  columns,
  urgentCount,
  urgentLabel,
  embedded = false,
}) {
  const navigate = useNavigate();
  const agingSegments = buildAgingSegments(items, dateField);

  const tableBlock = (
    <div className="overflow-x-auto">
      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-ws-muted">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ws-muted">{emptyMessage}</p>
      ) : (
        <>
          <div className="px-6 pt-5 pb-4 border-b border-ws-border">
            <ProgressBar segments={agingSegments} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {agingSegments
                .filter((s) => s.value > 0)
                .map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-ws-muted">
                    <span className={`size-2 rounded-full ${s.color}`} />
                    {s.label}: {s.value}
                  </span>
                ))}
            </div>
          </div>
          <table className="data-table w-full">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={col.key === 'status' ? 'w-[7rem]' : ''}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const days = daysUntil(item[dateField]);
                return (
                  <tr key={item.id}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={col.key === 'status' ? 'whitespace-nowrap' : ''}
                      >
                        {col.render(item, days)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        {urgentCount > 0 && (
          <p className="text-xs text-amber-700 font-medium">{urgentLabel}</p>
        )}
        <div className="bg-ws-panel rounded border border-ws-border shadow-card overflow-hidden">
          {tableBlock}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(linkTo)}
            className="btn-ghost"
          >
            Ver todos de {title} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-ws-muted">
            {title}
          </p>
          <h2 className="text-xl font-bold text-ws-bright mt-1">Próximos do vencimento</h2>
          {urgentCount > 0 && (
            <p className="text-xs text-amber-700 mt-1 font-medium">{urgentLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(linkTo)}
          className="btn-ghost"
        >
          Ver todos →
        </button>
      </div>
      <div className="bg-ws-panel rounded border border-ws-border shadow-card overflow-hidden">
        {tableBlock}
      </div>
    </section>
  );
}

export function ExpiryStatusCell({ days }) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[6.5rem] h-7 px-2 shrink-0 text-[10px] font-semibold uppercase tracking-normal text-center rounded-md ${expiryBadgeClass(days)}`}
    >
      {expiryLabel(days)}
    </span>
  );
}

export function DateCell({ value }) {
  return <span className="text-ws-secondary tabular-nums">{formatDate(value)}</span>;
}

export { expirySegmentColor };
