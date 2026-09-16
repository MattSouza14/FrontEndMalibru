export function expirySegmentColor(days) {
  if (days < 0) return 'bg-red-500';
  if (days <= 7) return 'bg-amber-500';
  if (days <= 30) return 'bg-yellow-400';
  return 'bg-emerald-500';
}

