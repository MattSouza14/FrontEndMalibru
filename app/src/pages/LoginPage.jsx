import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiErrors';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manterConectado, setManterConectado] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login({ email, senha });
      loginSuccess(data, manterConectado);
      navigate('/HomePage');
    } catch (err) {
      if (err.code === 'CREDENCIAIS_INVALIDAS') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(getApiErrorMessage(err, 'Não foi possível acessar o sistema.'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] bg-sidebar flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="size-11 bg-primary rounded-xl flex items-center justify-center font-bold text-xl">
              M
            </div>
            <div>
              <p className="font-bold text-lg tracking-tight">Malibru</p>
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
                Portal Institucional
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Gestão centralizada de recursos e suporte
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-md">
            Acesse licenças, equipamentos, chamados e documentos corporativos em um único portal.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-white/40">
          Malibru &copy; 2026
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface-muted p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white">
              M
            </div>
            <div>
              <p className="font-bold text-sidebar">Malibru Portal</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Institucional</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
              <p className="text-sm text-gray-500 mt-1">Use suas credenciais corporativas</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block group space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold group-focus-within:text-primary transition-colors">
                  E-mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                  placeholder="voce@empresa.com.br"
                />
              </label>

              <label className="block group space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold group-focus-within:text-primary transition-colors">
                    Senha
                  </span>
                  <a href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                    Esqueci minha senha
                  </a>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                />
              </label>

              <label className="flex items-center gap-2 cursor-pointer group pt-1">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Manter conectado
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 disabled:opacity-50 mt-2"
              >
                {loading ? 'Acessando...' : 'Acessar Sistema'}
              </button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              Não tem conta?{' '}
              <Link to="/Register" className="text-primary hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://malibru.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Site institucional ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
