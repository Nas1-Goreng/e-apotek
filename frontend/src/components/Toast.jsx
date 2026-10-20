import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icon from './Icon.jsx';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((message, tone = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, message, tone }]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  const value = useMemo(() => ({ ok: (m) => push(m, 'ok'), bad: (m) => push(m, 'bad') }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'bad' ? 'bad' : ''}`}>
            <Icon name={t.tone === 'bad' ? 'awas' : 'cek'} size={20} />
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Tutup pesan"><Icon name="tutup" size={18} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
