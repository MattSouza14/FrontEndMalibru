import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { activateUser, deactivateUser, listUsers } from '../services/adminService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';

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

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, getToken, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [pageLoading, setPageLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function loadUsers() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const data = await listUsers(token);
      setUsers(Array.isArray(data) ? data : []);
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
    loadUsers();
  }, []);

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

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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

  if (pageLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-gray-500">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
        <header>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
            Administração
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Painel de Usuários</h1>
          <p className="text-sm text-gray-600 mt-2">
            Gerencie contas pendentes e ativas do portal.
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total</p>
            <p className="text-2xl font-serif text-green-700 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Pendentes
            </p>
            <p className="text-2xl font-serif text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Ativos</p>
            <p className="text-2xl font-serif text-green-700 mt-1">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'pending', label: 'Pendentes' },
              { key: 'active', label: 'Ativos' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  filter === key
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="px-6 py-3 font-bold">Nome</th>
                  <th className="px-6 py-3 font-bold">E-mail</th>
                  <th className="px-6 py-3 font-bold">Setor</th>
                  <th className="px-6 py-3 font-bold">Perfil</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold">Cadastro</th>
                  <th className="px-6 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      Nenhum usuário encontrado para este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isLoading = actionId === u.id;

                    return (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{u.nome}</td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                        <td className="px-6 py-4 text-gray-600">{u.setor || '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                              u.role === 'ADMIN'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {u.role}
                          </span>
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
                        <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          {isSelf ? (
                            <span className="text-xs text-gray-400">Sua conta</span>
                          ) : (
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleToggleStatus(u)}
                              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2 disabled:opacity-50 ${
                                u.enabled
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-700 hover:bg-green-800 text-white'
                              }`}
                            >
                              {isLoading && <Loader2 />}
                              {u.enabled ? 'Desativar' : 'Ativar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
