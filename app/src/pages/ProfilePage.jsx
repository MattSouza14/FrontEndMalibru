import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateProfile } from "../services/profileService";
import { getApiErrorMessage, isUnauthorized } from "../utils/apiErrors";

const EMPTY_FORM = {
  nome: "",
  email: "",
  setor: "",
  role: "",
  enabled: false,
};

function Loader2() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function Building2Icon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

// Simple TopNav component
function TopNav({ onBackHome }) {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-green-700 flex items-center justify-center">
            <span className="text-white font-serif font-bold italic">M</span>
          </div>
          <span className="font-serif font-bold text-lg tracking-tight uppercase">
            Malibru <span className="text-green-500"> Portal</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onBackHome}
          className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-green-700 transition-colors"
        >
          Voltar para Home
        </button>
      </div>
    </nav>
  );
}

function profileToForm(profile) {
  return {
    nome: profile.nome ?? "",
    email: profile.email ?? "",
    setor: profile.setor ?? "",
    role: profile.role ?? "",
    enabled: profile.enabled ?? false,
  };
}

function buildPatchPayload(initial, current) {
  const payload = {};
  if (current.nome !== initial.nome) payload.nome = current.nome;
  if (current.email !== initial.email) payload.email = current.email;
  if (current.setor !== initial.setor) payload.setor = current.setor;
  return payload;
}

function handleAuthFailure(logout, navigate) {
  logout();
  navigate("/Login", { replace: true });
}
function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}) {
  return (
    <label className="block group space-y-1.5">
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-0.5 group-focus-within:text-green-700 transition-colors inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm placeholder:text-gray-400"
      />
    </label>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { getToken, updateUser, logout } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);

  useEffect(() => {
    async function loadProfile() {
      const token = getToken();
      if (!token) return;

      setPageLoading(true);
      setError(null);

      try {
        const profile = await getMyProfile(token);
        const nextForm = profileToForm(profile);
        setForm(nextForm);
        setInitialForm(nextForm);
      } catch (err) {
        if (isUnauthorized(err)) {
          handleAuthFailure(logout, navigate);
          return;
        }
        setError(getApiErrorMessage(err, "Não foi possível carregar seu perfil."));
      } finally {
        setPageLoading(false);
      }
    }

    loadProfile();
  }, []);
  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setSuccess(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const nome = form.nome.trim();
    const email = form.email.trim();

    if (!nome || !email) {
      setError("Nome e e-mail são obrigatórios.");
      return;
    }

    const payload = buildPatchPayload(initialForm, { ...form, nome, email });
    if (Object.keys(payload).length === 0) {
      setError("Nenhuma alteração foi detectada.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile(token, payload);
      const nextForm = profileToForm(updated);
      setForm(nextForm);
      setInitialForm(nextForm);
      updateUser(updated);
      setSuccess("Perfil atualizado com sucesso!");
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, "Não foi possível atualizar o perfil."));
    } finally {
      setLoading(false);
    }
  }
  const initial = (form.nome || form.email || "U")[0]?.toUpperCase();

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <TopNav onBackHome={() => navigate("/HomePage")} />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <header>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
            Conta
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Meu Perfil</h1>
          <p className="text-sm text-gray-600 mt-2">
            Atualize seu nome, e-mail e setor.
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-4">
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="size-24 mx-auto bg-green-100 border border-green-300 rounded-full flex items-center justify-center font-serif italic text-green-700 text-4xl mb-4">
                {initial}
              </div>
              <p className="font-serif text-lg text-green-700">{form.nome || "—"}</p>
              <p className="text-xs text-gray-500 mt-1">{form.email}</p>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2Icon />
                  <span>{form.setor || "Setor não informado"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldIcon />
                  <span>Perfil: {form.role || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <IdCardIcon />
                  <span>{form.enabled ? "Acesso Ativo" : "Aguardando ativação"}</span>
                </div>
                {form.role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    className="mt-4 w-full bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Painel Admin
                  </button>
                )}
              </div>
            </div>
          </aside>

          <section className="col-span-12 md:col-span-8">
            <form
              onSubmit={onSubmit}
              className="bg-white border border-gray-200 p-8 space-y-5"
            >
              <Field
                icon={<UserIcon />}
                label="Nome completo"
                value={form.nome || ""}
                onChange={(v) => update("nome", v)}
              />
              <Field
                icon={<MailIcon />}
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
              />
              <Field
                icon={<Building2Icon />}
                label="Setor"
                value={form.setor || ""}
                onChange={(v) => update("setor", v)}
              />

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 />}
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
