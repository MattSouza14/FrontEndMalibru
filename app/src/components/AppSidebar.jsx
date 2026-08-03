import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  canAccessChamadosAdmin,
  canAccessTiModules,
  isAdmin,
} from '../utils/roles';

function NavItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block mx-3 px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-sidebar-active text-white font-medium'
            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div className="pt-2">
      <p className="px-6 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/70">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default function AppSidebar() {
  const { user } = useAuth();
  const showAdminUsers = isAdmin(user);
  const showChamadosAdmin = canAccessChamadosAdmin(user);
  const showTiModules = canAccessTiModules(user);

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <p className="font-bold text-sm text-white tracking-tight leading-tight">
              Malibru
            </p>
            <p className="text-[10px] uppercase tracking-widest text-primary-light/80 font-semibold">
              Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <NavSection label="Conta">
          <NavItem to="/HomePage" end>
            Início
          </NavItem>
          <NavItem to="/profile">
            Meu Perfil
          </NavItem>
          <NavItem to="/chamados">
            Meus Chamados
          </NavItem>
          <NavItem to="/relatorios">
            Relatórios
          </NavItem>
        </NavSection>

        {showChamadosAdmin && (
          <NavSection label="Suporte">
            <NavItem to="/admin/chamados">
              Atender Chamados
            </NavItem>
          </NavSection>
        )}

        {showAdminUsers && (
          <NavSection label="Administração">
            <NavItem to="/admin">
              Usuários
            </NavItem>
          </NavSection>
        )}

        {showTiModules && (
          <NavSection label="TI">
            <NavItem to="/admin/office-licenses">
              Licenças Office
            </NavItem>
            <NavItem to="/admin/software-licenses">
              Licenças de Software
            </NavItem>
            <NavItem to="/admin/certificates">
              Certificados
            </NavItem>
            <NavItem to="/admin/equipamentos">
              Equipamentos
            </NavItem>
            <NavItem to="/admin/termos-assinados">
              Termos Assinados
            </NavItem>
          </NavSection>
        )}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-sidebar-muted/60 uppercase tracking-wider">
          Malibru &copy; 2026
        </p>
      </div>
    </aside>
  );
}
