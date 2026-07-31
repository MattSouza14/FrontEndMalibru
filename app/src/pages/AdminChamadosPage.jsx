import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChamadoStatusBadge from '../components/ChamadoStatusBadge';
import OpenChamadoForm from '../components/OpenChamadoForm';
import AlertBanner from '../components/ui/AlertBanner';
import KpiCard from '../components/ui/KpiCard';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import {
  listAdminChamados,
  openChamado,
  updateChamadoStatus,
} from '../services/chamadoService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import {
  CHAMADO_STATUS,
  formatDateTime,
  getFerramentaLabel,
  getStatusLabel,
} from '../utils/chamadoStatus';

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

export default function AdminChamadosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken, logout } = useAuth();
  const [chamados, setChamados] = useState([]);
  const [filter, setFilter] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(searchParams.get('novo') === '1');
  const [expandedId, setExpandedId] = useState(null);

  async function loadChamados(status = filter) {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const data = await listAdminChamados(token, status || undefined);
      setChamados(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar os chamados.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadChamados();
  }, []);

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setShowForm(true);
    }
  }, [searchParams]);

  const stats = useMemo(
    () => ({
      abertos: chamados.filter((c) => c.status === 'ABERTO').length,
      emAtendimento: chamados.filter((c) => c.status === 'EM_ATENDIMENTO').length,
      total: chamados.length,
    }),
    [chamados],
  );

  function openForm() {
    setShowForm(true);
    setSearchParams({ novo: '1' });
    setError(null);
    setSuccess(null);
  }

  function closeForm() {
    setShowForm(false);
    setSearchParams({});
  }

  async function handleFilter(status) {
    setFilter(status);
    await loadChamados(status);
  }

  async function handleOpenChamado(payload) {
    const token = getToken();
    if (!token) return false;

    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await openChamado(token, payload);
      setSuccess('Chamado aberto com sucesso!');
      closeForm();
      await loadChamados();
      return true;
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return false;
      }
      setError(getApiErrorMessage(err, 'Não foi possível abrir o chamado.'));
      return false;
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleStatusChange(chamado, newStatus) {
    if (chamado.status === newStatus) return;

    const token = getToken();
    if (!token) return;

    setUpdatingId(chamado.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateChamadoStatus(token, chamado.id, newStatus);
      setChamados((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSuccess(`Status do chamado #${updated.id} atualizado.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível atualizar o status.'));
    } finally {
      setUpdatingId(null);
    }
  }

  if (pageLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500 text-center py-16">Carregando chamados...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={['Malibru Portal', 'Suporte', 'Atendimento']}
        title="Atendimento de Chamados"
        subtitle="Visualize, atenda e atualize o status dos chamados de suporte."
        actions={
          !showForm ? (
            <button type="button" onClick={openForm} className="btn-primary">
              Abrir chamado
            </button>
          ) : null
        }
      />

      {error && !showForm && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total" value={stats.total} />
        <KpiCard label="Abertos" value={stats.abertos} accent="amber" />
        <KpiCard label="Em atendimento" value={stats.emAtendimento} accent="blue" />
      </div>

      {showForm && (
        <OpenChamadoForm
          onSubmit={handleOpenChamado}
          onCancel={closeForm}
          loading={submitLoading}
          error={error}
        />
      )}

      <SectionCard title="Chamados" noPadding bodyClassName="p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-2">
          {[
            { key: '', label: 'Todos' },
            { key: 'ABERTO', label: 'Abertos' },
            { key: 'EM_ATENDIMENTO', label: 'Em atendimento' },
            { key: 'AGUARDANDO_USUARIO', label: 'Aguardando' },
            { key: 'RESOLVIDO', label: 'Resolvidos' },
          ].map(({ key, label }) => (
            <button
              key={key || 'all'}
              type="button"
              onClick={() => handleFilter(key)}
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
                <th>Assunto</th>
                <th>Solicitante</th>
                <th>Status</th>
                <th>Abertura</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {chamados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Nenhum chamado encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                chamados.map((chamado) => (
                  <Fragment key={chamado.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{chamado.assunto}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getFerramentaLabel(chamado.ferramentaRemota)} ·{' '}
                          {chamado.codigoAcessoRemoto}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{chamado.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ChamadoStatusBadge status={chamado.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDateTime(chamado.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === chamado.id ? null : chamado.id)
                          }
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          {expandedId === chamado.id ? 'Fechar' : 'Atender'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === chamado.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-5">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3 text-sm">
                              <p>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                  Descrição
                                </span>
                                <span className="block mt-1 text-gray-700">{chamado.descricao}</span>
                              </p>
                              <p>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                  Telefone
                                </span>
                                <span className="block mt-1 text-gray-700">
                                  {chamado.telefoneContato}
                                </span>
                              </p>
                              <p>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                  Código remoto
                                </span>
                                <span className="block mt-1 text-gray-700 font-mono">
                                  {chamado.codigoAcessoRemoto}
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                                Atualizar status
                              </p>
                              <select
                                value={chamado.status}
                                disabled={updatingId === chamado.id}
                                onChange={(e) => handleStatusChange(chamado, e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm disabled:opacity-50"
                              >
                                {CHAMADO_STATUS.map((status) => (
                                  <option key={status} value={status}>
                                    {getStatusLabel(status)}
                                  </option>
                                ))}
                              </select>
                              {updatingId === chamado.id && (
                                <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-2">
                                  <Loader2 /> Salvando...
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
