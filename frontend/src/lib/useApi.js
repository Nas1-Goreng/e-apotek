import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

// Memuat data dari path; path null berarti tidak memuat apa pun.
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: path !== null, error: null });
  const [tick, setTick] = useState(0);
  const alive = useRef(0);

  useEffect(() => {
    if (path === null) return undefined;
    const ctrl = new AbortController();
    const mine = ++alive.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: ctrl.signal })
      .then((data) => { if (alive.current === mine) setState({ data, loading: false, error: null }); })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (alive.current === mine) setState({ data: null, loading: false, error });
      });
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
