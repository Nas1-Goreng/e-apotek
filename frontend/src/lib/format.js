const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const angka = new Intl.NumberFormat('id-ID');

export const fmtRp = (n) => rupiah.format(Number(n) || 0).replace(/\u00a0/g, ' ');
export const fmtNum = (n) => angka.format(Number(n) || 0);

// Tanggal 'YYYY-MM-DD' dibaca sebagai tanggal lokal supaya tidak bergeser oleh zona waktu.
export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = parseDate(s);
  return d ? d.toLocaleDateString('id-ID', opts) : '';
}

export function fmtDateTime(s) {
  if (!s) return '';
  const d = parseDate(s);
  const time = s.slice(11, 16);
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${time}`;
}

export function toISO(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const todayISO = () => toISO(new Date());

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

export const roleLabel = (role) => (role === 'admin' ? 'Admin' : 'Apoteker / Kasir');

export const digits = (s) => String(s ?? '').replace(/\D/g, '');
