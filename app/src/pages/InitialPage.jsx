import { Link } from 'react-router-dom';

export default function InitialPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-6">
      <div className="text-center max-w-md">
        <div className="size-14 bg-primary rounded-xl flex items-center justify-center font-bold text-white text-2xl mx-auto mb-6">
          M
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Malibru Portal</h1>
        <p className="text-gray-500 mb-8">
          Portal corporativo para gestão de recursos, suporte e documentos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/Login" className="btn-primary text-center">
            Entrar
          </Link>
          <Link to="/Register" className="btn-outline text-center">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
