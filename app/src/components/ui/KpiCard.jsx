export default function KpiCard({ icon, label, value, subtext, accent = 'default', onClick }) {
  const accentClasses = {
    default: 'text-slate-900',
    green: 'text-primary',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };

  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { type: 'button', onClick, className: 'text-left w-full' }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={`bg-white rounded-xl border border-gray-100 shadow-card p-5 h-full transition-all ${
          onClick ? 'hover:border-primary/30 hover:shadow-md cursor-pointer' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {label}
            </p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${accentClasses[accent] || accentClasses.default}`}>
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-gray-500 mt-1.5 leading-snug">{subtext}</p>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
