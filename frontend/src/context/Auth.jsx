import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCsrf, setUnauthorizedHandler } from '../lib/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, error: null });

  const boot = useCallback(() => {
    setState({ status: 'loading', user: null, error: null });
    api('/auth/me')
      .then((d) => { setCsrf(d.csrf); setState({ status: 'ready', user: d.user, error: null }); })
      .catch((error) => setState({ status: 'error', user: null, error }));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setCsrf(null); setState({ status: 'ready', user: null, error: null }); });
    boot();
  }, [boot]);

  const login = useCallback(async (username, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { username, password } });
    setCsrf(d.csrf);
    setState({ status: 'ready', user: d.user, error: null });
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* sesi sudah habis di server */ }
    setCsrf(null);
    setState({ status: 'ready', user: null, error: null });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout, retry: boot }), [state, login, logout, boot]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
