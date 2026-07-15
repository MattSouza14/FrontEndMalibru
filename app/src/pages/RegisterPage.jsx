import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

function Field({ label, children }) {
  return (
    <label className="block group space-y-1.5">
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-0.5 group-focus-within:text-green-700 transition-colors">
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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const user = await register(form);
      setSuccess(true);
      console.log('Conta criada:', user);

      // Opcional: redirecionar para login após 2s
      setTimeout(() => navigate('/Login'), 2000);
    } catch (err) {
      if (err.code === 'EMAIL_JA_CADASTRADO') {
        setError('Este e-mail já está cadastrado.');
      } else if (err.code === 'VALIDATION_ERROR') {
        const messages = Object.entries(err.details || {})
          .map(([campo, msg]) => `${campo}: ${msg}`)
          .join(' | ');
        setError(messages || err.message);
      } else {
        setError(err.message || 'Não foi possível criar a conta.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-2xl mx-auto p-6 md:p-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-3">
            Novo Cadastro
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Criar sua conta</h1>
          <p className="mt-2 text-sm text-gray-600 max-w-md">
            Preencha os dados abaixo. Após validação, você terá acesso ao painel.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 bg-white border border-gray-200 p-6 md:p-8 shadow-sm space-y-5"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
              Conta criada com sucesso! Aguarde ativação ou faça login quando liberada.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="E-mail corporativo">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm font-light placeholder:text-gray-400"
                placeholder="voce@empresa.com.br"
              />
            </Field>

            <Field label="Senha">
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm placeholder:text-gray-400"
                placeholder="Mínimo 6 caracteres"
              />
            </Field>

            <Field label="Nome">
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm font-mono placeholder:text-gray-400"
                placeholder="Nome Completo"
              />
            </Field>

            <Field label="Setor">
              <input
                type="text"
                name="setor"
                value={form.setor}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm font-mono placeholder:text-gray-400"
                placeholder="Setor"
              />
            </Field>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-green-700 text-white py-3 px-8 text-xs font-bold uppercase tracking-[0.2em] hover:bg-green-800 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
            <p className="mt-4 text-[11px] text-gray-500">
              Ao criar sua conta você aceita os termos de uso do Malibru Portal.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}