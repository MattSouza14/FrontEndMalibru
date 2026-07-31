export default function PageHeader({ breadcrumbs = [], title, subtitle, actions }) {
  return (
    <header className="space-y-3">
      {breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-gray-300">›</span>}
              <span className={index === breadcrumbs.length - 1 ? 'text-gray-700 font-medium' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
