export default function InfoBox({ children }) {
  return (
    <div className="rounded border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-300 leading-relaxed">
      {children}
    </div>
  );
}
