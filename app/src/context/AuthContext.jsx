// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

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
    } catch {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function loginSuccess({ token, user }, manterConectado = false) {
    const storage = manterConectado ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}