import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import { listUsers } from '../services/adminService';
import {
  createSoftwareLicense,
  deleteSoftwareLicense,
  listSoftwareLicenses,
  updateSoftwareLicense,
} from '../services/softwareLicenseService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { daysUntil, expiryBadgeClass, expiryLabel, formatDate } from '../utils/expiry';
import { clampPageAfterChange, paginateItems } from '../utils/pagination';

const PAGE_SIZE = 5;

const EMPTY_FORM = {
  nome: '',
  dataVencimento: '',
  usuarioId: '',
  qtdLicencas: '1',
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

export default function SoftwareLicensesPage() {
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tablePage, setTablePage] = useState(1);

  const tablePagination = useMemo(
    () => paginateItems(licenses, tablePage, PAGE_SIZE),
    [licenses, tablePage],
  );

  useEffect(() => {
    setTablePage((current) => clampPageAfterChange(licenses.length, current, PAGE_SIZE));
  }, [licenses.length]);

  async function loadData() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const [licensesData, usersData] = await Promise.all([
        listSoftwareLicenses(token),
        listUsers(token),
      ]);
      setLicenses(Array.isArray(licensesData) ? licensesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar as licenças de software.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function openEditForm(license) {
    setEditingId(license.id);
    setForm({
      nome: license.nome ?? '',
      dataVencimento: license.dataVencimento ?? '',
      usuarioId: String(license.usuarioId ?? ''),
      qtdLicencas: String(license.qtdLicencas ?? 1),
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
    const usuarioId = Number(form.usuarioId);
    const qtdLicencas = Number(form.qtdLicencas) || 1;

    if (!nome || !dataVencimento) {
      setError('Nome e data de vencimento são obrigatórios.');
      return;
    }

    if (!usuarioId) {
      setError('Selecione o usuário vinculado à licença.');
      return;
    }

    if (qtdLicencas < 1) {
      setError('A quantidade de licenças deve ser no mínimo 1.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      nome,
      dataVencimento,
      usuarioId,
      qtdLicencas,
    };

    try {
      if (editingId) {
        const updated = await updateSoftwareLicense(token, editingId, payload);
        setLicenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccess('Licença de software atualizada com sucesso!');
      } else {
        const created = await createSoftwareLicense(token, payload);
        setLicenses((prev) => [...prev, created]);
        setSuccess('Licença de software cadastrada com sucesso!');
      }
      closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível salvar a licença de software.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(license) {
    const confirmed = window.confirm(
      `Excluir a licença "${license.nome}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(license.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteSoftwareLicense(token, license.id);
      setLicenses((prev) => prev.filter((item) => item.id !== license.id));
      setSuccess('Licença de software excluída com sucesso!');
      if (editingId === license.id) closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir a licença de software.'));
    } finally {
      setDeletingId(null);
    }
  }

  if (pageLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-gray-500">Carregando licenças de software...</p>
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
          <h1 className="font-serif italic text-4xl text-green-700">Licenças de Software</h1>
          <p className="text-sm text-gray-600 mt-2">
            Cadastre licenças de software vinculadas a usuários (Adobe, AutoCAD, etc.).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Nova licença
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
            {editingId ? 'Editar licença' : 'Cadastrar licença'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Nome do software
              </span>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                placeholder="Ex.: Adobe Creative Cloud"
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

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Quantidade
              </span>
              <input
                type="number"
                min={1}
                value={form.qtdLicencas}
                onChange={(e) => updateField('qtdLicencas', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Usuário
              </span>
              <select
                required
                value={form.usuarioId}
                onChange={(e) => updateField('usuarioId', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              >
                <option value="">Selecione...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </option>
                ))}
              </select>
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
              <th className="px-6 py-3 font-bold">Software</th>
              <th className="px-6 py-3 font-bold">Usuário</th>
              <th className="px-6 py-3 font-bold">Vencimento</th>
              <th className="px-6 py-3 font-bold">Situação</th>
              <th className="px-6 py-3 font-bold">Qtd.</th>
              <th className="px-6 py-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Nenhuma licença de software cadastrada.
                </td>
              </tr>
            ) : (
              tablePagination.items.map((license) => {
                const days = daysUntil(license.dataVencimento);

                return (
                  <tr key={license.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{license.nome}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{license.usuarioNome}</p>
                      <p className="text-xs text-gray-500">{license.usuarioEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(license.dataVencimento)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${expiryBadgeClass(days)}`}
                      >
                        {expiryLabel(days)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{license.qtdLicencas ?? 1}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditForm(license)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === license.id}
                        onClick={() => handleDelete(license)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {deletingId === license.id && <Loader2 />}
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <TablePagination
          page={tablePagination.page}
          totalPages={tablePagination.totalPages}
          total={tablePagination.total}
          pageSize={PAGE_SIZE}
          onPrev={() => setTablePage((p) => Math.max(1, p - 1))}
          onNext={() => setTablePage((p) => Math.min(tablePagination.totalPages, p + 1))}
        />
      </div>
    </div>
  );
}
