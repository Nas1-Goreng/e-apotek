import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { AlertsProvider, useAlerts } from '../context/Alerts.jsx';
import { fmtDate, initials, roleLabel, todayISO } from '../lib/format.js';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';

const GROUPS = [
  { title: 'Harian', items: [
    { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/kasir', label: 'Kasir', icon: 'kasir' },
    { to: '/resep', label: 'Resep', icon: 'resep' },
    { to: '/riwayat', label: 'Riwayat penjualan', icon: 'riwayat' },
  ] },
  { title: 'Data obat', items: [
    { to: '/obat', label: 'Obat', icon: 'obat' },
    { to: '/kategori', label: 'Kategori', icon: 'kategori' },
    { to: '/supplier', label: 'Pemasok', icon: 'pemasok' },
    { to: '/peringatan', label: 'Peringatan', icon: 'peringatan', alert: true },
  ] },
  { title: 'Pengelolaan', admin: true, items: [
    { to: '/laporan', label: 'Laporan', icon: 'laporan' },
    { to: '/pengguna', label: 'Pengguna', icon: 'pengguna' },
  ] },
];

const BOTTOM = ['/', '/kasir', '/obat', '/peringatan'];

function NavItem({ item, count, onClick }) {
  return (
    <NavLink to={item.to} end={item.end} className="nav-link" onClick={onClick} title={item.label} aria-label={item.alert && count ? `${item.label}, ${count} perlu tindakan` : item.label}>
      <Icon name={item.icon} />
      <span className="label">{item.label}</span>
      {item.alert && count > 0 && <span className="nav-count" aria-hidden="true">{count}</span>}
    </NavLink>
  );
}

function ShellInner() {
  const { user, logout } = useAuth();
  const { count } = useAlerts();
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const groups = GROUPS.filter((g) => !g.admin || user.role === 'admin');
  const all = groups.flatMap((g) => g.items);

  useEffect(() => { setMenu(false); }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#konten">Lewati ke konten</a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="E-Apotek, ke dashboard">
          <span className="brand-mark"><Icon name="obat" size={22} /></span>
          <span className="brand-name">E-Apotek</span>
        </Link>
        <nav aria-label="Menu utama">
          {groups.map((g) => (
            <div className="nav-group" key={g.title}>
              <span className="nav-group-title">{g.title}</span>
              {g.items.map((it) => <NavItem key={it.to} item={it} count={count} />)}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">{initials(user.nama_lengkap)}</span>
            <span className="user-meta"><strong>{user.nama_lengkap}</strong><span>{roleLabel(user.role)}</span></span>
          </div>
          <button type="button" className="nav-link" onClick={logout} style={{ width: '100%', background: 'none', border: 0 }} title="Keluar" aria-label="Keluar">
            <Icon name="keluar" /><span className="label">Keluar</span>
          </button>
        </div>
      </aside>

      <main className="main" id="konten" tabIndex={-1}>
        <div className="topbar">
          <span>{fmtDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="muted">{user.nama_lengkap}</span>
        </div>
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Menu utama">
        {all.filter((i) => BOTTOM.includes(i.to)).map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} aria-label={it.alert && count ? `${it.label}, ${count} perlu tindakan` : it.label}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.alert && count > 0 && <span className="nav-count" aria-hidden="true">{count}</span>}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMenu(true)}><Icon name="menu" /><span>Menu</span></button>
      </nav>

      <Modal open={menu} title="Menu" onClose={() => setMenu(false)} labelId="menu-title">
        <div className="sheet-list">
          {all.filter((i) => !BOTTOM.includes(i.to)).map((it) => <NavItem key={it.to} item={it} count={count} onClick={() => setMenu(false)} />)}
          <button type="button" className="nav-link" onClick={logout} style={{ background: 'none', border: 0, width: '100%' }}>
            <Icon name="keluar" /><span className="label">Keluar ({user.nama_lengkap})</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function Shell() {
  return (
    <AlertsProvider>
      <ShellInner />
    </AlertsProvider>
  );
}
