import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiErrors';

function IconMail() {
  return (
    <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function Loader2() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const FEATURES = [
  {
    title: 'Licenças e equipamentos',
    description: 'Consulte recursos vinculados à sua conta em tempo real.',
  },
  {
    title: 'Chamados de suporte',
    description: 'Abra tickets e acompanhe o atendimento pela conversa integrada.',
  },
  {
    title: 'Painel administrativo',
    description: 'Gestão centralizada para perfis TI e Admin.',
  },
];

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
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[#f4f7fb]">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-12 xl:p-16 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center font-semibold text-lg">
            M
          </div>
          <div>
            <p className="font-semibold text-lg tracking-tight">Malibru</p>
            <p className="text-sm text-white/60">Portal interno</p>
          </div>
        </div>

        <div className="relative space-y-10 max-w-lg">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-white/80">
              <IconSpark />
              Plataforma corporativa
            </p>
            <h2 className="text-4xl xl:text-[2.75rem] font-bold leading-[1.15] tracking-tight">
              Tudo o que você precisa, em um só lugar.
            </h2>
            <p className="text-white/65 text-base leading-relaxed">
              Acesse licenças, equipamentos, chamados e documentos com segurança e praticidade.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm px-5 py-4"
              >
                <p className="font-medium text-white/95">{feature.title}</p>
                <p className="text-sm text-white/55 mt-1 leading-relaxed">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/35">© 2026 Malibru. Todos os direitos reservados.</p>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </div>

        <div className="relative w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center font-semibold text-white">
              M
            </div>
            <div>
              <p className="font-semibold text-gray-900">Malibru Portal</p>
              <p className="text-sm text-gray-500">Acesso interno</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)] p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bem-vindo de volta</h1>
              <p className="text-sm text-gray-500 mt-2">Entre com suas credenciais corporativas</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">E-mail</span>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconMail />
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all text-sm"
                    placeholder="voce@empresa.com.br"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Senha</span>
                  <span className="text-xs text-gray-400 cursor-not-allowed" title="Em breve">
                    Esqueci minha senha
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconLock />
                  </span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                />
                <span className="text-sm text-gray-600">Manter conectado neste dispositivo</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white py-3.5 text-sm font-semibold transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
              >
                {loading && <Loader2 />}
                {loading ? 'Entrando...' : 'Entrar no portal'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Ainda não tem conta?{' '}
                <Link to="/Register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center">
            <a
              href="https://malibru.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-400 hover:text-primary transition-colors"
            >
              malibru.com.br ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
