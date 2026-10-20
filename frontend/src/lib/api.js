const BASE = import.meta.env.VITE_API_BASE || '/api';

let csrfToken = null;
let onUnauthorized = null;

export const setCsrf = (token) => { csrfToken = token; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(data?.error || 'Permintaan gagal. Coba lagi.', res.status, data?.fields);
  }
  return data;
}

export function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}
