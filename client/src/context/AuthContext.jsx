// Identiteti i përdoruesit.
//
// Ka DY nivele:
//   • Vizitor (pa llogari) - merr automatikisht një token "guest:..." në nisje.
//     Mjafton për të zgjedhur vendin, për të paguar me SMS/aparat dhe për
//     "Gjej veturën time" në atë shfletues.
//   • Llogari (opsionale) - kyçje/regjistrim. Shton kreditet, historikun,
//     chat-in e mbështetjes dhe profilin.
//
// isAuthed do të thotë GJITHNJË "ka llogari reale" - jo vizitor. Kështu çdo
// pjesë që kërkon llogari (chat, profil, kuletë) mbetet e mbrojtur pa ndryshim.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authRegister, authLogin, authMe, authGuest } from '../api/endpoints.js';
import { getToken, setToken, clearToken } from '../api/client.js';

const AuthContext = createContext(null);
const STAFF = ['AGENT', 'ADMIN', 'SUPERADMIN'];

// Roli lexohet nga vetë token-i pa e pyetur serverin. Përdoret VETËM për të
// dalluar një token vizitori nga një token llogarie para thirrjes së /auth/me:
// një token vizitori do të kthente 404 atje dhe do të fshihej pa nevojë.
function roleFromToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1])).role || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guest, setGuest] = useState(false);
  const [ready, setReady] = useState(false);
  const bootedRef = useRef(false);

  // Siguron një identitet vizitori kur nuk ka llogari të kyçur.
  const ensureGuest = async () => {
    try {
      const { token } = await authGuest();
      setToken(token);
      setGuest(true);
    } catch {
      setGuest(false); // pa rrjet - harta shihet, rezervimi provohet më vonë
    }
  };

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      try {
        const token = getToken();
        if (token && roleFromToken(token) === 'GUEST') {
          setGuest(true);                 // token vizitori ekziston - mjafton
        } else if (token) {
          const { user: me } = await authMe();
          setUser(me);
        } else {
          await ensureGuest();
        }
      } catch {
        clearToken();
        await ensureGuest();              // llogaria skadoi - vazhdo si vizitor
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const register = async (payload) => {
    const { token, user: u, devCodes } = await authRegister(payload);
    setToken(token);
    setUser(u);
    setGuest(false);
    return { user: u, devCodes };
  };

  const login = async (identifier, password) => {
    const { token, user: u } = await authLogin(identifier, password);
    setToken(token);
    setUser(u);
    setGuest(false);
    return u;
  };

  // Dalja nuk e lë shfletuesin pa identitet: kthehet në vizitor, që të mund të
  // vazhdojë të rezervojë.
  const logout = async () => {
    clearToken();
    setUser(null);
    await ensureGuest();
  };

  const refreshUser = async () => {
    try { const { user: me } = await authMe(); setUser(me); } catch { /* injoro */ }
  };

  const role = user?.role || null;
  const value = {
    user, ready, register, login, logout, refreshUser, role,
    isAuthed: Boolean(user),
    isGuest: !user && guest,
    isCustomer: role === 'CUSTOMER',
    isStaff: STAFF.includes(role),
    isAdmin: ['ADMIN', 'SUPERADMIN'].includes(role),
    isSuper: role === 'SUPERADMIN',
    isAgent: STAFF.includes(role),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);