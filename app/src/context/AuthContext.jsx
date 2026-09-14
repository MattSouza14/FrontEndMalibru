import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, logout as logoutRequest } from '../services/authService';
import {
  clearAuth,
  getStoredUser,
  getToken,
  saveUser,
  saveUserProfile,
} from '../services/authStorage';
import { normalizeUser } from '../utils/roles';

const AuthContext = createContext(null);

function toUsuarioResponde(profile) {
  return normalizeUser({
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    setor: profile.setor ?? null,
    empresa: profile.empresa ?? null,
    roles: profile.roles,
    role: profile.role,
    enabled: profile.enabled,
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getMe();
      const normalized = normalizeUser(data);
      setUser(normalized);
      saveUserProfile(normalized);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getStoredUser();
    if (cached) {
      setUser(normalizeUser(cached));
    }
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    function handleUnauthorized() {
      clearAuth();
      setUser(null);
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  function loginSuccess({ user: loggedUser, token }, manterConectado = false) {
    const normalized = normalizeUser(loggedUser);
    saveUser(normalized, manterConectado, token);
    setUser(normalized);
  }

  async function logout() {
    await logoutRequest();
    clearAuth();
    setUser(null);
  }

  function updateUser(profile) {
    const nextUser = toUsuarioResponde(profile);
    setUser(nextUser);
    saveUserProfile(nextUser);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, loginSuccess, logout, getToken, updateUser, refreshUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
