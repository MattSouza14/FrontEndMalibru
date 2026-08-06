export default function KpiCard({ icon, label, value, subtext, accent = 'default', onClick }) {
  const accentClasses = {
    default: 'text-ws-bright',
    green: 'text-accent',
    amber: 'text-amber-400',
    red: 'text-ws-red',
    blue: 'text-ws-sky',
  };

  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { type: 'button', onClick, className: 'text-left w-full' }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={`panel-card p-5 h-full transition-all ${
          onClick ? 'hover:border-accent/40 cursor-pointer' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className="size-10 rounded bg-primary/15 text-ws-sky flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ws-muted">
              {label}
            </p>
            <p className={`text-2xl font-bold mt-1 tabular-nums font-mono ${accentClasses[accent] || accentClasses.default}`}>
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-ws-muted mt-1.5 leading-snug">{subtext}</p>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
