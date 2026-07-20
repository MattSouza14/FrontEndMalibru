export function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

export function daysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

export function expiryLabel(days) {
  if (days < 0) return `Vencida · ${Math.abs(days)}d`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Amanhã';
  return `${days} dias`;
}

export function expiryBadgeClass(days) {
  if (days < 0) return 'bg-red-100 text-red-800';
  if (days <= 7) return 'bg-amber-100 text-amber-800';
  if (days <= 30) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function getTopExpiring(items, dateField, limit = 5) {
  return [...items]
    .filter((item) => item[dateField])
    .sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]))
    .slice(0, limit);
}
