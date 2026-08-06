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
    <div className="px-5 py-4 border-t border-ws-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-xs text-ws-muted tabular-nums font-mono">
        Página {page} de {totalPages} · {total} registro(s)
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="btn-secondary"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="btn-secondary"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
