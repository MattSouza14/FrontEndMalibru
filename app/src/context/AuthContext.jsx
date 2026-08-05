import { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/authService';
import {
  clearAuth,
  getToken,
  saveAuth,
  saveUser,
} from '../services/authStorage';
import { normalizeUser } from '../utils/roles';

const AuthContext = createContext(null);

function toUsuarioResponde(profile) {
  return normalizeUser({
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    setor: profile.setor ?? null,
    roles: profile.roles,
    role: profile.role,
    enabled: profile.enabled,
  });
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
      const data = await getMe(token);
      const normalized = normalizeUser(data);
      setUser(normalized);
      saveUser(normalized);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function loginSuccess({ token, user: loggedUser }, manterConectado = false) {
    const normalized = normalizeUser(loggedUser);
    saveAuth({ token, user: normalized }, manterConectado);
    setUser(normalized);
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