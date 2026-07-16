import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import {
  clearAuth,
  getToken,
  saveAuth,
  saveUser,
} from '../services/authStorage';

const AuthContext = createContext(null);

function toUsuarioResponde(profile) {
  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    setor: profile.setor ?? null,
    role: profile.role,
    enabled: profile.enabled,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
      saveUser(data);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function loginSuccess({ token, user: loggedUser }, manterConectado = false) {
    saveAuth({ token, user: loggedUser }, manterConectado);
    setUser(loggedUser);
  }

  function logout() {
    clearAuth();
    setUser(null);
  }

  function updateUser(profile) {
    const nextUser = toUsuarioResponde(profile);
    setUser(nextUser);
    saveUser(nextUser);
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout, getToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}