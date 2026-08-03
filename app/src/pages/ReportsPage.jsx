import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExpiryReportPanel from '../components/reports/ExpiryReportPanel';
import ReportBarList from '../components/reports/ReportBarList';
import AlertBanner from '../components/ui/AlertBanner';
import KpiCard from '../components/ui/KpiCard';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { listUsers } from '../services/adminService';
import { listAdminChamados, listMyChamados } from '../services/chamadoService';
import { listCertificates } from '../services/certificateService';
import { listEquipments } from '../services/equipmentService';
import { listOfficeLicenses } from '../services/officeLicenseService';
import { listSignedTerms } from '../services/signedTermService';
import { listSoftwareLicenses } from '../services/softwareLicenseService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatDateTime } from '../utils/chamadoStatus';
import { formatEmpresaLabel } from '../utils/equipment';
import {
  buildCertificateStats,
  buildChamadoStats,
  buildEquipmentStats,
  buildOfficeLicenseStats,
  buildSignedTermStats,
  buildSoftwareLicenseStats,
  buildUserStats,
  formatBytes,
} from '../utils/reportStats';
import {
  canAccessChamadosAdmin,
  canAccessTiModules,
  isAdmin,
} from '../utils/roles';

function IconChart() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { user, getToken, logout } = useAuth();
  const showAdmin = isAdmin(user);
  const showTi = canAccessTiModules(user);
  const showChamadosAdmin = canAccessChamadosAdmin(user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [chamados, setChamados] = useState([]);
  const [officeLicenses, setOfficeLicenses] = useState([]);
  const [softwareLicenses, setSoftwareLicenses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [termos, setTermos] = useState([]);
  const [selectedEquipmentEmpresa, setSelectedEquipmentEmpresa] = useState(null);

  useEffect(() => {
    async function loadReports() {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const tasks = [];

        if (showAdmin) {
          tasks.push(listUsers(token).then((d) => setUsers(Array.isArray(d) ? d : [])));
        }

        if (showChamadosAdmin) {
          tasks.push(
            listAdminChamados(token).then((d) => setChamados(Array.isArray(d) ? d : [])),
          );
        } else {
          tasks.push(
            listMyChamados(token).then((d) => setChamados(Array.isArray(d) ? d : [])),
          );
        }

        if (showTi) {
          tasks.push(
            Promise.all([
              listOfficeLicenses(token),
              listSoftwareLicenses(token),
              listCertificates(token),
              listEquipments(token),
              listSignedTerms(token),
            ]).then(([office, software, certs, equips, signed]) => {
              setOfficeLicenses(Array.isArray(office) ? office : []);
              setSoftwareLicenses(Array.isArray(software) ? software : []);
              setCertificates(Array.isArray(certs) ? certs : []);
              setEquipments(Array.isArray(equips) ? equips : []);
              setTermos(Array.isArray(signed) ? signed : []);
            }),
          );
        }

        await Promise.all(tasks);
      } catch (err) {
        if (isUnauthorized(err)) {
          logout();
          navigate('/Login', { replace: true });
          return;
        }
        setError(getApiErrorMessage(err, 'Não foi possível carregar os relatórios.'));
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [getToken, logout, navigate, showAdmin, showTi, showChamadosAdmin]);

  const userStats = useMemo(() => buildUserStats(users), [users]);
  const chamadoStats = useMemo(() => buildChamadoStats(chamados), [chamados]);
  const officeStats = useMemo(() => buildOfficeLicenseStats(officeLicenses), [officeLicenses]);
  const softwareStats = useMemo(
    () => buildSoftwareLicenseStats(softwareLicenses),
    [softwareLicenses],
  );
  const certificateStats = useMemo(
    () => buildCertificateStats(certificates),
    [certificates],
  );
  const equipmentStats = useMemo(() => buildEquipmentStats(equipments), [equipments]);
  const termStats = useMemo(() => buildSignedTermStats(termos), [termos]);

  const filteredEquipments = useMemo(() => {
    if (selectedEquipmentEmpresa == null) return [];

    if (selectedEquipmentEmpresa === 'Sem empresa') {
      return equipments.filter((equipment) => !equipment.empresa);
    }

    return equipments.filter((equipment) => equipment.empresa === selectedEquipmentEmpresa);
  }, [equipments, selectedEquipmentEmpresa]);

  function handleEquipmentEmpresaClick(item) {
    const empresaKey = item.key ?? item.label;
    setSelectedEquipmentEmpresa((current) => (current === empresaKey ? null : empresaKey));
  }

  const generatedAt = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (loading) {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500 text-center py-16">Gerando relatórios...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        breadcrumbs={['Malibru Portal', 'Relatórios']}
        title="Relatórios"
        subtitle={`Visão consolidada com dados já cadastrados no portal · Atualizado em ${generatedAt}`}
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<IconChart />}
          label="Chamados"
          value={chamadoStats.total}
          subtext={`${chamadoStats.open} em aberto`}
          accent={chamadoStats.open > 0 ? 'amber' : 'default'}
        />
        {showTi && (
          <>
            <KpiCard
              label="Licenças Office"
              value={officeStats.total}
              subtext={`${officeStats.availableSlots} vagas livres`}
              accent="green"
            />
            <KpiCard
              label="Equipamentos"
              value={equipmentStats.total}
              subtext={`${equipmentStats.linkRate}% vinculados`}
              accent="blue"
            />
            <KpiCard
              label="Certificados"
              value={certificateStats.total}
              subtext={`${certificateStats.expiry.find((e) => e.key === 'overdue')?.value ?? 0} vencidos`}
              accent={
                (certificateStats.expiry.find((e) => e.key === 'overdue')?.value ?? 0) > 0
                  ? 'red'
                  : 'default'
              }
            />
          </>
        )}
        {showAdmin && !showTi && (
          <>
            <KpiCard label="Usuários" value={userStats.total} subtext={`${userStats.active} ativos`} />
            <KpiCard
              label="Pendentes"
              value={userStats.pending}
              accent="amber"
              subtext="Aguardando ativação"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title={showChamadosAdmin ? 'Chamados de suporte' : 'Meus chamados'}
          subtitle="Distribuição por status e ferramenta remota"
          icon={<IconChart />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-2">
            <div>
              <p className="form-label mb-3">Por status</p>
              <ReportBarList
                items={chamadoStats.byStatus.map((s) => ({ ...s, color: 'bg-blue-500' }))}
                emptyMessage="Nenhum chamado registrado."
              />
            </div>
            <div>
              <p className="form-label mb-3">Por ferramenta remota</p>
              <ReportBarList
                items={chamadoStats.byTool.map((t) => ({ ...t, color: 'bg-primary' }))}
                emptyMessage="Sem ferramentas registradas."
              />
            </div>
          </div>
          {chamadoStats.recent.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="form-label mb-2">Últimos chamados</p>
              <ul className="space-y-2 text-sm">
                {chamadoStats.recent.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span className="text-gray-800 truncate">{c.assunto}</span>
                    <span className="text-gray-500 text-xs tabular-nums shrink-0">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        {showAdmin && (
          <SectionCard title="Usuários" subtitle="Contas, perfis e setores">
            <div className="grid grid-cols-3 gap-3 mb-5 -mt-2">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{userStats.total}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Total</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{userStats.active}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Ativos</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{userStats.pending}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Pendentes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="form-label mb-3">Por perfil (role)</p>
                <ReportBarList items={userStats.roles.map((r) => ({ ...r, color: 'bg-indigo-500' }))} />
              </div>
              <div>
                <p className="form-label mb-3">Por setor</p>
                <ReportBarList items={userStats.setores.map((s) => ({ ...s, color: 'bg-slate-500' }))} />
              </div>
            </div>
          </SectionCard>
        )}

        {showTi && (
          <>
            <SectionCard
              title="Licenças Office"
              subtitle={`${officeStats.usedSlots} de ${officeStats.totalSlots} vagas utilizadas · ${officeStats.full} licença(s) lotada(s)`}
            >
              <ExpiryReportPanel
                segments={officeStats.expiry}
                topItems={officeStats.topExpiring}
                dateField="vencimento"
                renderLabel={(item) => item.email}
              />
            </SectionCard>

            <SectionCard
              title="Licenças de software"
              subtitle={`${softwareStats.total} licenças · ${softwareStats.totalSeats} assentos`}
            >
              <div className="space-y-5 -mt-2">
                <div>
                  <p className="form-label mb-3">Por software</p>
                  <ReportBarList
                    items={softwareStats.bySoftware.map((s) => ({ ...s, color: 'bg-violet-500' }))}
                  />
                </div>
                <ExpiryReportPanel
                  segments={softwareStats.expiry}
                  topItems={softwareStats.topExpiring}
                  dateField="dataVencimento"
                  renderLabel={(item) => item.nome}
                />
              </div>
            </SectionCard>

            <SectionCard title="Certificados digitais" subtitle={`${certificateStats.total} cadastrados`}>
              <div className="space-y-5 -mt-2">
                <ExpiryReportPanel
                  segments={certificateStats.expiry}
                  topItems={certificateStats.topExpiring}
                  dateField="dataVencimento"
                  renderLabel={(item) => item.nome}
                />
                {certificateStats.byEmpresa.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="form-label mb-3">Por empresa</p>
                    <ReportBarList
                      items={certificateStats.byEmpresa.map((e) => ({ ...e, color: 'bg-teal-500' }))}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Equipamentos"
              subtitle={`${equipmentStats.linked} vinculados · ${equipmentStats.available} disponíveis`}
            >
              <div className="space-y-4 -mt-2">
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${equipmentStats.linkRate}%` }}
                    title="Vinculados"
                  />
                  <div
                    className="bg-gray-300 h-full flex-1"
                    title="Disponíveis"
                  />
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <span className="size-2 rounded-full bg-primary" />
                    Vinculados: {equipmentStats.linked}
                  </span>
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <span className="size-2 rounded-full bg-gray-300" />
                    Disponíveis: {equipmentStats.available}
                  </span>
                </div>
                {equipmentStats.byEmpresa.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="form-label mb-1">Por empresa</p>
                    <p className="text-xs text-gray-500 mb-3">Clique em uma empresa para ver os equipamentos</p>
                    <ReportBarList
                      items={equipmentStats.byEmpresa.map((e) => ({ ...e, color: 'bg-primary' }))}
                      onItemClick={handleEquipmentEmpresaClick}
                      selectedKey={selectedEquipmentEmpresa}
                    />
                  </div>
                )}
                {selectedEquipmentEmpresa != null && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="form-label">
                        Equipamentos —{' '}
                        {selectedEquipmentEmpresa === 'Sem empresa'
                          ? 'Sem empresa'
                          : formatEmpresaLabel(selectedEquipmentEmpresa)}
                        <span className="text-gray-400 font-normal ml-1">
                          ({filteredEquipments.length})
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedEquipmentEmpresa(null)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                      >
                        Fechar
                      </button>
                    </div>
                    {filteredEquipments.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum equipamento encontrado.</p>
                    ) : (
                      <ul className="space-y-2 text-sm max-h-72 overflow-y-auto pr-1">
                        {filteredEquipments.map((equipment) => (
                          <li
                            key={equipment.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 bg-gray-50/50"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{equipment.nome}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Patrimônio: {equipment.patrimonio || '—'}
                                {equipment.descricao ? ` · ${equipment.descricao}` : ''}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${
                                equipment.usuarioId ? 'text-primary' : 'text-gray-400'
                              }`}
                            >
                              {equipment.usuarioId ? 'Vinculado' : 'Disponível'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Termos assinados"
              subtitle={`${termStats.total} documentos · ${formatBytes(termStats.totalBytes)} armazenados`}
            >
              <div className="grid grid-cols-2 gap-4 -mt-2">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                  <p className="text-2xl font-bold text-slate-900">{termStats.withUser}</p>
                  <p className="text-xs text-gray-500 mt-1">Com usuário vinculado</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                  <p className="text-2xl font-bold text-slate-900">{termStats.withoutUser}</p>
                  <p className="text-xs text-gray-500 mt-1">Sem vínculo de usuário</p>
                </div>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {!showTi && !showAdmin && (
        <SectionCard title="Relatórios operacionais">
          <p className="text-sm text-gray-600 -mt-2">
            Painéis de licenças, certificados, equipamentos e usuários ficam disponíveis para
            perfis <strong>TI</strong> e <strong>ADMIN</strong>. Você já vê o resumo dos seus
            chamados acima.
          </p>
        </SectionCard>
      )}
    </PageContainer>
  );
}
