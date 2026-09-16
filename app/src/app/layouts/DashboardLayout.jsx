import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader.jsx';
import AppSidebar from './AppSidebar.jsx';
import { NotificationProvider } from '../../features/notifications/context/NotificationContext.jsx';
import { ToastProvider } from '../../shared/context/ToastContext.jsx';

export default function DashboardLayout() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-surface-muted flex">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-auto">
              <Suspense fallback={<p role="status" className="p-8 text-center text-ws-muted">Carregando página...</p>}><Outlet /></Suspense>
            </main>
          </div>
        </div>
      </NotificationProvider>
    </ToastProvider>
  );
}
