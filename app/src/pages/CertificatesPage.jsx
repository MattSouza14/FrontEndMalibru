import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import AlertBanner from '../components/ui/AlertBanner';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import {
  createCertificate,
  deleteCertificate,
  listCertificates,
  updateCertificate,
} from '../services/certificateService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatDate } from '../utils/expiry';
import { clampPageAfterChange, paginateItems } from '../utils/pagination';

const PAGE_SIZE = 5;

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
  const [tablePage, setTablePage] = useState(1);

  const tablePagination = useMemo(
    () => paginateItems(certificates, tablePage, PAGE_SIZE),
    [certificates, tablePage],
  );

  useEffect(() => {
    setTablePage((current) => clampPageAfterChange(certificates.length, current, PAGE_SIZE));
  }, [certificates.length]);

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
      <PageContainer>
        <p className="text-sm text-gray-500 text-center py-16">Carregando certificados...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={['Malibru Portal', 'TI', 'Certificados']}
        title="Certificados"
        subtitle="Gerencie certificados digitais e acompanhe datas de vencimento."
        actions={
          <button type="button" onClick={openCreateForm} className="btn-primary">
            Novo certificado
          </button>
        }
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      {showForm && (
        <SectionCard title={editingId ? 'Editar certificado' : 'Cadastrar certificado'}>
          <form onSubmit={handleSubmit} className="space-y-4 -mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="form-label">Nome</span>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => updateField('nome', e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="form-label">Empresa</span>
                <input
                  type="text"
                  value={form.empresa}
                  onChange={(e) => updateField('empresa', e.target.value)}
                  placeholder="Opcional"
                  className="form-input"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="form-label">Vencimento</span>
                <input
                  type="date"
                  required
                  value={form.dataVencimento}
                  onChange={(e) => updateField('dataVencimento', e.target.value)}
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

      <SectionCard title="Certificados cadastrados" noPadding bodyClassName="p-0">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Empresa</th>
              <th>Vencimento</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-10">
                  Nenhum certificado cadastrado.
                </td>
              </tr>
            ) : (
              tablePagination.items.map((certificate) => (
                <tr key={certificate.id}>
                  <td className="font-medium text-gray-900">{certificate.nome}</td>
                  <td className="text-gray-600">{certificate.empresa || '—'}</td>
                  <td className="text-gray-600 tabular-nums">
                    {formatDate(certificate.dataVencimento)}
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(certificate)}
                      className="btn-secondary"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === certificate.id}
                      onClick={() => handleDelete(certificate)}
                      className="btn-danger"
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
        <TablePagination
          page={tablePagination.page}
          totalPages={tablePagination.totalPages}
          total={tablePagination.total}
          pageSize={PAGE_SIZE}
          onPrev={() => setTablePage((p) => Math.max(1, p - 1))}
          onNext={() => setTablePage((p) => Math.min(tablePagination.totalPages, p + 1))}
        />
      </SectionCard>
    </PageContainer>
  );
}
