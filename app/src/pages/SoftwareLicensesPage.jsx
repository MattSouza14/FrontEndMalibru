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
      <PageContainer>
        <p className="text-sm text-ws-muted text-center py-16">Carregando licenças de software...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={['Malibru Portal', 'TI', 'Licenças de Software']}
        title="Licenças de Software"
        subtitle="Cadastre licenças de software vinculadas a usuários (Adobe, AutoCAD, etc.)."
        actions={
          <button type="button" onClick={openCreateForm} className="btn-primary">
            Nova licença
          </button>
        }
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      {showForm && (
        <SectionCard title={editingId ? 'Editar licença' : 'Cadastrar licença'}>
          <form onSubmit={handleSubmit} className="space-y-4 -mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="block space-y-1.5 md:col-span-2">
                <span className="form-label">Nome do software</span>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => updateField('nome', e.target.value)}
                  placeholder="Ex.: Adobe Creative Cloud"
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

              <label className="block space-y-1.5">
                <span className="form-label">Quantidade</span>
                <input
                  type="number"
                  min={1}
                  value={form.qtdLicencas}
                  onChange={(e) => updateField('qtdLicencas', e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="block space-y-1.5 md:col-span-2">
                <span className="form-label">Usuário</span>
                <select
                  required
                  value={form.usuarioId}
                  onChange={(e) => updateField('usuarioId', e.target.value)}
                  className="form-input"
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

      <SectionCard title="Licenças cadastradas" noPadding bodyClassName="p-0">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Software</th>
              <th>Usuário</th>
              <th>Vencimento</th>
              <th>Situação</th>
              <th>Qtd.</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-ws-muted py-10">
                  Nenhuma licença de software cadastrada.
                </td>
              </tr>
            ) : (
              tablePagination.items.map((license) => {
                const days = daysUntil(license.dataVencimento);

                return (
                  <tr key={license.id}>
                    <td className="font-medium text-ws-bright">{license.nome}</td>
                    <td>
                      <p className="text-ws-bright">{license.usuarioNome}</p>
                      <p className="text-xs text-ws-muted">{license.usuarioEmail}</p>
                    </td>
                    <td className="text-ws-secondary tabular-nums">
                      {formatDate(license.dataVencimento)}
                    </td>
                    <td>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${expiryBadgeClass(days)}`}
                      >
                        {expiryLabel(days)}
                      </span>
                    </td>
                    <td className="text-ws-secondary">{license.qtdLicencas ?? 1}</td>
                    <td className="text-right space-x-2 whitespace-nowrap">
                      <button type="button" onClick={() => openEditForm(license)} className="btn-secondary">
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === license.id}
                        onClick={() => handleDelete(license)}
                        className="btn-danger"
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
      </SectionCard>
    </PageContainer>
  );
}
