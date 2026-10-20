import { useState } from 'react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtNum } from '../lib/format.js';
import PageHead from './PageHead.jsx';
import Icon from './Icon.jsx';
import Modal, { ConfirmDialog } from './Modal.jsx';
import Field, { describe } from './Field.jsx';
import { Async, EmptyState } from './States.jsx';
import { useToast } from './Toast.jsx';

// Satu komponen untuk kategori dan pemasok karena bentuk CRUD-nya sama.
export default function MasterCrud({ endpoint, title, desc, noun, nameKey, fields, emptyText }) {
  const q = useApi(endpoint);
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const open = (row) => {
    setEdit(row || {});
    setForm(Object.fromEntries(fields.map((f) => [f.key, row?.[f.key] ?? ''])));
    setErrors({});
  };

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api(edit.id ? `${endpoint}/${edit.id}` : endpoint, { method: edit.id ? 'PUT' : 'POST', body: form });
      toast.ok(`${noun} ${edit.id ? 'diperbarui' : 'ditambahkan'}.`);
      setEdit(null);
      q.reload();
    } catch (err) {
      setErrors(err.fields || {});
      if (!Object.keys(err.fields || {}).length) toast.bad(err.message);
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`${endpoint}/${del.id}`, { method: 'DELETE' });
      toast.ok(`${noun} dihapus.`);
      setDel(null);
      q.reload();
    } catch (err) {
      toast.bad(err.message);
      setDel(null);
    } finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title={title} desc={desc}>
        <button type="button" className="btn" onClick={() => open(null)}><Icon name="plus" size={18} />Tambah {noun.toLowerCase()}</button>
      </PageHead>
      <div className="card flush">
        <Async q={q}>
          {(d) => d.items.length === 0 ? (
            <EmptyState title={`Belum ada ${noun.toLowerCase()}`} action={<button type="button" className="btn" onClick={() => open(null)}>Tambah {noun.toLowerCase()}</button>}>{emptyText}</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr>{fields.map((f) => <th key={f.key}>{f.label}</th>)}<th className="num">Jumlah obat</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {d.items.map((r) => (
                    <tr key={r.id}>
                      {fields.map((f, i) => (
                        <td key={f.key} className={i === 0 ? 'cell-main row-main' : ''} data-label={f.label}>{r[f.key] || (i === 0 ? '' : <span className="muted">Belum diisi</span>)}</td>
                      ))}
                      <td className="num" data-label="Jumlah obat">{fmtNum(r.jumlah_obat)}</td>
                      <td className="cell-actions">
                        <div className="actions">
                          <button type="button" className="btn soft small" onClick={() => open(r)}><Icon name="edit" size={18} />Ubah</button>
                          <button type="button" className="btn danger small" onClick={() => setDel(r)}><Icon name="hapus" size={18} />Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Async>
      </div>

      <Modal open={!!edit} title={edit?.id ? `Ubah ${noun.toLowerCase()}` : `Tambah ${noun.toLowerCase()}`} onClose={() => setEdit(null)} labelId="master-title"
        footer={<><button type="button" className="btn ghost" onClick={() => setEdit(null)}>Batal</button><button type="submit" form="master-form" className="btn" disabled={busy}>{busy ? 'Menyimpan' : 'Simpan'}</button></>}>
        <form id="master-form" className="form-grid" onSubmit={save} noValidate>
          {fields.map((f) => (
            <Field key={f.key} id={`m-${f.key}`} label={f.label + (f.required ? '' : ' (opsional)')} error={errors[f.key] || (f.key === nameKey ? errors[f.key] : undefined)}>
              <input id={`m-${f.key}`} className="input" maxLength={f.max} value={form[f.key] ?? ''} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} {...describe(`m-${f.key}`, errors[f.key])} />
            </Field>
          ))}
        </form>
      </Modal>

      <ConfirmDialog open={!!del} title={`Hapus ${noun.toLowerCase()}`} busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        {del && `Hapus "${del[nameKey]}"? Tindakan ini tidak bisa dibatalkan.`}
      </ConfirmDialog>
    </>
  );
}
