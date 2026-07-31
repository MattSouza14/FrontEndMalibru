import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import AlertBanner from '../components/ui/AlertBanner';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
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
import { clampPageAfterChange, paginateItems } from '../utils/pagination';

const PAGE_SIZE = 5;

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
        className="bg-white rounded-xl border border-gray-100 w-full max-w-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-users-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
          <div>
            <p className="form-label">Usuários vinculados</p>
            <h2 id="license-users-title" className="text-lg font-semibold text-slate-900 mt-1">
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

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
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
  const [tablePage, setTablePage] = useState(1);

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

  const tablePagination = useMemo(
    () => paginateItems(licenses, tablePage, PAGE_SIZE),
    [licenses, tablePage],
  );

  useEffect(() => {
    setTablePage((current) => clampPageAfterChange(licenses.length, current, PAGE_SIZE));
  }, [licenses.length]);

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
      <PageContainer>
        <p className="text-sm text-gray-500 text-center py-16">Carregando licenças...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={['Malibru Portal', 'TI', 'Licenças Office']}
        title="Licenças Office"
        subtitle="Cadastre licenças Microsoft Office e vincule a usuários (máx. 5 por licença)."
        actions={
          <button type="button" onClick={openCreateForm} className="btn-primary">
            Nova licença
          </button>
        }
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      <SectionCard title="Vincular licença a usuário">
        <form onSubmit={handleLink} className="space-y-4 -mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="block space-y-1.5">
              <span className="form-label">Usuário</span>
              <select
                value={linkForm.usuarioId}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, usuarioId: e.target.value }))}
                className="form-input"
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
              <span className="form-label">Licença com vagas</span>
              <select
                value={linkForm.officeLicenseId}
                onChange={(e) =>
                  setLinkForm((prev) => ({ ...prev, officeLicenseId: e.target.value }))
                }
                className="form-input"
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
              className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {linking && <Loader2 />}
              Vincular
            </button>
          </div>
        </form>
      </SectionCard>

      {showForm && (
        <SectionCard title={editingId ? 'Editar licença' : 'Cadastrar licença'}>
          <form onSubmit={handleSubmit} className="space-y-4 -mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="form-label">E-mail da licença</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="form-label">Senha</span>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => updateField('senha', e.target.value)}
                  placeholder={editingId ? 'Informe a senha da licença' : 'Senha da conta Office'}
                  className="form-input"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="form-label">Vencimento</span>
                <input
                  type="date"
                  required
                  value={form.vencimento}
                  onChange={(e) => updateField('vencimento', e.target.value)}
                  className="form-input"
                />
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={closeForm} className="btn-cancel">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 />}
                {editingId ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="Licenças cadastradas"
        subtitle="Clique em uma linha para ver os usuários vinculados."
        noPadding
        bodyClassName="p-0"
      >
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Vencimento</th>
              <th>Vinculados</th>
              <th>Vagas</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-10">
                  Nenhuma licença cadastrada.
                </td>
              </tr>
            ) : (
              tablePagination.items.map((license) => (
                <tr
                  key={license.id}
                  onClick={() => openLicenseModal(license)}
                  className="cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <td className="font-medium text-gray-900">{license.email}</td>
                  <td className="text-gray-600 tabular-nums">{formatDate(license.vencimento)}</td>
                  <td className="text-gray-600">{license.usuariosVinculados ?? 0}</td>
                  <td>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
                        (license.vagasRestantes ?? 0) > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {license.vagasRestantes ?? 0} restantes
                    </span>
                  </td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(license);
                      }}
                      className="btn-secondary"
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
                      className="btn-danger"
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
        <TablePagination
          page={tablePagination.page}
          totalPages={tablePagination.totalPages}
          total={tablePagination.total}
          pageSize={PAGE_SIZE}
          onPrev={() => setTablePage((p) => Math.max(1, p - 1))}
          onNext={() => setTablePage((p) => Math.min(tablePagination.totalPages, p + 1))}
        />
      </SectionCard>

      <LicenseUsersModal
        license={selectedLicense}
        users={modalUsers}
        loading={modalLoading}
        unlinkingUserId={unlinkingUserId}
        onClose={closeLicenseModal}
        onUnlink={handleUnlink}
      />
    </PageContainer>
  );
}
