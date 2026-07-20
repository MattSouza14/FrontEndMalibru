import { useNavigate } from 'react-router-dom';
import {
  daysUntil,
  expiryBadgeClass,
  expiryLabel,
  formatDate,
} from '../utils/expiry';

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
}) {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
            {title}
          </p>
          <h2 className="font-serif text-2xl text-green-700 mt-1">Próximos do vencimento</h2>
          {urgentCount > 0 && (
            <p className="text-xs text-amber-700 mt-1">{urgentLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(linkTo)}
          className="text-xs font-bold uppercase tracking-widest text-green-700 hover:text-green-800"
        >
          Ver todos →
        </button>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 font-bold ${col.key === 'status' ? 'w-[6.75rem]' : ''}`}
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
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 ${col.key === 'status' ? 'whitespace-nowrap' : ''}`}
                      >
                        {col.render(item, days)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export function ExpiryStatusCell({ days }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[6.75rem] h-7 shrink-0 text-[10px] font-bold uppercase tracking-normal text-center ${expiryBadgeClass(days)}`}
    >
      {expiryLabel(days)}
    </span>
  );
}

export function DateCell({ value }) {
  return <span className="text-gray-600">{formatDate(value)}</span>;
}
