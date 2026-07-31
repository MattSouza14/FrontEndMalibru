export default function InfoBox({ children }) {
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 leading-relaxed">
      {children}
    </div>
  );
}
