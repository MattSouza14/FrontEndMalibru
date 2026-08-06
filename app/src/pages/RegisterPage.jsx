import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiErrors';
import { validateRegisterForm } from '../utils/validation';
import AlertBanner from '../components/ui/AlertBanner';

function Field({ label, children }) {
  return (
    <label className="block group space-y-1.5">
      <span className="form-label group-focus-within:text-primary transition-colors">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    setor: '',
  });

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const errors = validateRegisterForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        setor: form.setor.trim() || undefined,
      };
      await register(payload);
      setSuccess(true);
      setTimeout(() => navigate('/Login'), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível criar a conta.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] bg-sidebar flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-primary rounded flex items-center justify-center font-bold text-xl">
            M
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight">Malibru</p>
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
              Portal Institucional
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">Crie sua conta corporativa</h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-md">
            Após o cadastro, você receberá um e-mail para ativar sua conta e acessar o portal.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-white/40">Malibru &copy; 2026</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface-muted p-6 sm:p-10">
        <div className="w-full max-w-xl">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white">
              M
            </div>
            <p className="font-bold text-sidebar">Malibru Portal</p>
          </div>

          <div className="bg-ws-panel rounded-2xl border border-ws-border shadow-card p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-ws-bright">Criar conta</h1>
              <p className="text-sm text-ws-muted mt-1">
                Preencha os dados abaixo para solicitar acesso ao portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <AlertBanner type="error">{error}</AlertBanner>}
              {success && (
                <AlertBanner type="success">
                  Conta criada! Verifique seu e-mail para ativar. Redirecionando para o login...
                </AlertBanner>
              )}

              <div className="grid md:grid-cols-2 gap-5">
                <Field label="E-mail corporativo">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={150}
                    className="form-input"
                    placeholder="voce@empresa.com.br"
                  />
                  <p className="text-[11px] text-ws-muted mt-1">
                    Use um e-mail válido com domínio existente (validado pelo servidor).
                  </p>
                  {fieldErrors.email && (
                    <p className="text-xs text-ws-red mt-1">{fieldErrors.email}</p>
                  )}
                </Field>

                <Field label="Senha">
                  <input
                    type="password"
                    name="senha"
                    value={form.senha}
                    onChange={handleChange}
                    maxLength={100}
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                  />
                  {fieldErrors.senha && (
                    <p className="text-xs text-ws-red mt-1">{fieldErrors.senha}</p>
                  )}
                </Field>

                <Field label="Nome">
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    maxLength={150}
                    className="form-input"
                    placeholder="Nome completo"
                  />
                  {fieldErrors.nome && (
                    <p className="text-xs text-ws-red mt-1">{fieldErrors.nome}</p>
                  )}
                </Field>

                <Field label="Setor">
                  <input
                    type="text"
                    name="setor"
                    value={form.setor}
                    onChange={handleChange}
                    maxLength={100}
                    className="form-input"
                    placeholder="Setor"
                  />
                  {fieldErrors.setor && (
                    <p className="text-xs text-ws-red mt-1">{fieldErrors.setor}</p>
                  )}
                </Field>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar conta'}
              </button>

              <p className="text-sm text-ws-muted text-center">
                Já tem conta?{' '}
                <Link to="/Login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
