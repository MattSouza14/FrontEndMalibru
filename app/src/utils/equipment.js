export function formatEmpresaLabel(empresa) {
  if (!empresa) return '—';
  return String(empresa)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
