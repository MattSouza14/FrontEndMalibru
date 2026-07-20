import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createCertificate,
  deleteCertificate,
  listCertificates,
  updateCertificate,
} from '../services/certificateService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatDate } from '../utils/expiry';

const EMPTY_FORM = {
  nome: '',
  dataVencimento: '',
  empresa: '',
};

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

function handleAuthFailure(logout, navigate) {
  logout();
  navigate('/Login', { replace: true });
}

export default function CertificatesPage() {
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadCertificates() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const data = await listCertificates(token);
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar os certificados.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function openEditForm(certificate) {
    setEditingId(certificate.id);
    setForm({
      nome: certificate.nome ?? '',
      dataVencimento: certificate.dataVencimento ?? '',
      empresa: certificate.empresa ?? '',
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const nome = form.nome.trim();
    const dataVencimento = form.dataVencimento.trim();
    const empresa = form.empresa.trim();

    if (!nome || !dataVencimento) {
      setError('Nome e data de vencimento são obrigatórios.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      nome,
      dataVencimento,
      ...(empresa ? { empresa } : {}),
    };

    try {
      if (editingId) {
        const updated = await updateCertificate(token, editingId, payload);
        setCertificates((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccess('Certificado atualizado com sucesso!');
      } else {
        const created = await createCertificate(token, payload);
        setCertificates((prev) => [...prev, created]);
        setSuccess('Certificado cadastrado com sucesso!');
      }
      closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível salvar o certificado.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(certificate) {
    const confirmed = window.confirm(
      `Excluir o certificado "${certificate.nome}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(certificate.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteCertificate(token, certificate.id);
      setCertificates((prev) => prev.filter((item) => item.id !== certificate.id));
      setSuccess('Certificado excluído com sucesso!');
      if (editingId === certificate.id) closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir o certificado.'));
    } finally {
      setDeletingId(null);
    }
  }

  if (pageLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-gray-500">Carregando certificados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
            Administração
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Certificados</h1>
          <p className="text-sm text-gray-600 mt-2">
            Gerencie certificados digitais e acompanhe datas de vencimento.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Novo certificado
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="font-serif text-xl text-green-700">
            {editingId ? 'Editar certificado' : 'Cadastrar certificado'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Nome
              </span>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Empresa
              </span>
              <input
                type="text"
                value={form.empresa}
                onChange={(e) => updateField('empresa', e.target.value)}
                placeholder="Opcional"
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Vencimento
              </span>
              <input
                type="date"
                required
                value={form.dataVencimento}
                onChange={(e) => updateField('dataVencimento', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 />}
              {editingId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-6 py-3 font-bold">Nome</th>
              <th className="px-6 py-3 font-bold">Empresa</th>
              <th className="px-6 py-3 font-bold">Vencimento</th>
              <th className="px-6 py-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  Nenhum certificado cadastrado.
                </td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{certificate.nome}</td>
                  <td className="px-6 py-4 text-gray-600">{certificate.empresa || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(certificate.dataVencimento)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(certificate)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === certificate.id}
                      onClick={() => handleDelete(certificate)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {deletingId === certificate.id && <Loader2 />}
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
