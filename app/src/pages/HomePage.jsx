import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExpiringPanel, { DateCell, ExpiryStatusCell } from '../components/ExpiringPanel';
import { listCertificates } from '../services/certificateService';
import { listAdminChamados } from '../services/chamadoService';
import { listOfficeLicenses } from '../services/officeLicenseService';
import { getMyEquipments, getMyOfficeLicense } from '../services/userResourcesService';
import { daysUntil, expiryBadgeClass, expiryLabel, formatDate, getTopExpiring } from '../utils/expiry';

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
  const isAdmin = user?.role === 'ADMIN';
  const [loading, setLoading] = useState(false);
  const [expiringLicenses, setExpiringLicenses] = useState([]);
  const [expiringCertificates, setExpiringCertificates] = useState([]);
  const [openChamadosCount, setOpenChamadosCount] = useState(0);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [myOfficeLicense, setMyOfficeLicense] = useState(null);
  const [myEquipments, setMyEquipments] = useState([]);

  useEffect(() => {
    async function loadMyResources() {
      const token = getToken();
      if (!token) return;

      setResourcesLoading(true);
      try {
        const [licenseData, equipmentsData] = await Promise.all([
          getMyOfficeLicense(token).catch((err) => {
            if (err.code === 'LICENCA_NAO_VINCULADA' || err.status === 404) return null;
            throw err;
          }),
          getMyEquipments(token),
        ]);

        setMyOfficeLicense(licenseData);
        setMyEquipments(Array.isArray(equipmentsData) ? equipmentsData : []);
      } catch {
        setMyOfficeLicense(null);
        setMyEquipments([]);
      } finally {
        setResourcesLoading(false);
      }
    }

    loadMyResources();
  }, [getToken]);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadExpiringItems() {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      try {
        const [licensesData, certificatesData, chamadosData] = await Promise.all([
          listOfficeLicenses(token),
          listCertificates(token),
          listAdminChamados(token, 'ABERTO'),
        ]);

        const licenses = Array.isArray(licensesData) ? licensesData : [];
        const certificates = Array.isArray(certificatesData) ? certificatesData : [];
        const chamados = Array.isArray(chamadosData) ? chamadosData : [];

        setExpiringLicenses(getTopExpiring(licenses, 'vencimento'));
        setExpiringCertificates(getTopExpiring(certificates, 'dataVencimento'));
        setOpenChamadosCount(chamados.length);
      } catch {
        setExpiringLicenses([]);
        setExpiringCertificates([]);
        setOpenChamadosCount(0);
      } finally {
        setLoading(false);
      }
    }

    loadExpiringItems();
  }, [isAdmin, getToken]);

  const urgentLicenses = useMemo(
    () => expiringLicenses.filter((l) => daysUntil(l.vencimento) <= 7).length,
    [expiringLicenses],
  );

  const urgentCertificates = useMemo(
    () => expiringCertificates.filter((c) => daysUntil(c.dataVencimento) <= 7).length,
    [expiringCertificates],
  );

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
          <p className="text-lg font-medium text-gray-900 mt-1">{user?.role}</p>
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
              Licença Office
            </p>
            {resourcesLoading ? (
              <p className="text-sm text-gray-500 mt-3">Carregando...</p>
            ) : myOfficeLicense ? (
              <div className="mt-3 space-y-2">
                <p className="font-medium text-gray-900">{myOfficeLicense.email}</p>
                <p className="text-sm text-gray-600">
                  Vencimento: {formatDate(myOfficeLicense.vencimento)}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${expiryBadgeClass(myOfficeLicense.diasParaVencer)}`}
                >
                  {expiryLabel(myOfficeLicense.diasParaVencer)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-3">
                Nenhuma licença Office vinculada à sua conta.
              </p>
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
              <ul className="mt-3 space-y-3">
                {myEquipments.map((equipment) => (
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
            )}
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ExpiringPanel
            title="Licenças Office"
            loading={loading}
            emptyMessage="Nenhuma licença cadastrada."
            items={expiringLicenses}
            dateField="vencimento"
            linkTo="/admin/office-licenses"
            urgentCount={urgentLicenses}
            urgentLabel={`${urgentLicenses} licença(s) vence(m) em até 7 dias`}
            columns={[
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
            ]}
          />

          <ExpiringPanel
            title="Certificados"
            loading={loading}
            emptyMessage="Nenhum certificado cadastrado."
            items={expiringCertificates}
            dateField="dataVencimento"
            linkTo="/admin/certificates"
            urgentCount={urgentCertificates}
            urgentLabel={`${urgentCertificates} certificado(s) vence(m) em até 7 dias`}
            columns={[
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
            ]}
          />
        </div>
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
            title={isAdmin ? 'Abrir Chamado' : 'Suporte Técnico'}
            description={
              isAdmin
                ? 'Registre um chamado de suporte como administrador.'
                : 'Abra um chamado de suporte técnico e acompanhe o andamento.'
            }
            badge={isAdmin ? 'Admin' : undefined}
            onClick={() => navigate(isAdmin ? '/admin/chamados?novo=1' : '/chamados?novo=1')}
          />
        </div>
      </section>

      {isAdmin && (
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
              badge="Admin"
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

      {!isAdmin && (
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

      {isAdmin && (
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
            Painéis administrativos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <DashboardPanel
              title="Usuários"
              description="Ative ou desative contas e gerencie acessos ao portal."
              badge="Admin"
              onClick={() => navigate('/admin')}
            />
            <DashboardPanel
              title="Licenças Office"
              description="Cadastre, edite e exclua licenças Microsoft Office."
              badge="Admin"
              onClick={() => navigate('/admin/office-licenses')}
            />
            <DashboardPanel
              title="Certificados"
              description="Gerencie certificados digitais e datas de vencimento."
              badge="Admin"
              onClick={() => navigate('/admin/certificates')}
            />
            <DashboardPanel
              title="Equipamentos"
              description="Controle de equipamentos corporativos e vínculos."
              badge="Admin"
              onClick={() => navigate('/admin/equipamentos')}
            />
          </div>
        </section>
      )}
    </div>
  );
}
