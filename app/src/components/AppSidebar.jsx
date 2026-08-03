import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  canAccessChamadosAdmin,
  canAccessTiModules,
  isAdmin,
} from '../utils/roles';

function IconHome() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconTicket() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconHeadset() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M9 12h.01M15 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconOffice() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconSoftware() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function IconCertificate() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function IconDevice() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function NavItem({ to, end, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
          isActive
            ? 'bg-gray-100 text-gray-900 font-medium'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
          )}
          <Icon />
          <span className="truncate">{children}</span>
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="px-3 pt-5 pb-1.5 text-[11px] font-medium text-gray-400 first:pt-2">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export default function AppSidebar() {
  const { user } = useAuth();
  const showAdminUsers = isAdmin(user);
  const showChamadosAdmin = canAccessChamadosAdmin(user);
  const showTiModules = canAccessTiModules(user);

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gray-200/80 flex flex-col shrink-0">
      <div className="px-5 h-16 flex items-center shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-xs">M</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[15px] text-gray-900 tracking-tight leading-none truncate">
              Malibru
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">Portal interno</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-6 overflow-y-auto">
        <NavSection label="Menu">
          <NavItem to="/HomePage" end icon={IconHome}>
            Início
          </NavItem>
          <NavItem to="/profile" icon={IconUser}>
            Meu perfil
          </NavItem>
          <NavItem to="/chamados" icon={IconTicket}>
            Chamados
          </NavItem>
          <NavItem to="/relatorios" icon={IconChart}>
            Relatórios
          </NavItem>
        </NavSection>

        {showChamadosAdmin && (
          <NavSection label="Suporte">
            <NavItem to="/admin/chamados" icon={IconHeadset}>
              Atender chamados
            </NavItem>
          </NavSection>
        )}

        {showAdminUsers && (
          <NavSection label="Admin">
            <NavItem to="/admin" icon={IconUsers}>
              Usuários
            </NavItem>
          </NavSection>
        )}

        {showTiModules && (
          <NavSection label="TI">
            <NavItem to="/admin/office-licenses" icon={IconOffice}>
              Licenças Office
            </NavItem>
            <NavItem to="/admin/software-licenses" icon={IconSoftware}>
              Licenças de software
            </NavItem>
            <NavItem to="/admin/certificates" icon={IconCertificate}>
              Certificados
            </NavItem>
            <NavItem to="/admin/equipamentos" icon={IconDevice}>
              Equipamentos
            </NavItem>
            <NavItem to="/admin/termos-assinados" icon={IconDocument}>
              Termos assinados
            </NavItem>
          </NavSection>
        )}
      </nav>
    </aside>
  );
}
