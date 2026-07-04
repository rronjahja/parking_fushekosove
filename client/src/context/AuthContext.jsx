// Identiteti i përdoruesit. Nuk ka më sesion anonim — përdoruesit duhet të
// regjistrohen/kyçen. Harta shihet pa kyçje, por rezervimi/kuleta/chat/profili
// kërkojnë llogari.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authRegister, authLogin, authMe } from '../api/endpoints.js';
import { getToken, setToken, clearToken } from '../api/client.js';

const AuthContext = createContext(null);
const STAFF = ['AGENT', 'ADMIN', 'SUPERADMIN'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      try {
        if (getToken()) {
          const { user: me } = await authMe();
          setUser(me);
        }
      } catch {
        clearToken();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const register = async (payload) => {
    const { token, user: u, devCodes } = await authRegister(payload);
    setToken(token);
    setUser(u);
    return { user: u, devCodes };
  };

  const login = async (identifier, password) => {
    const { token, user: u } = await authLogin(identifier, password);
    setToken(token);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try { const { user: me } = await authMe(); setUser(me); } catch { /* injoro */ }
  };

  const role = user?.role || null;
  const value = {
    user, ready, register, login, logout, refreshUser, role,
    isAuthed: Boolean(user),
    isCustomer: role === 'CUSTOMER',
    isStaff: STAFF.includes(role),
    isAdmin: ['ADMIN', 'SUPERADMIN'].includes(role),
    isSuper: role === 'SUPERADMIN',
    isAgent: STAFF.includes(role),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);