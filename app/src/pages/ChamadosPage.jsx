import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChamadoMessagesPanel from '../components/ChamadoMessagesPanel';
import ChamadoStatusBadge from '../components/ChamadoStatusBadge';
import OpenChamadoForm from '../components/OpenChamadoForm';
import AlertBanner from '../components/ui/AlertBanner';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { listMyChamados, openChamado } from '../services/chamadoService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatDateTime, getFerramentaLabel } from '../utils/chamadoStatus';

function handleAuthFailure(logout, navigate) {
  logout();
  navigate('/Login', { replace: true });
}

export default function ChamadosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken, logout } = useAuth();
  const [chamados, setChamados] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(searchParams.get('novo') === '1');
  const [expandedId, setExpandedId] = useState(null);

  async function loadChamados() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const data = await listMyChamados(token);
      setChamados(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar seus chamados.'));
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

  async function handleOpenChamado(payload) {
    const token = getToken();
    if (!token) return false;

    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await openChamado(token, payload);
      setChamados((prev) => [created, ...prev]);
      setSuccess('Chamado aberto com sucesso!');
      closeForm();
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
        breadcrumbs={['Malibru Portal', 'Conta', 'Meus Chamados']}
        title="Meus Chamados"
        subtitle="Abra um chamado de suporte técnico e acompanhe o andamento."
        actions={
          !showForm ? (
            <button type="button" onClick={openForm} className="btn-primary">
              Novo chamado
            </button>
          ) : null
        }
      />

      {success && <AlertBanner type="success">{success}</AlertBanner>}
      {error && !showForm && <AlertBanner type="error">{error}</AlertBanner>}

      {showForm && (
        <OpenChamadoForm
          onSubmit={handleOpenChamado}
          onCancel={closeForm}
          loading={submitLoading}
          error={error}
        />
      )}

      <SectionCard title="Histórico de chamados" noPadding bodyClassName="p-0">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Assunto</th>
              <th>Ferramenta</th>
              <th>Status</th>
              <th>Abertura</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {chamados.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-10">
                  Você ainda não abriu nenhum chamado.
                </td>
              </tr>
            ) : (
              chamados.map((chamado) => (
                <Fragment key={chamado.id}>
                  <tr className="hover:bg-gray-50">
                    <td>
                      <p className="font-medium text-gray-900">{chamado.assunto}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{chamado.descricao}</p>
                    </td>
                    <td className="text-gray-600">{getFerramentaLabel(chamado.ferramentaRemota)}</td>
                    <td className="whitespace-nowrap">
                      <ChamadoStatusBadge status={chamado.status} />
                    </td>
                    <td className="text-gray-600 whitespace-nowrap tabular-nums">
                      {formatDateTime(chamado.createdAt)}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === chamado.id ? null : chamado.id)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        {expandedId === chamado.id ? 'Fechar' : 'Ver conversa'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === chamado.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3 text-sm">
                            <p>
                              <span className="form-label block mb-1">Telefone</span>
                              <span className="text-gray-700">{chamado.telefoneContato}</span>
                            </p>
                            <p>
                              <span className="form-label block mb-1">Código remoto</span>
                              <span className="text-gray-700 font-mono">{chamado.codigoAcessoRemoto}</span>
                            </p>
                            <p>
                              <span className="form-label block mb-1">E-mail</span>
                              <span className="text-gray-700">{chamado.email}</span>
                            </p>
                          </div>
                          <ChamadoMessagesPanel
                            chamado={chamado}
                            mode="user"
                            getToken={getToken}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </SectionCard>
    </PageContainer>
  );
}
