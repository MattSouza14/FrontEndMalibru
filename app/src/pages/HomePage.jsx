import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExpiringPanel, { DateCell, ExpiryStatusCell } from '../components/ExpiringPanel';
import TablePagination from '../components/TablePagination';
import { listCertificates } from '../services/certificateService';
import { listAdminChamados } from '../services/chamadoService';
import { listOfficeLicenses } from '../services/officeLicenseService';
import { listSoftwareLicenses, listSoftwareLicensesByUser } from '../services/softwareLicenseService';
import { getMyEquipments, getMyOfficeLicense, getMySoftwareLicenses } from '../services/userResourcesService';
import { daysUntil, expiryBadgeClass, expiryLabel, formatDate, getTopExpiring } from '../utils/expiry';
import { clampPageAfterChange, paginateItems } from '../utils/pagination';
import {
  canAccessChamadosAdmin,
  canAccessTiModules,
  formatRoles,
  hasAnyRole,
} from '../utils/roles';

const EQUIPMENTS_PAGE_SIZE = 4;

function DashboardPanel({ title, description, badge, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-white border border-gray-200 p-6 text-left transition-all group ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-green-700 hover:shadow-sm hover:bg-green-50/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-xl text-green-700 group-hover:text-green-800">
            {title}
          </p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 shrink-0 bg-gray-100 text-gray-500">
            {badge}
          </span>
        )}
      </div>
      {!disabled && (
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
          Acessar →
        </p>
      )}
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
              <span className="font-medium text-gray-900">{item.email}</span>
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
              <span className="text-gray-600">{item.vagasRestantes ?? 0} / 5</span>
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
              <span className="font-medium text-gray-900">{item.nome}</span>
            ),
          },
          {
            key: 'usuario',
            label: 'Usuário',
            render: (item) => (
              <span className="text-gray-600">{item.usuarioNome || '—'}</span>
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
              <span className="font-medium text-gray-900">{item.nome}</span>
            ),
          },
          {
            key: 'empresa',
            label: 'Empresa',
            render: (item) => (
              <span className="text-gray-600">{item.empresa || '—'}</span>
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
    { id: 'office', label: 'Licenças Office', urgentCount: urgentLicenses },
    { id: 'software', label: 'Licenças de Software', urgentCount: urgentSoftwareLicenses },
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

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      <header>
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
          Dashboard
        </p>
        <h1 className="font-serif italic text-4xl text-green-700">
          Olá, {user?.nome?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Bem-vindo ao portal Malibru. Use o menu lateral ou os painéis abaixo para navegar.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Setor</p>
          <p className="text-lg font-medium text-gray-900 mt-1">{user?.setor || '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Perfil</p>
          <p className="text-lg font-medium text-gray-900 mt-1">{formatRoles(user)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Conta</p>
          <p className="text-lg font-medium text-gray-900 mt-1">
            {user?.enabled ? 'Ativa' : 'Pendente'}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
          Meus recursos
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Minhas licenças
            </p>
            {resourcesLoading ? (
              <p className="text-sm text-gray-500 mt-3">Carregando...</p>
            ) : !myOfficeLicense && mySoftwareLicenses.length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">
                Nenhuma licença vinculada à sua conta.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {myOfficeLicense && (
                  <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">
                      Microsoft Office
                    </p>
                    <p className="font-medium text-gray-900">{myOfficeLicense.email}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Vencimento: {formatDate(myOfficeLicense.vencimento)}
                    </p>
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${expiryBadgeClass(myOfficeLicense.diasParaVencer)}`}
                    >
                      {expiryLabel(myOfficeLicense.diasParaVencer)}
                    </span>
                  </div>
                )}

                {mySoftwareLicenses.length > 0 && (
                  <ul className="space-y-3">
                    {mySoftwareLicenses.map((license) => {
                      const days = daysUntil(license.dataVencimento);

                      return (
                        <li
                          key={license.id}
                          className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                        >
                          <p className="font-medium text-gray-900">{license.nome}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Vencimento: {formatDate(license.dataVencimento)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${expiryBadgeClass(days)}`}
                            >
                              {expiryLabel(days)}
                            </span>
                            {(license.qtdLicencas ?? 1) > 1 && (
                              <span className="text-xs text-gray-500">
                                {license.qtdLicencas} licenças
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Equipamentos
            </p>
            {resourcesLoading ? (
              <p className="text-sm text-gray-500 mt-3">Carregando...</p>
            ) : myEquipments.length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">
                Nenhum equipamento vinculado à sua conta.
              </p>
            ) : (
              <>
                <ul className="mt-3 space-y-3">
                  {equipmentsPagination.items.map((equipment) => (
                    <li key={equipment.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-gray-900">{equipment.nome}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Patrimônio: {equipment.patrimonio || '—'}
                      </p>
                      {equipment.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{equipment.descricao}</p>
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
      </section>

      {showTiAlerts && (
        <section className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
              Alertas administrativos
            </p>
            <h2 className="font-serif text-2xl text-green-700 mt-1">Próximos do vencimento</h2>
            {totalUrgentExpiring > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {totalUrgentExpiring} item(ns) vence(m) em até 7 dias
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {expiringTabs.map((tab) => {
              const isActive = expiringTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExpiringTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border transition-colors inline-flex items-center gap-2 ${
                    isActive
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-700 hover:text-green-700'
                  }`}
                >
                  {tab.label}
                  {tab.urgentCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tab.urgentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ExpiringPanel embedded {...activeExpiringPanel} />
        </section>
      )}

      <section className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
          Acesso rápido
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardPanel
            title="Meu Perfil"
            description="Visualize e atualize suas informações pessoais, e-mail e setor."
            onClick={() => navigate('/profile')}
          />
          <DashboardPanel
            title={showChamadosAdmin ? 'Abrir Chamado' : 'Suporte Técnico'}
            description={
              showChamadosAdmin
                ? 'Registre um chamado de suporte pela área de atendimento.'
                : 'Abra um chamado de suporte técnico e acompanhe o andamento.'
            }
            badge={showChamadosAdmin ? 'Suporte' : undefined}
            onClick={() => navigate(showChamadosAdmin ? '/admin/chamados?novo=1' : '/chamados?novo=1')}
          />
        </div>
      </section>

      {showChamadosAdmin && (
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
            Suporte
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardPanel
              title="Atender Chamados"
              description={
                openChamadosCount > 0
                  ? `${openChamadosCount} chamado(s) aguardando atendimento.`
                  : 'Visualize e atualize o status dos chamados de suporte.'
              }
              badge="Suporte"
              onClick={() => navigate('/admin/chamados')}
            />
            <DashboardPanel
              title="Meus Chamados"
              description="Consulte os chamados abertos por você."
              onClick={() => navigate('/chamados')}
            />
          </div>
        </section>
      )}

      {!showChamadosAdmin && (
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
            Suporte
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardPanel
              title="Meus Chamados"
              description="Veja o histórico e o status dos seus chamados abertos."
              onClick={() => navigate('/chamados')}
            />
          </div>
        </section>
      )}

    </div>
  );
}
