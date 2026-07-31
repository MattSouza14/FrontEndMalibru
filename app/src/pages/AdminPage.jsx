import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CsvImportPanel from '../components/CsvImportPanel';
import AlertBanner from '../components/ui/AlertBanner';
import KpiCard from '../components/ui/KpiCard';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import {
  activateUser,
  deactivateUser,
  importUsersCsv,
  listAvailableRoles,
  listUsers,
  updateUserRoles,
} from '../services/adminService';
import {
  linkOfficeLicenseToUser,
  listOfficeLicenses,
  unlinkOfficeLicenseFromUser,
} from '../services/officeLicenseService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { getUserOfficeLicenseId, normalizeAdminUser, normalizeAdminUsers } from '../utils/adminUser';
import { normalizeRoles } from '../utils/roles';

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

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function handleAuthFailure(logout, navigate) {
  logout();
  navigate('/Login', { replace: true });
}

const USERS_CSV_TEMPLATE = `nome,email,setor,roles,status
João Silva,joao@email.com,TI,"USER,TI",ativo
Maria Souza,maria@email.com,RH,SUPORTE,inativo
Pedro Lima,pedro@email.com,Financeiro,USER,ativo
`;

const USERS_CSV_ERROR_COLUMNS = [
  { key: 'linha', label: 'Linha' },
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'motivo', label: 'Motivo' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, getToken, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [pageLoading, setPageLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [licenseActionId, setLicenseActionId] = useState(null);
  const [licenseSelect, setLicenseSelect] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roleEdits, setRoleEdits] = useState({});
  const [rolesActionId, setRolesActionId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function loadData() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const [usersData, licensesData, rolesData] = await Promise.all([
        listUsers(token),
        listOfficeLicenses(token),
        listAvailableRoles(token),
      ]);
      setUsers(normalizeAdminUsers(usersData));
      setLicenses(Array.isArray(licensesData) ? licensesData : []);
      setAvailableRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar os usuários.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const licensesById = useMemo(
    () => Object.fromEntries(licenses.map((l) => [l.id, l])),
    [licenses],
  );

  const availableLicenses = useMemo(
    () => licenses.filter((l) => (l.vagasRestantes ?? 0) > 0),
    [licenses],
  );

  const filteredUsers = useMemo(() => {
    if (filter === 'pending') return users.filter((u) => !u.enabled);
    if (filter === 'active') return users.filter((u) => u.enabled);
    return users;
  }, [users, filter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      pending: users.filter((u) => !u.enabled).length,
      active: users.filter((u) => u.enabled).length,
    }),
    [users],
  );

  async function refreshLicenses(token) {
    const licensesData = await listOfficeLicenses(token);
    setLicenses(Array.isArray(licensesData) ? licensesData : []);
  }

  async function handleToggleStatus(targetUser) {
    const token = getToken();
    if (!token) return;

    if (targetUser.id === user?.id) {
      setError('Você não pode alterar o status da sua própria conta.');
      return;
    }

    setActionId(targetUser.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = targetUser.enabled
        ? await deactivateUser(token, targetUser.id)
        : await activateUser(token, targetUser.id);

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? normalizeAdminUser(updated) : u)));
      setSuccess(
        updated.enabled
          ? `Conta de ${updated.nome} ativada com sucesso.`
          : `Conta de ${updated.nome} desativada com sucesso.`,
      );
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível atualizar o usuário.'));
    } finally {
      setActionId(null);
    }
  }

  async function handleLinkLicense(targetUser) {
    const token = getToken();
    if (!token) return;

    const officeLicenseId = Number(licenseSelect[targetUser.id]);
    if (!officeLicenseId) {
      setError('Selecione uma licença com vagas disponíveis.');
      return;
    }

    setLicenseActionId(targetUser.id);
    setError(null);
    setSuccess(null);

    try {
      await linkOfficeLicenseToUser(token, targetUser.id, officeLicenseId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? normalizeAdminUser({ ...u, officeLicenseId })
            : u,
        ),
      );
      await refreshLicenses(token);
      setLicenseSelect((prev) => ({ ...prev, [targetUser.id]: '' }));
      setSuccess(`Licença Office vinculada a ${targetUser.nome}.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível vincular a licença.'));
    } finally {
      setLicenseActionId(null);
    }
  }

  function startRoleEdit(targetUser) {
    setRoleEdits((prev) => ({
      ...prev,
      [targetUser.id]: [...normalizeRoles(targetUser)],
    }));
    setError(null);
    setSuccess(null);
  }

  function cancelRoleEdit(userId) {
    setRoleEdits((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  function toggleRoleEdit(userId, role) {
    setRoleEdits((prev) => {
      const current = prev[userId] ?? [];
      const nextRoles = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role];

      return { ...prev, [userId]: nextRoles };
    });
  }

  async function handleSaveRoles(targetUser) {
    const token = getToken();
    if (!token) return;

    const roles = roleEdits[targetUser.id] ?? [];
    if (roles.length === 0) {
      setError('Selecione ao menos uma role para o usuário.');
      return;
    }

    setRolesActionId(targetUser.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateUserRoles(token, targetUser.id, roles);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? normalizeAdminUser(updated) : u)),
      );
      cancelRoleEdit(targetUser.id);
      setSuccess(`Roles de ${updated.nome} atualizadas com sucesso.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível atualizar as roles.'));
    } finally {
      setRolesActionId(null);
    }
  }

  async function handleUnlinkLicense(targetUser) {
    const token = getToken();
    if (!token) return;

    setLicenseActionId(targetUser.id);
    setError(null);
    setSuccess(null);

    try {
      await unlinkOfficeLicenseFromUser(token, targetUser.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, officeLicenseId: null } : u,
        ),
      );
      await refreshLicenses(token);
      setSuccess(`Licença Office desvinculada de ${targetUser.nome}.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível desvincular a licença.'));
    } finally {
      setLicenseActionId(null);
    }
  }

  async function handleImportCsv(file) {
    const token = getToken();
    if (!token) return;

    setImporting(true);
    setError(null);
    setSuccess(null);
    setImportResult(null);

    try {
      const result = await importUsersCsv(token, file);
      setImportResult(result);
      setSuccess(
        `${result.importados ?? 0} usuário(s) importado(s) com sucesso.` +
          (result.ignorados > 0 ? ` ${result.ignorados} linha(s) ignorada(s).` : ''),
      );
      await loadData();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível importar o arquivo.'));
    } finally {
      setImporting(false);
    }
  }

  if (pageLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500 text-center py-16">Carregando usuários...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={['Malibru Portal', 'Administração', 'Usuários']}
        title="Painel de Usuários"
        subtitle="Gerencie contas, ativações, roles e vínculos de licenças Office."
        actions={
          <button
            type="button"
            onClick={() => {
              setShowImport((current) => !current);
              setImportResult(null);
            }}
            className="btn-outline"
          >
            {showImport ? 'Fechar importação' : 'Importar CSV'}
          </button>
        }
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      {showImport && (
        <CsvImportPanel
          title="Importar usuários"
          description="Envie um CSV para cadastrar vários usuários de uma vez. Usuários inativos recebem e-mail de ativação; ativos já entram habilitados. Senha temporária é gerada automaticamente."
          templateFilename="modelo-usuarios.csv"
          templateContent={USERS_CSV_TEMPLATE}
          errorColumns={USERS_CSV_ERROR_COLUMNS}
          importing={importing}
          result={importResult}
          onImport={handleImportCsv}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total" value={stats.total} accent="default" />
        <KpiCard label="Pendentes" value={stats.pending} accent="amber" subtext="Aguardando ativação" />
        <KpiCard label="Ativos" value={stats.active} accent="green" subtext="Contas habilitadas" />
      </div>

      <SectionCard title="Usuários cadastrados" noPadding bodyClassName="p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'active', label: 'Ativos' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                filter === key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Setor</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Licença Office</th>
                <th>Cadastro</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    Nenhum usuário encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isStatusLoading = actionId === u.id;
                  const isLicenseLoading = licenseActionId === u.id;
                  const linkedLicense = getUserOfficeLicenseId(u)
                    ? licensesById[getUserOfficeLicenseId(u)]
                    : null;

                  return (
                    <tr key={u.id}>
                      <td className="font-medium text-gray-900">{u.nome}</td>
                      <td className="text-gray-600">{u.email}</td>
                      <td className="text-gray-600">{u.setor || '—'}</td>
                      <td className="px-6 py-4 min-w-[220px]">
                        {roleEdits[u.id] ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {availableRoles.map((role) => (
                                <label
                                  key={role}
                                  className="inline-flex items-center gap-1.5 text-xs text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={roleEdits[u.id].includes(role)}
                                    onChange={() => toggleRoleEdit(u.id, role)}
                                    className="accent-green-700"
                                  />
                                  {role}
                                </label>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={rolesActionId === u.id}
                                onClick={() => handleSaveRoles(u)}
                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-green-700 hover:bg-green-800 text-white disabled:opacity-50 inline-flex items-center gap-2"
                              >
                                {rolesActionId === u.id && <Loader2 />}
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelRoleEdit(u.id)}
                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {normalizeRoles(u).map((role) => (
                                <span
                                  key={role}
                                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                                    role === 'ADMIN'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => startRoleEdit(u)}
                                className="text-[10px] font-bold uppercase tracking-widest text-green-700 hover:text-green-800"
                              >
                                Editar roles
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                            u.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.enabled ? 'Ativo' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 min-w-[180px]">
                        {linkedLicense ? (
                          <span className="text-sm">{linkedLicense.email}</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Sem licença
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-2 min-w-[220px]">
                          {!isSelf && (
                            <>
                              {getUserOfficeLicenseId(u) ? (
                                <button
                                  type="button"
                                  disabled={isLicenseLoading}
                                  onClick={() => handleUnlinkLicense(u)}
                                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                  {isLicenseLoading && <Loader2 />}
                                  Desvincular licença
                                </button>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                  <select
                                    value={licenseSelect[u.id] || ''}
                                    onChange={(e) =>
                                      setLicenseSelect((prev) => ({
                                        ...prev,
                                        [u.id]: e.target.value,
                                      }))
                                    }
                                    className="px-3 py-2 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-xs min-w-[160px]"
                                  >
                                    <option value="">Licença...</option>
                                    {availableLicenses.map((license) => (
                                      <option key={license.id} value={license.id}>
                                        {license.email}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={
                                      isLicenseLoading ||
                                      availableLicenses.length === 0 ||
                                      !licenseSelect[u.id]
                                    }
                                    onClick={() => handleLinkLicense(u)}
                                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-green-700 hover:bg-green-800 text-white disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                  >
                                    {isLicenseLoading && <Loader2 />}
                                    Vincular
                                  </button>
                                </div>
                              )}
                              <button
                                type="button"
                                disabled={isStatusLoading}
                                onClick={() => handleToggleStatus(u)}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2 disabled:opacity-50 ${
                                  u.enabled
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-700 hover:bg-green-800 text-white'
                                }`}
                              >
                                {isStatusLoading && <Loader2 />}
                                {u.enabled ? 'Desativar' : 'Ativar'}
                              </button>
                            </>
                          )}
                          {isSelf && (
                            <span className="text-xs text-gray-400">Sua conta</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
