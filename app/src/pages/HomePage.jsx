import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExpiringPanel, { DateCell, ExpiryStatusCell } from '../components/ExpiringPanel';
import TablePagination from '../components/TablePagination';
import KpiCard from '../components/ui/KpiCard';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { ExpiryProgressBar } from '../components/ui/ProgressBar';
import { listCertificates } from '../services/certificateService';
import { listAdminChamados } from '../services/chamadoService';
import { listOfficeLicenses } from '../services/officeLicenseService';
import { listSoftwareLicenses, listSoftwareLicensesByUser } from '../services/softwareLicenseService';
import { getMyEquipments, getMyOfficeLicense, getMySoftwareLicenses } from '../services/userResourcesService';
import { formatEmpresaLabel } from '../utils/equipment';
import { daysUntil, expiryBadgeClass, expiryLabel, formatDate, getTopExpiring } from '../utils/expiry';
import { clampPageAfterChange, paginateItems } from '../utils/pagination';
import {
  canAccessChamadosAdmin,
  canAccessTiModules,
  formatRoles,
  hasAnyRole,
} from '../utils/roles';

const EQUIPMENTS_PAGE_SIZE = 4;

function IconTicket() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function IconLicense() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function QuickLinkCard({ title, description, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-ws-panel rounded border border-ws-border shadow-card p-5 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ws-bright group-hover:text-primary transition-colors">
            {title}
          </p>
          <p className="text-sm text-ws-muted mt-1.5 leading-relaxed">{description}</p>
        </div>
        {badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-ws-elevated text-ws-secondary shrink-0">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Acessar →
      </p>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const showTiAlerts = canAccessTiModules(user);
  const showChamadosAdmin = canAccessChamadosAdmin(user);
  const [loading, setLoading] = useState(false);
  const [expiringLicenses, setExpiringLicenses] = useState([]);
  const [expiringSoftwareLicenses, setExpiringSoftwareLicenses] = useState([]);
  const [expiringCertificates, setExpiringCertificates] = useState([]);
  const [openChamadosCount, setOpenChamadosCount] = useState(0);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [myOfficeLicense, setMyOfficeLicense] = useState(null);
  const [mySoftwareLicenses, setMySoftwareLicenses] = useState([]);
  const [myEquipments, setMyEquipments] = useState([]);
  const [equipmentsPage, setEquipmentsPage] = useState(1);
  const [expiringTab, setExpiringTab] = useState('office');

  useEffect(() => {
    async function loadMyResources() {
      const token = getToken();
      if (!token) return;

      setResourcesLoading(true);

      const [officeResult, softwareResult, equipmentsResult] = await Promise.allSettled([
        getMyOfficeLicense(token),
        getMySoftwareLicenses(token),
        getMyEquipments(token),
      ]);

      if (officeResult.status === 'fulfilled') {
        setMyOfficeLicense(officeResult.value);
      } else {
        setMyOfficeLicense(null);
      }

      let softwareLicenses = [];
      if (softwareResult.status === 'fulfilled') {
        softwareLicenses = Array.isArray(softwareResult.value) ? softwareResult.value : [];
      } else if (hasAnyRole(user, ['ADMIN', 'TI']) && user?.id) {
        try {
          const adminData = await listSoftwareLicensesByUser(token, user.id);
          softwareLicenses = Array.isArray(adminData) ? adminData : [];
        } catch {
          softwareLicenses = [];
        }
      }
      setMySoftwareLicenses(softwareLicenses);

      if (equipmentsResult.status === 'fulfilled') {
        const data = equipmentsResult.value;
        setMyEquipments(Array.isArray(data) ? data : []);
      } else {
        setMyEquipments([]);
      }

      setResourcesLoading(false);
    }

    loadMyResources();
  }, [getToken, user]);

  useEffect(() => {
    if (!showTiAlerts) return;

    async function loadExpiringItems() {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      try {
        const [licensesData, softwareLicensesData, certificatesData] = await Promise.all([
          listOfficeLicenses(token),
          listSoftwareLicenses(token),
          listCertificates(token),
        ]);

        const licenses = Array.isArray(licensesData) ? licensesData : [];
        const softwareLicenses = Array.isArray(softwareLicensesData) ? softwareLicensesData : [];
        const certificates = Array.isArray(certificatesData) ? certificatesData : [];

        setExpiringLicenses(getTopExpiring(licenses, 'vencimento'));
        setExpiringSoftwareLicenses(getTopExpiring(softwareLicenses, 'dataVencimento'));
        setExpiringCertificates(getTopExpiring(certificates, 'dataVencimento'));
      } catch {
        setExpiringLicenses([]);
        setExpiringSoftwareLicenses([]);
        setExpiringCertificates([]);
      } finally {
        setLoading(false);
      }
    }

    loadExpiringItems();
  }, [showTiAlerts, getToken]);

  useEffect(() => {
    if (!showChamadosAdmin) return;

    async function loadOpenChamados() {
      const token = getToken();
      if (!token) return;

      try {
        const chamadosData = await listAdminChamados(token, 'ABERTO');
        const chamados = Array.isArray(chamadosData) ? chamadosData : [];
        setOpenChamadosCount(chamados.length);
      } catch {
        setOpenChamadosCount(0);
      }
    }

    loadOpenChamados();
  }, [showChamadosAdmin, getToken]);

  const urgentLicenses = useMemo(
    () => expiringLicenses.filter((l) => daysUntil(l.vencimento) <= 7).length,
    [expiringLicenses],
  );

  const urgentSoftwareLicenses = useMemo(
    () => expiringSoftwareLicenses.filter((l) => daysUntil(l.dataVencimento) <= 7).length,
    [expiringSoftwareLicenses],
  );

  const urgentCertificates = useMemo(
    () => expiringCertificates.filter((c) => daysUntil(c.dataVencimento) <= 7).length,
    [expiringCertificates],
  );

  const totalUrgentExpiring = urgentLicenses + urgentSoftwareLicenses + urgentCertificates;
  const myLicensesCount = (myOfficeLicense ? 1 : 0) + mySoftwareLicenses.length;

  const expiringTabConfig = useMemo(
    () => ({
      office: {
        title: 'Licenças Office',
        loading,
        emptyMessage: 'Nenhuma licença cadastrada.',
        items: expiringLicenses,
        dateField: 'vencimento',
        linkTo: '/admin/office-licenses',
        urgentCount: urgentLicenses,
        urgentLabel: `${urgentLicenses} licença(s) Office vence(m) em até 7 dias`,
        columns: [
          {
            key: 'email',
            label: 'E-mail',
            render: (item) => (
              <span className="font-medium text-ws-bright">{item.email}</span>
            ),
          },
          {
            key: 'vencimento',
            label: 'Vencimento',
            render: (item) => <DateCell value={item.vencimento} />,
          },
          {
            key: 'status',
            label: 'Situação',
            render: (_item, days) => <ExpiryStatusCell days={days} />,
          },
          {
            key: 'vagas',
            label: 'Vagas',
            render: (item) => (
              <span className="text-ws-secondary">{item.vagasRestantes ?? 0} / 5</span>
            ),
          },
        ],
      },
      software: {
        title: 'Licenças de Software',
        loading,
        emptyMessage: 'Nenhuma licença de software cadastrada.',
        items: expiringSoftwareLicenses,
        dateField: 'dataVencimento',
        linkTo: '/admin/software-licenses',
        urgentCount: urgentSoftwareLicenses,
        urgentLabel: `${urgentSoftwareLicenses} licença(s) de software vence(m) em até 7 dias`,
        columns: [
          {
            key: 'nome',
            label: 'Software',
            render: (item) => (
              <span className="font-medium text-ws-bright">{item.nome}</span>
            ),
          },
          {
            key: 'usuario',
            label: 'Usuário',
            render: (item) => (
              <span className="text-ws-secondary">{item.usuarioNome || '—'}</span>
            ),
          },
          {
            key: 'dataVencimento',
            label: 'Vencimento',
            render: (item) => <DateCell value={item.dataVencimento} />,
          },
          {
            key: 'status',
            label: 'Situação',
            render: (_item, days) => <ExpiryStatusCell days={days} />,
          },
        ],
      },
      certificates: {
        title: 'Certificados',
        loading,
        emptyMessage: 'Nenhum certificado cadastrado.',
        items: expiringCertificates,
        dateField: 'dataVencimento',
        linkTo: '/admin/certificates',
        urgentCount: urgentCertificates,
        urgentLabel: `${urgentCertificates} certificado(s) vence(m) em até 7 dias`,
        columns: [
          {
            key: 'nome',
            label: 'Nome',
            render: (item) => (
              <span className="font-medium text-ws-bright">{item.nome}</span>
            ),
          },
          {
            key: 'empresa',
            label: 'Empresa',
            render: (item) => (
              <span className="text-ws-secondary">{item.empresa || '—'}</span>
            ),
          },
          {
            key: 'dataVencimento',
            label: 'Vencimento',
            render: (item) => <DateCell value={item.dataVencimento} />,
          },
          {
            key: 'status',
            label: 'Situação',
            render: (_item, days) => <ExpiryStatusCell days={days} />,
          },
        ],
      },
    }),
    [
      loading,
      expiringLicenses,
      expiringSoftwareLicenses,
      expiringCertificates,
      urgentLicenses,
      urgentSoftwareLicenses,
      urgentCertificates,
    ],
  );

  const expiringTabs = [
    { id: 'office', label: 'Office', urgentCount: urgentLicenses },
    { id: 'software', label: 'Software', urgentCount: urgentSoftwareLicenses },
    { id: 'certificates', label: 'Certificados', urgentCount: urgentCertificates },
  ];

  const activeExpiringPanel = expiringTabConfig[expiringTab];

  const equipmentsPagination = useMemo(
    () => paginateItems(myEquipments, equipmentsPage, EQUIPMENTS_PAGE_SIZE),
    [myEquipments, equipmentsPage],
  );

  useEffect(() => {
    setEquipmentsPage((current) =>
      clampPageAfterChange(myEquipments.length, current, EQUIPMENTS_PAGE_SIZE),
    );
  }, [myEquipments.length]);

  const kpiCards = useMemo(() => {
    const cards = [];

    if (showChamadosAdmin) {
      cards.push({
        key: 'chamados',
        icon: <IconTicket />,
        label: 'Chamados abertos',
        value: openChamadosCount,
        subtext: openChamadosCount > 0 ? 'Aguardando atendimento' : 'Nenhum pendente',
        accent: openChamadosCount > 0 ? 'amber' : 'default',
        onClick: () => navigate('/admin/chamados'),
      });
    }

    cards.push({
      key: 'equipamentos',
      icon: <IconMonitor />,
      label: 'Equipamentos',
      value: resourcesLoading ? '—' : myEquipments.length,
      subtext: 'Vinculados à sua conta',
      accent: 'blue',
    });

    cards.push({
      key: 'licencas',
      icon: <IconLicense />,
      label: 'Minhas licenças',
      value: resourcesLoading ? '—' : myLicensesCount,
      subtext: myOfficeLicense ? 'Office + software' : 'Software vinculado',
      accent: 'green',
    });

    if (showTiAlerts) {
      cards.push({
        key: 'office-exp',
        icon: <IconLicense />,
        label: 'Office vencendo',
        value: loading ? '—' : expiringLicenses.length,
        subtext: urgentLicenses > 0 ? `${urgentLicenses} em até 7 dias` : 'Próximos do vencimento',
        accent: urgentLicenses > 0 ? 'amber' : 'default',
        onClick: () => navigate('/admin/office-licenses'),
      });
      cards.push({
        key: 'cert-exp',
        icon: <IconShield />,
        label: 'Certificados',
        value: loading ? '—' : expiringCertificates.length,
        subtext: urgentCertificates > 0 ? `${urgentCertificates} urgentes` : 'Monitoramento TI',
        accent: urgentCertificates > 0 ? 'red' : 'default',
        onClick: () => navigate('/admin/certificates'),
      });
    } else {
      cards.push({
        key: 'setor',
        icon: <IconUser />,
        label: 'Setor',
        value: user?.setor || '—',
        subtext: formatRoles(user),
        accent: 'default',
      });
      cards.push({
        key: 'conta',
        icon: <IconUser />,
        label: 'Conta',
        value: user?.enabled ? 'Ativa' : 'Pendente',
        subtext: user?.enabled ? 'Acesso liberado' : 'Aguardando ativação',
        accent: user?.enabled ? 'green' : 'amber',
      });
    }

    return cards.slice(0, 5);
  }, [
    showChamadosAdmin,
    showTiAlerts,
    openChamadosCount,
    resourcesLoading,
    myEquipments.length,
    myLicensesCount,
    myOfficeLicense,
    loading,
    expiringLicenses.length,
    expiringCertificates.length,
    urgentLicenses,
    urgentCertificates,
    user,
    navigate,
  ]);

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        breadcrumbs={['Malibru Portal', 'Início']}
        title={`Olá, ${user?.nome?.split(' ')[0]}`}
        subtitle="Visão geral dos seus recursos, alertas e acesso rápido ao portal."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.key} {...kpi} />
        ))}
      </div>

      <SectionCard
        title="Meus recursos"
        subtitle="Licenças e equipamentos vinculados à sua conta"
        icon={<IconLicense />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 -mx-2">
          <div className="px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ws-muted mb-4">
              Licenças
            </h3>
            {resourcesLoading ? (
              <p className="text-sm text-ws-muted">Carregando...</p>
            ) : !myOfficeLicense && mySoftwareLicenses.length === 0 ? (
              <p className="text-sm text-ws-muted">Nenhuma licença vinculada à sua conta.</p>
            ) : (
              <div className="space-y-5">
                {myOfficeLicense && (
                  <div className="rounded-lg border border-ws-border p-4 bg-ws-canvas/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                      Microsoft Office
                    </p>
                    <p className="font-medium text-ws-bright">{myOfficeLicense.email}</p>
                    <p className="text-sm text-ws-secondary mt-1">
                      Vencimento: {formatDate(myOfficeLicense.vencimento)}
                    </p>
                    <div className="mt-3 space-y-2">
                      <ExpiryProgressBar days={myOfficeLicense.diasParaVencer ?? daysUntil(myOfficeLicense.vencimento)} />
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${expiryBadgeClass(myOfficeLicense.diasParaVencer ?? daysUntil(myOfficeLicense.vencimento))}`}
                      >
                        {expiryLabel(myOfficeLicense.diasParaVencer ?? daysUntil(myOfficeLicense.vencimento))}
                      </span>
                    </div>
                  </div>
                )}

                {mySoftwareLicenses.map((license) => {
                  const days = daysUntil(license.dataVencimento);
                  return (
                    <div
                      key={license.id}
                      className="rounded-lg border border-ws-border p-4 bg-ws-canvas/50"
                    >
                      <p className="font-medium text-ws-bright">{license.nome}</p>
                      <p className="text-sm text-ws-secondary mt-1">
                        Vencimento: {formatDate(license.dataVencimento)}
                      </p>
                      <div className="mt-3 space-y-2">
                        <ExpiryProgressBar days={days} />
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${expiryBadgeClass(days)}`}
                          >
                            {expiryLabel(days)}
                          </span>
                          {(license.qtdLicencas ?? 1) > 1 && (
                            <span className="text-xs text-ws-muted">
                              {license.qtdLicencas} licenças
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ws-muted mb-4">
              Equipamentos
            </h3>
            {resourcesLoading ? (
              <p className="text-sm text-ws-muted">Carregando...</p>
            ) : myEquipments.length === 0 ? (
              <p className="text-sm text-ws-muted">Nenhum equipamento vinculado.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {equipmentsPagination.items.map((equipment) => (
                    <li
                      key={equipment.id}
                      className="rounded-lg border border-ws-border p-4 bg-ws-canvas/50"
                    >
                      <p className="font-medium text-ws-bright">{equipment.nome}</p>
                      <p className="text-xs text-ws-muted mt-1">
                        Empresa: {equipment.empresa ? formatEmpresaLabel(equipment.empresa) : '—'}
                      </p>
                      <p className="text-xs text-ws-muted mt-1">
                        Patrimônio: {equipment.patrimonio || '—'}
                      </p>
                      {equipment.descricao && (
                        <p className="text-sm text-ws-secondary mt-1">{equipment.descricao}</p>
                      )}
                    </li>
                  ))}
                </ul>
                <TablePagination
                  page={equipmentsPagination.page}
                  totalPages={equipmentsPagination.totalPages}
                  total={equipmentsPagination.total}
                  pageSize={EQUIPMENTS_PAGE_SIZE}
                  onPrev={() => setEquipmentsPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setEquipmentsPage((p) => Math.min(equipmentsPagination.totalPages, p + 1))
                  }
                />
              </>
            )}
          </div>
        </div>
      </SectionCard>

      {showTiAlerts && (
        <SectionCard
          title="Alertas administrativos"
          subtitle={
            totalUrgentExpiring > 0
              ? `${totalUrgentExpiring} item(ns) vence(m) em até 7 dias`
              : 'Monitoramento de vencimentos — Office, software e certificados'
          }
          icon={<IconShield />}
          noPadding
          bodyClassName="p-0"
        >
          <div className="px-6 py-4 border-b border-ws-border flex flex-wrap gap-2">
            {expiringTabs.map((tab) => {
              const isActive = expiringTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExpiringTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-ws-elevated text-ws-secondary hover:bg-ws-hover-strong'
                  }`}
                >
                  {tab.label}
                  {tab.urgentCount > 0 && (
                    <span
                      className={`text-[10px] min-w-[1.25rem] h-5 px-1.5 rounded-full inline-flex items-center justify-center ${
                        isActive ? 'bg-ws-panel/20 text-white' : 'bg-amber-100 text-amber-400'
                      }`}
                    >
                      {tab.urgentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-6 py-5">
            <ExpiringPanel embedded {...activeExpiringPanel} />
          </div>
        </SectionCard>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ws-muted">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLinkCard
            title="Meu Perfil"
            description="Visualize e atualize suas informações pessoais, e-mail e setor."
            onClick={() => navigate('/profile')}
          />
          <QuickLinkCard
            title={showChamadosAdmin ? 'Abrir Chamado' : 'Suporte Técnico'}
            description={
              showChamadosAdmin
                ? 'Registre um chamado de suporte pela área de atendimento.'
                : 'Abra um chamado de suporte técnico e acompanhe o andamento.'
            }
            badge={showChamadosAdmin ? 'Suporte' : undefined}
            onClick={() => navigate(showChamadosAdmin ? '/admin/chamados?novo=1' : '/chamados?novo=1')}
          />
          {showChamadosAdmin && (
            <QuickLinkCard
              title="Atender Chamados"
              description={
                openChamadosCount > 0
                  ? `${openChamadosCount} chamado(s) aguardando atendimento.`
                  : 'Visualize e atualize o status dos chamados de suporte.'
              }
              badge="Suporte"
              onClick={() => navigate('/admin/chamados')}
            />
          )}
          <QuickLinkCard
            title="Meus Chamados"
            description="Consulte o histórico e o status dos seus chamados."
            onClick={() => navigate('/chamados')}
          />
        </div>
      </section>
    </PageContainer>
  );
}
