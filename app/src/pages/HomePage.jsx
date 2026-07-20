import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

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
          Acesso rápido
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardPanel
            title="Meu Perfil"
            description="Visualize e atualize suas informações pessoais, e-mail e setor."
            onClick={() => navigate('/profile')}
          />
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500">
            Painéis administrativos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardPanel
              title="Usuários"
              description="Ative ou desative contas e gerencie acessos ao portal."
              badge="Admin"
              onClick={() => navigate('/admin')}
            />
            <DashboardPanel
              title="Licenças Office"
              description="Cadastre, edite e exclua licenças Microsoft Office da organização."
              badge="Admin"
              onClick={() => navigate('/admin/office-licenses')}
            />
            <DashboardPanel
              title="Equipamentos"
              description="Controle de equipamentos corporativos e vínculos com usuários."
              badge="Admin"
              onClick={() => navigate('/admin/equipamentos')}
            />
          </div>
        </section>
      )}
    </div>
  );
}
