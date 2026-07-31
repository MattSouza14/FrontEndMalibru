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
    <section className={`bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `px-6 py-5 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}
