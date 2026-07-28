import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole, normalizeUser } from '../utils/roles';

export default function RoleRoute({ roles = [] }) {
  const { user, loading } = useAuth();
  const normalizedUser = normalizeUser(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!normalizedUser) {
    return <Navigate to="/Login" replace />;
  }

  if (!hasAnyRole(normalizedUser, roles)) {
    return <Navigate to="/HomePage" replace />;
  }

  return <Outlet />;
}
