export function expirySegmentColor(days) {
  if (days < 0) return 'bg-red-500';
  if (days <= 7) return 'bg-amber-500';
  if (days <= 30) return 'bg-yellow-400';
  return 'bg-emerald-500';
}

export default function ProgressBar({ segments = [], className = '' }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div className={`h-3 rounded-full bg-gray-100 ${className}`} />
    );
  }

  return (
    <div className={`flex h-3 rounded-full overflow-hidden bg-gray-100 ${className}`}>
      {segments.map((segment) => {
        const width = (segment.value / total) * 100;
        if (width <= 0) return null;
        return (
          <div
            key={segment.key}
            className={`${segment.color} transition-all`}
            style={{ width: `${width}%` }}
            title={segment.label}
          />
        );
      })}
    </div>
  );
}

export function ExpiryProgressBar({ days, maxDays = 90 }) {
  const clamped = Math.max(0, Math.min(days, maxDays));
  const percent = days < 0 ? 100 : ((maxDays - clamped) / maxDays) * 100;
  const color = expirySegmentColor(days);

  return (
    <div className="space-y-1">
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(percent, days < 0 ? 100 : 8)}%` }}
        />
      </div>
    </div>
  );
}
