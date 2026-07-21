import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChamadoStatusBadge from '../components/ChamadoStatusBadge';
import OpenChamadoForm from '../components/OpenChamadoForm';
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
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-gray-500">Carregando chamados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
            Suporte
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Meus Chamados</h1>
          <p className="text-sm text-gray-600 mt-2">
            Abra um chamado de suporte técnico e acompanhe o andamento.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openForm}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Novo chamado
          </button>
        )}
      </header>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {showForm && (
        <OpenChamadoForm
          onSubmit={handleOpenChamado}
          onCancel={closeForm}
          loading={submitLoading}
          error={error}
        />
      )}

      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-6 py-3 font-bold">Assunto</th>
              <th className="px-6 py-3 font-bold">Ferramenta</th>
              <th className="px-6 py-3 font-bold">Status</th>
              <th className="px-6 py-3 font-bold">Abertura</th>
            </tr>
          </thead>
          <tbody>
            {chamados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  Você ainda não abriu nenhum chamado.
                </td>
              </tr>
            ) : (
              chamados.map((chamado) => (
                <tr key={chamado.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{chamado.assunto}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{chamado.descricao}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {getFerramentaLabel(chamado.ferramentaRemota)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ChamadoStatusBadge status={chamado.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {formatDateTime(chamado.createdAt)}
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
