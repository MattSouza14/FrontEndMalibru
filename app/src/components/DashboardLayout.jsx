import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AppSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
