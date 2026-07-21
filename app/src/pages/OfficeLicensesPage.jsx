import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listUsers } from '../services/adminService';
import {
  createOfficeLicense,
  deleteOfficeLicense,
  getOfficeLicense,
  linkOfficeLicenseToUser,
  listOfficeLicenseUsers,
  listOfficeLicenses,
  unlinkOfficeLicenseFromUser,
  updateOfficeLicense,
} from '../services/officeLicenseService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import {
  getUserOfficeLicenseId,
  normalizeAdminUser,
  normalizeAdminUsers,
} from '../utils/adminUser';

const EMPTY_FORM = {
  email: '',
  senha: '',
  vencimento: '',
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

function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function handleAuthFailure(logout, navigate) {
  logout();
  navigate('/Login', { replace: true });
}

function LicenseUsersModal({
  license,
  users,
  loading,
  unlinkingUserId,
  onClose,
  onUnlink,
}) {
  if (!license) return null;

  const linkedCount = license.usuariosVinculados ?? 0;
  const showMissingHint = !loading && linkedCount > 0 && users.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white border border-gray-200 w-full max-w-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-users-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-200">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Usuários vinculados
            </p>
            <h2 id="license-users-title" className="font-serif text-xl text-green-700 mt-1">
              {license.email}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Vencimento: {formatDate(license.vencimento)} ·{' '}
              {license.usuariosVinculados ?? users.length}/5 vinculados
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <p className="px-6 py-10 text-sm text-gray-500 text-center">
              Carregando usuários vinculados...
            </p>
          ) : users.length === 0 ? (
            <div className="px-6 py-10 text-center space-y-2">
              <p className="text-sm text-gray-500">
                Nenhum usuário vinculado a esta licença.
              </p>
              {showMissingHint && (
                <p className="text-xs text-amber-700 max-w-sm mx-auto">
                  O backend indica {linkedCount} vínculo(s), mas não enviou a lista de usuários.
                  Atualize a API para retornar <strong>officeLicenseId</strong> em{' '}
                  <strong>GET /api/admin/usuarios</strong> ou crie{' '}
                  <strong>GET /api/admin/office-licenses/{'{id}'}/usuarios</strong>.
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.nome}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    {user.setor && (
                      <p className="text-xs text-gray-400 mt-0.5">{user.setor}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={unlinkingUserId === user.id}
                    onClick={() => onUnlink(user)}
                    className="shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-widest bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {unlinkingUserId === user.id && <Loader2 />}
                    Desvincular
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OfficeLicensesPage() {
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [linking, setLinking] = useState(false);
  const [unlinkingUserId, setUnlinkingUserId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [linkForm, setLinkForm] = useState({ usuarioId: '', officeLicenseId: '' });
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  async function resolveLicenseUsers(token, license, currentUsers) {
    const licenseId = Number(license.id);

    try {
      const data = await listOfficeLicenseUsers(token, licenseId);
      const fromEndpoint = normalizeAdminUsers(
        Array.isArray(data) ? data : data?.usuarios ?? [],
      );
      if (fromEndpoint.length > 0) return fromEndpoint;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    const detail = await getOfficeLicense(token, licenseId);
    const fromDetail = normalizeAdminUsers(
      Array.isArray(detail?.usuarios) ? detail.usuarios : [],
    );
    if (fromDetail.length > 0) return fromDetail;

    const freshUsers = normalizeAdminUsers(await listUsers(token));
    const fromFreshList = freshUsers.filter(
      (user) => getUserOfficeLicenseId(user) === licenseId,
    );
    if (fromFreshList.length > 0) {
      setUsers(freshUsers);
      return fromFreshList;
    }

    return currentUsers.filter((user) => getUserOfficeLicenseId(user) === licenseId);
  }

  async function openLicenseModal(license) {
    const token = getToken();
    if (!token) return;

    setSelectedLicense(license);
    setModalLoading(true);
    setModalUsers([]);

    try {
      const linked = await resolveLicenseUsers(token, license, users);
      setModalUsers(linked);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar os usuários vinculados.'));
      setSelectedLicense(null);
    } finally {
      setModalLoading(false);
    }
  }

  async function refreshModalUsers(license) {
    const token = getToken();
    if (!token || !license) return;

    const linked = await resolveLicenseUsers(token, license, users);
    setModalUsers(linked);
  }

  function closeLicenseModal() {
    setSelectedLicense(null);
    setModalUsers([]);
  }

  async function loadData() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const [licensesData, usersData] = await Promise.all([
        listOfficeLicenses(token),
        listUsers(token),
      ]);
      setLicenses(Array.isArray(licensesData) ? licensesData : []);
      setUsers(normalizeAdminUsers(usersData));
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar as licenças.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedLicense) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') closeLicenseModal();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLicense]);

  useEffect(() => {
    if (!selectedLicense) return;
    const updated = licenses.find((l) => l.id === selectedLicense.id);
    if (updated) setSelectedLicense(updated);
  }, [licenses, selectedLicense?.id]);

  const availableLicenses = useMemo(
    () => licenses.filter((l) => (l.vagasRestantes ?? 0) > 0),
    [licenses],
  );

  const usersWithoutLicense = useMemo(
    () => users.filter((u) => !getUserOfficeLicenseId(u)),
    [users],
  );

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
      email: license.email ?? '',
      senha: '',
      vencimento: license.vencimento ?? '',
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

  async function refreshLicenses(token) {
    const licensesData = await listOfficeLicenses(token);
    const nextLicenses = Array.isArray(licensesData) ? licensesData : [];
    setLicenses(nextLicenses);
    return nextLicenses;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const email = form.email.trim();
    const senha = form.senha.trim();
    const vencimento = form.vencimento.trim();

    if (!email || !vencimento) {
      setError('E-mail e vencimento são obrigatórios.');
      return;
    }

    if (!senha) {
      setError('Senha é obrigatória.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = { email, senha, vencimento };

    try {
      if (editingId) {
        const updated = await updateOfficeLicense(token, editingId, payload);
        setLicenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccess('Licença atualizada com sucesso!');
      } else {
        const created = await createOfficeLicense(token, payload);
        setLicenses((prev) => [...prev, created]);
        setSuccess('Licença cadastrada com sucesso!');
      }
      closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível salvar a licença.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(license) {
    const confirmed = window.confirm(
      `Excluir a licença ${license.email}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(license.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteOfficeLicense(token, license.id);
      setLicenses((prev) => prev.filter((item) => item.id !== license.id));
      setUsers((prev) =>
        prev.map((u) =>
          getUserOfficeLicenseId(u) === license.id ? { ...u, officeLicenseId: null } : u,
        ),
      );
      setSuccess('Licença excluída com sucesso!');
      if (editingId === license.id) closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir a licença.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const usuarioId = Number(linkForm.usuarioId);
    const officeLicenseId = Number(linkForm.officeLicenseId);

    if (!usuarioId || !officeLicenseId) {
      setError('Selecione usuário e licença para vincular.');
      return;
    }

    setLinking(true);
    setError(null);
    setSuccess(null);

    try {
      await linkOfficeLicenseToUser(token, usuarioId, officeLicenseId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === usuarioId ? normalizeAdminUser({ ...u, officeLicenseId }) : u,
        ),
      );
      await refreshLicenses(token);
      if (selectedLicense?.id === officeLicenseId) {
        await refreshModalUsers(selectedLicense);
      }
      setLinkForm({ usuarioId: '', officeLicenseId: '' });
      setSuccess('Licença vinculada ao usuário com sucesso!');
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível vincular a licença.'));
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(user) {
    const token = getToken();
    if (!token) return;

    setUnlinkingUserId(user.id);
    setError(null);
    setSuccess(null);

    try {
      await unlinkOfficeLicenseFromUser(token, user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, officeLicenseId: null } : u)),
      );
      setModalUsers((prev) => prev.filter((u) => u.id !== user.id));
      const nextLicenses = await refreshLicenses(token);
      if (selectedLicense) {
        const updated = nextLicenses.find((l) => l.id === selectedLicense.id);
        if (updated) setSelectedLicense(updated);
      }
      setSuccess(`Licença desvinculada de ${user.nome}.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível desvincular a licença.'));
    } finally {
      setUnlinkingUserId(null);
    }
  }

  if (pageLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-gray-500">Carregando licenças...</p>
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
          <h1 className="font-serif italic text-4xl text-green-700">Licenças Office</h1>
          <p className="text-sm text-gray-600 mt-2">
            Cadastre licenças Microsoft Office e vincule a usuários (máx. 5 por licença).
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

      <form onSubmit={handleLink} className="bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="font-serif text-xl text-green-700">Vincular licença a usuário</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Usuário
            </span>
            <select
              value={linkForm.usuarioId}
              onChange={(e) => setLinkForm((prev) => ({ ...prev, usuarioId: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
            >
              <option value="">Selecione...</option>
              {usersWithoutLicense.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Licença com vagas
            </span>
            <select
              value={linkForm.officeLicenseId}
              onChange={(e) =>
                setLinkForm((prev) => ({ ...prev, officeLicenseId: e.target.value }))
              }
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
            >
              <option value="">Selecione...</option>
              {availableLicenses.map((license) => (
                <option key={license.id} value={license.id}>
                  {license.email} · {license.vagasRestantes ?? 0} vaga(s)
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={linking || usersWithoutLicense.length === 0 || availableLicenses.length === 0}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {linking && <Loader2 />}
            Vincular
          </button>
        </div>
      </form>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="font-serif text-xl text-green-700">
            {editingId ? 'Editar licença' : 'Cadastrar licença'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                E-mail da licença
              </span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Senha
              </span>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => updateField('senha', e.target.value)}
                placeholder={editingId ? 'Informe a senha da licença' : 'Senha da conta Office'}
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
                value={form.vencimento}
                onChange={(e) => updateField('vencimento', e.target.value)}
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-serif text-lg text-green-700">Licenças cadastradas</h2>
          <p className="text-xs text-gray-500 mt-1">
            Clique em uma linha para ver os usuários vinculados.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-6 py-3 font-bold">E-mail</th>
              <th className="px-6 py-3 font-bold">Vencimento</th>
              <th className="px-6 py-3 font-bold">Vinculados</th>
              <th className="px-6 py-3 font-bold">Vagas</th>
              <th className="px-6 py-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  Nenhuma licença cadastrada.
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <tr
                  key={license.id}
                  onClick={() => openLicenseModal(license)}
                  className="border-b border-gray-100 hover:bg-green-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{license.email}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(license.vencimento)}</td>
                  <td className="px-6 py-4 text-gray-600">{license.usuariosVinculados ?? 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                        (license.vagasRestantes ?? 0) > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {license.vagasRestantes ?? 0} restantes
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(license);
                      }}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === license.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(license);
                      }}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {deletingId === license.id && <Loader2 />}
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LicenseUsersModal
        license={selectedLicense}
        users={modalUsers}
        loading={modalLoading}
        unlinkingUserId={unlinkingUserId}
        onClose={closeLicenseModal}
        onUnlink={handleUnlink}
      />
    </div>
  );
}
