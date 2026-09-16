export function paginateItems(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export function clampPageAfterChange(totalItems, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  return Math.min(page, totalPages);
}
