export default function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) {
  return (
    <section className={`panel-card ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-ws-border flex items-start justify-between gap-4 bg-ws-elevated/50">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="size-10 rounded bg-primary/15 text-ws-sky flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ws-secondary">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-ws-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `px-5 py-5 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}
