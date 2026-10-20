import { useState } from 'react';
import { useAuth } from '../context/Auth.jsx';
import Icon from '../components/Icon.jsx';
import Field, { describe } from '../components/Field.jsx';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  document.title = 'Masuk | E-Apotek';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(Object.keys(err.fields || {}).length ? '' : err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <section className="login-art on-dark">
        <div className="brand">
          <span className="brand-mark"><Icon name="obat" size={22} /></span>
          <span className="brand-name">E-Apotek</span>
        </div>
        <div>
          <h1>Stok, resep, dan kasir apotek dalam satu tempat.</h1>
          <p>Masuk untuk mengelola obat, mencatat resep, dan menyelesaikan transaksi penjualan.</p>
        </div>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit} noValidate>
          <div>
            <h2>Masuk</h2>
            <p className="muted">Gunakan akun dari admin apotek.</p>
          </div>
          {message && <div className="alert bad" role="alert"><Icon name="awas" size={18} />{message}</div>}
          <Field id="username" label="Nama pengguna" error={errors.username}>
            <input id="username" className="input mint" autoComplete="username" value={form.username} onChange={set('username')} {...describe('username', errors.username)} />
          </Field>
          <Field id="password" label="Kata sandi" error={errors.password}>
            <input id="password" type="password" className="input mint" autoComplete="current-password" value={form.password} onChange={set('password')} {...describe('password', errors.password)} />
          </Field>
          <button className="btn pill" type="submit" disabled={busy}>{busy ? 'Memeriksa akun' : 'Masuk ke E-Apotek'}</button>
        </form>
      </section>
    </div>
  );
}
