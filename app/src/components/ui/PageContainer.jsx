export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`p-5 lg:p-8 space-y-6 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}
