import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/Login', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo, {user?.nome}
        </h1>
        <p className="text-gray-600 mb-2">
          {user?.email}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Setor: {user?.setor || '—'} · Perfil: {user?.role}
        </p>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            Meu Perfil
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}