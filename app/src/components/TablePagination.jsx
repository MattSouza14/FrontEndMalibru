export default function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
}) {
  if (total <= pageSize) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-xs text-gray-500">
        Página {page} de {totalPages} · {total} registro(s)
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
