import { createContext, useContext, useMemo } from 'react';
import { useApi } from '../lib/useApi.js';

const AlertsCtx = createContext({ count: 0, refresh: () => {} });
export const useAlerts = () => useContext(AlertsCtx);

export function AlertsProvider({ children }) {
  const q = useApi('/peringatan');
  const value = useMemo(() => {
    const d = q.data;
    const ids = new Set();
    if (d) [...d.stok_kritis, ...d.segera_kedaluwarsa, ...d.kedaluwarsa].forEach((r) => ids.add(r.id));
    return { count: ids.size, refresh: q.reload };
  }, [q.data, q.reload]);
  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>;
}
