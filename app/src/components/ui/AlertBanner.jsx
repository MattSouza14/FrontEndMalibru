export default function AlertBanner({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-950/40 border-red-900/60 text-ws-red',
    success: 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400',
    warning: 'bg-amber-950/30 border-amber-900/50 text-amber-400',
    info: 'bg-primary/10 border-primary/30 text-ws-sky',
  };

  return (
    <div className={`p-4 rounded border text-sm ${styles[type] || styles.error}`}>
      {children}
    </div>
  );
}
