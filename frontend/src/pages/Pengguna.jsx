import { useState } from 'react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtDate, roleLabel } from '../lib/format.js';
import { useAuth } from '../context/Auth.jsx';
import PageHead from '../components/PageHead.jsx';
import Icon from '../components/Icon.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import Field, { describe } from '../components/Field.jsx';
import { Async } from '../components/States.jsx';
import { useToast } from '../components/Toast.jsx';

const BLANK = { username: '', nama_lengkap: '', role: 'apoteker', password: '' };

export default function Pengguna() {
  const { user: me } = useAuth();
  const toast = useToast();
  const q = useApi('/users');
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const open = (row) => {
    setEdit(row || {});
    setForm(row ? { username: row.username, nama_lengkap: row.nama_lengkap, role: row.role, password: '' } : BLANK);
    setErrors({});
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await api(edit.id ? `/users/${edit.id}` : '/users', { method: edit.id ? 'PUT' : 'POST', body: form });
      toast.ok(edit.id ? 'Pengguna diperbarui.' : 'Pengguna ditambahkan.');
      setEdit(null); q.reload();
    } catch (err) {
      setErrors(err.fields || {});
      if (!Object.keys(err.fields || {}).length) toast.bad(err.message);
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try { await api(`/users/${del.id}`, { method: 'DELETE' }); toast.ok('Pengguna dihapus.'); q.reload(); }
    catch (err) { toast.bad(err.message); }
    finally { setBusy(false); setDel(null); }
  }

  return (
    <>
      <PageHead title="Pengguna" desc="Akun yang bisa masuk ke E-Apotek. Kata sandi disimpan dalam bentuk hash.">
        <button type="button" className="btn" onClick={() => open(null)}><Icon name="plus" size={18} />Tambah pengguna</button>
      </PageHead>
      <div className="card flush">
        <Async q={q}>
          {(d) => (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Nama</th><th>Nama pengguna</th><th>Peran</th><th>Dibuat</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {d.items.map((u) => (
                    <tr key={u.id}>
                      <td className="cell-main row-main">{u.nama_lengkap}{u.id === me.id && <span className="chip" style={{ marginLeft: 8 }}>Akun Anda</span>}</td>
                      <td data-label="Nama pengguna">{u.username}</td>
                      <td data-label="Peran"><span className={`chip ${u.role === 'admin' ? '' : 'plain'}`}>{roleLabel(u.role)}</span></td>
                      <td data-label="Dibuat">{fmtDate(u.created_at)}</td>
                      <td className="cell-actions"><div className="actions">
                        <button type="button" className="btn soft small" onClick={() => open(u)} aria-label={`Ubah ${u.nama_lengkap}`}><Icon name="edit" size={18} />Ubah</button>
                        {u.id !== me.id && <button type="button" className="btn danger small" onClick={() => setDel(u)} aria-label={`Hapus ${u.nama_lengkap}`}><Icon name="hapus" size={18} />Hapus</button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Async>
      </div>

      <Modal open={!!edit} title={edit?.id ? 'Ubah pengguna' : 'Tambah pengguna'} onClose={() => setEdit(null)} labelId="user-title"
        footer={<><button type="button" className="btn ghost" onClick={() => setEdit(null)}>Batal</button><button type="submit" form="user-form" className="btn" disabled={busy}>{busy ? 'Menyimpan' : 'Simpan'}</button></>}>
        <form id="user-form" className="form-grid" onSubmit={save} noValidate>
          <Field id="u-nama" label="Nama lengkap" error={errors.nama_lengkap}><input id="u-nama" className="input" maxLength={100} value={form.nama_lengkap} onChange={set('nama_lengkap')} {...describe('u-nama', errors.nama_lengkap)} /></Field>
          <Field id="u-user" label="Nama pengguna" error={errors.username}><input id="u-user" className="input" autoComplete="off" maxLength={50} value={form.username} onChange={set('username')} {...describe('u-user', errors.username)} /></Field>
          <Field id="u-role" label="Peran" error={errors.role}>
            <select id="u-role" className="select" value={form.role} onChange={set('role')}>
              <option value="apoteker">Apoteker / Kasir</option><option value="admin">Admin</option>
            </select>
          </Field>
          <Field id="u-pass" label={edit?.id ? 'Kata sandi baru (kosongkan jika tidak diganti)' : 'Kata sandi'} error={errors.password} hint="8 sampai 72 karakter.">
            <input id="u-pass" type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} {...describe('u-pass', errors.password, true)} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog open={!!del} title="Hapus pengguna" busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        {del && `Hapus akun "${del.username}"? Akun yang sudah punya transaksi atau resep tidak bisa dihapus.`}
      </ConfirmDialog>
    </>
  );
}
