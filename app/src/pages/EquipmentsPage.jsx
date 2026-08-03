import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import CsvImportPanel from '../components/CsvImportPanel';
import AlertBanner from '../components/ui/AlertBanner';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { listUsers } from '../services/adminService';
import {
  createEquipment,
  deleteEquipment,
  importEquipmentsCsv,
  linkEquipmentToUser,
  listEquipmentCompanies,
  listEquipments,
  unlinkEquipmentFromUser,
  updateEquipment,
} from '../services/equipmentService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatEmpresaLabel } from '../utils/equipment';
import { clampPageAfterChange, paginateItems } from '../utils/pagination';

const PAGE_SIZE = 4;

const EQUIPMENT_CSV_TEMPLATE = `nome,empresa,patrimonio,descricao
Notebook Dell,malibru mtz,12345,Core i5 16GB
Monitor LG,dicoco itapipoca,12346,Tela 24 polegadas
Impressora HP,malibru filial,,Multifuncional sala 2
`;

const EMPTY_FORM = {
  nome: '',
  empresa: '',
  patrimonio: '',
  descricao: '',
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

export default function EquipmentsPage() {
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [linking, setLinking] = useState(false);
  const [unlinkingKey, setUnlinkingKey] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [linkForm, setLinkForm] = useState({ usuarioId: '', equipamentoId: '' });
  const [tablePage, setTablePage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  async function loadData() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const [equipmentsData, usersData, companiesData] = await Promise.all([
        listEquipments(token),
        listUsers(token),
        listEquipmentCompanies(token),
      ]);
      setEquipments(Array.isArray(equipmentsData) ? equipmentsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar os equipamentos.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );

  const availableEquipments = useMemo(
    () => equipments.filter((e) => !e.usuarioId),
    [equipments],
  );

  const tablePagination = useMemo(
    () => paginateItems(equipments, tablePage, PAGE_SIZE),
    [equipments, tablePage],
  );

  useEffect(() => {
    setTablePage((current) => clampPageAfterChange(equipments.length, current, PAGE_SIZE));
  }, [equipments.length]);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function openEditForm(equipment) {
    setEditingId(equipment.id);
    setForm({
      nome: equipment.nome ?? '',
      empresa: equipment.empresa ?? '',
      patrimonio: equipment.patrimonio ?? '',
      descricao: equipment.descricao ?? '',
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
    const empresa = form.empresa.trim();
    const patrimonio = form.patrimonio.trim();
    const descricao = form.descricao.trim();

    if (!nome) {
      setError('Nome é obrigatório.');
      return;
    }

    if (!empresa) {
      setError('Empresa é obrigatória.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      nome,
      empresa,
      patrimonio: patrimonio || undefined,
      descricao: descricao || undefined,
    };

    try {
      if (editingId) {
        const updated = await updateEquipment(token, editingId, payload);
        setEquipments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccess('Equipamento atualizado com sucesso!');
      } else {
        const created = await createEquipment(token, payload);
        setEquipments((prev) => [...prev, created]);
        setSuccess('Equipamento cadastrado com sucesso!');
      }
      closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível salvar o equipamento.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(equipment) {
    const confirmed = window.confirm(
      `Excluir o equipamento "${equipment.nome}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(equipment.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteEquipment(token, equipment.id);
      setEquipments((prev) => prev.filter((item) => item.id !== equipment.id));
      setSuccess('Equipamento excluído com sucesso!');
      if (editingId === equipment.id) closeForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir o equipamento.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const usuarioId = Number(linkForm.usuarioId);
    const equipamentoId = Number(linkForm.equipamentoId);

    if (!usuarioId || !equipamentoId) {
      setError('Selecione usuário e equipamento para vincular.');
      return;
    }

    setLinking(true);
    setError(null);
    setSuccess(null);

    try {
      await linkEquipmentToUser(token, usuarioId, equipamentoId);
      setEquipments((prev) =>
        prev.map((item) =>
          item.id === equipamentoId ? { ...item, usuarioId } : item,
        ),
      );
      setLinkForm({ usuarioId: '', equipamentoId: '' });
      setSuccess('Equipamento vinculado ao usuário com sucesso!');
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível vincular o equipamento.'));
    } finally {
      setLinking(false);
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
      const result = await importEquipmentsCsv(token, file);
      setImportResult(result);
      setSuccess(
        `${result.importados ?? 0} equipamento(s) importado(s) com sucesso.` +
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

  async function handleUnlink(equipment) {
    const token = getToken();
    if (!token || !equipment.usuarioId) return;

    setUnlinkingKey(`${equipment.usuarioId}-${equipment.id}`);
    setError(null);
    setSuccess(null);

    try {
      await unlinkEquipmentFromUser(token, equipment.usuarioId, equipment.id);
      setEquipments((prev) =>
        prev.map((item) =>
          item.id === equipment.id ? { ...item, usuarioId: null } : item,
        ),
      );
      setSuccess('Equipamento desvinculado com sucesso!');
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível desvincular o equipamento.'));
    } finally {
      setUnlinkingKey(null);
    }
  }

  if (pageLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500 text-center py-16">Carregando equipamentos...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={['Malibru Portal', 'TI', 'Equipamentos']}
        title="Equipamentos"
        subtitle="Cadastre equipamentos corporativos e vincule a usuários."
        actions={
          <>
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
            <button type="button" onClick={openCreateForm} className="btn-primary">
              Novo equipamento
            </button>
          </>
        }
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      {showImport && (
        <CsvImportPanel
          title="Importar equipamentos"
          description="Envie um CSV para cadastrar vários equipamentos de uma vez. Linhas válidas são gravadas; erros são listados sem interromper o restante."
          templateFilename="modelo-equipamentos.csv"
          templateContent={EQUIPMENT_CSV_TEMPLATE}
          importing={importing}
          result={importResult}
          onImport={handleImportCsv}
        />
      )}

      <SectionCard title="Vincular equipamento">
      <form onSubmit={handleLink} className="space-y-4 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Usuário
            </span>
            <select
              value={linkForm.usuarioId}
              onChange={(e) => setLinkForm((prev) => ({ ...prev, usuarioId: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
            >
              <option value="">Selecione...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Equipamento disponível
            </span>
            <select
              value={linkForm.equipamentoId}
              onChange={(e) => setLinkForm((prev) => ({ ...prev, equipamentoId: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
            >
              <option value="">Selecione...</option>
              {availableEquipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.nome}
                  {equipment.empresa ? ` · ${formatEmpresaLabel(equipment.empresa)}` : ''}
                  {equipment.patrimonio ? ` · ${equipment.patrimonio}` : ''}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={linking || availableEquipments.length === 0}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {linking && <Loader2 />}
            Vincular
          </button>
        </div>
      </form>
      </SectionCard>

      {showForm && (
        <SectionCard title={editingId ? 'Editar equipamento' : 'Cadastrar equipamento'}>
        <form onSubmit={handleSubmit} className="space-y-4 -mt-2">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Nome
              </span>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Empresa
              </span>
              <select
                required
                value={form.empresa}
                onChange={(e) => updateField('empresa', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
              >
                <option value="">Selecione...</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {formatEmpresaLabel(company)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Patrimônio
              </span>
              <input
                type="text"
                value={form.patrimonio}
                onChange={(e) => updateField('patrimonio', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Descrição
              </span>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => updateField('descricao', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
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
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 />}
              {editingId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
        </SectionCard>
      )}

      <SectionCard title="Equipamentos cadastrados" noPadding bodyClassName="p-0">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Empresa</th>
              <th>Patrimônio</th>
              <th>Usuário</th>
              <th>Descrição</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Nenhum equipamento cadastrado.
                </td>
              </tr>
            ) : (
              tablePagination.items.map((equipment) => {
                const linkedUser = equipment.usuarioId ? usersById[equipment.usuarioId] : null;
                const unlinkKey = `${equipment.usuarioId}-${equipment.id}`;

                return (
                  <tr key={equipment.id}>
                    <td className="font-medium text-gray-900">{equipment.nome}</td>
                    <td className="text-gray-600">
                      {equipment.empresa ? formatEmpresaLabel(equipment.empresa) : '—'}
                    </td>
                    <td className="text-gray-600">{equipment.patrimonio || '—'}</td>
                    <td className="text-gray-600">
                      {linkedUser ? (
                        <span>{linkedUser.nome}</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{equipment.descricao || '—'}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {equipment.usuarioId ? (
                        <button
                          type="button"
                          disabled={unlinkingKey === unlinkKey}
                          onClick={() => handleUnlink(equipment)}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {unlinkingKey === unlinkKey ? <Loader2 /> : null}
                          Desvincular
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEditForm(equipment)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === equipment.id}
                        onClick={() => handleDelete(equipment)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {deletingId === equipment.id ? <Loader2 /> : null}
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="px-6 pb-4">
        <TablePagination
          page={tablePagination.page}
          totalPages={tablePagination.totalPages}
          total={tablePagination.total}
          pageSize={PAGE_SIZE}
          onPrev={() => setTablePage((p) => Math.max(1, p - 1))}
          onNext={() => setTablePage((p) => Math.min(tablePagination.totalPages, p + 1))}
        />
        </div>
      </SectionCard>
    </PageContainer>
  );
}
