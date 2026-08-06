import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiErrors';
import AlertBanner from '../components/ui/AlertBanner';

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
    <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
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
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-ws-canvas">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ws-elevated p-12 xl:p-16 text-ws-bright">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,179,66,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(124,179,66,.35) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ws-canvas/60 via-transparent to-accent/[0.04]" />
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="size-10 rounded bg-ws-panel border border-ws-border-strong flex items-center justify-center font-mono font-semibold text-lg text-accent">
            M
          </div>
          <div>
            <p className="font-mono font-semibold text-lg tracking-tight text-ws-bright">Malibru</p>
            <p className="text-sm text-ws-muted">Portal interno</p>
          </div>
        </div>

        <div className="relative space-y-10 max-w-lg">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-ws-panel/80 border border-ws-border px-3 py-1 text-xs font-medium text-ws-secondary">
              <IconSpark />
              Plataforma corporativa
            </p>
            <h2 className="text-4xl xl:text-[2.75rem] font-bold font-mono leading-[1.15] tracking-tight text-ws-bright">
              Tudo o que você precisa, em um só lugar.
            </h2>
            <p className="text-ws-muted text-base leading-relaxed">
              Acesse licenças, equipamentos, chamados e documentos com segurança e praticidade.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded bg-ws-panel/70 border border-ws-border px-5 py-4"
              >
                <p className="font-mono font-medium text-ws-bright">{feature.title}</p>
                <p className="text-sm text-ws-muted mt-1 leading-relaxed">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ws-muted">© 2026 Malibru. Todos os direitos reservados.</p>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 sm:px-10 bg-ws-panel">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="size-10 rounded bg-accent flex items-center justify-center font-mono font-semibold text-accent-foreground">
              M
            </div>
            <div>
              <p className="font-mono font-semibold text-ws-bright">Malibru Portal</p>
              <p className="text-sm text-ws-muted">Acesso interno</p>
            </div>
          </div>

          <div className="rounded border border-ws-border bg-ws-elevated shadow-card p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold font-mono text-ws-bright tracking-tight">Bem-vindo de volta</h1>
              <p className="text-sm text-ws-muted mt-2">Entre com suas credenciais corporativas</p>
            </div>

            {error && (
              <div className="mb-6">
                <AlertBanner type="error">{error}</AlertBanner>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="form-label">E-mail</span>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ws-muted">
                    <IconMail />
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-11"
                    placeholder="voce@empresa.com.br"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="form-label">Senha</span>
                  <span className="text-xs text-ws-muted cursor-not-allowed" title="Em breve">
                    Esqueci minha senha
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ws-muted">
                    <IconLock />
                  </span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="form-input pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                  className="size-4 rounded border-ws-border-strong bg-ws-panel text-accent focus:ring-accent/30 cursor-pointer"
                />
                <span className="text-sm text-ws-secondary">Manter conectado neste dispositivo</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 />}
                {loading ? 'Entrando...' : 'Entrar no portal'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-ws-border text-center">
              <p className="text-sm text-ws-muted">
                Ainda não tem conta?{' '}
                <Link to="/Register" className="font-semibold text-accent hover:text-accent-light transition-colors">
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
              className="text-xs text-ws-muted hover:text-accent transition-colors"
            >
              malibru.com.br ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
