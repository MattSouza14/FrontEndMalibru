import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-4 py-2.5 text-sm transition-colors border-l-2 ${
          isActive
            ? 'border-green-700 bg-green-50 text-green-800 font-medium'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-green-700'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const initial = (user?.nome || user?.email || 'U')[0]?.toUpperCase();

  function handleLogout() {
    logout();
    navigate('/Login', { replace: true });
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="size-9 bg-green-700 flex items-center justify-center shrink-0">
            <span className="text-white font-serif font-bold italic">M</span>
          </div>
          <div>
            <p className="font-serif font-bold text-sm tracking-tight uppercase leading-tight">
              Malibru
            </p>
            <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold">
              Portal
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-green-100 border border-green-200 rounded-full flex items-center justify-center font-serif italic text-green-700 text-lg shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{user?.nome}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-gray-100 text-gray-600">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        <p className="px-5 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
          Menu
        </p>
        <NavItem to="/HomePage" end>
          Início
        </NavItem>
        <NavItem to="/profile">
          Meu Perfil
        </NavItem>
        <NavItem to="/chamados">
          Meus Chamados
        </NavItem>

        {isAdmin && (
          <>
            <p className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              Administração
            </p>
            <NavItem to="/admin/chamados">
              Atender Chamados
            </NavItem>
            <NavItem to="/admin">
              Usuários
            </NavItem>
            <NavItem to="/admin/office-licenses">
              Licenças Office
            </NavItem>
            <NavItem to="/admin/certificates">
              Certificados
            </NavItem>
            <NavItem to="/admin/equipamentos">
              Equipamentos
            </NavItem>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
