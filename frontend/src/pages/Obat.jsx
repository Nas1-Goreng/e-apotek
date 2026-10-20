import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useApi, useDebounced } from '../lib/useApi.js';
import { digits, fmtDate, fmtNum, fmtRp } from '../lib/format.js';
import { useAlerts } from '../context/Alerts.jsx';
import PageHead from '../components/PageHead.jsx';
import Icon from '../components/Icon.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import Field, { describe } from '../components/Field.jsx';
import Pager from '../components/Pager.jsx';
import { StockChips } from '../components/Chips.jsx';
import { Async, EmptyState } from '../components/States.jsx';
import { useToast } from '../components/Toast.jsx';

const BLANK = { nama_obat: '', id_kategori: '', id_supplier: '', harga_jual: '', stok: '', satuan: '', tgl_expired: '' };

export default function Obat() {
  const [params] = useSearchParams();
  const toast = useToast();
  const alerts = useAlerts();
  const [search, setSearch] = useState(params.get('q') || '');
  const [kat, setKat] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(search);
  const q = useApi(`/obat${qs({ q: dq, id_kategori: kat, status, page })}`);
  const kategori = useApi('/kategori');
  const supplier = useApi('/supplier');

  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const filtered = dq || kat || status;

  const open = (row) => {
    setEdit(row || {});
    setForm(row ? {
      nama_obat: row.nama_obat, id_kategori: row.id_kategori, id_supplier: row.id_supplier ?? '',
      harga_jual: row.harga_jual, stok: row.stok, satuan: row.satuan, tgl_expired: row.tgl_expired,
    } : BLANK);
    setErrors({});
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const num = (k) => (e) => setForm((f) => ({ ...f, [k]: digits(e.target.value) }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = { ...form, id_supplier: form.id_supplier === '' ? null : form.id_supplier };
    try {
      await api(edit.id ? `/obat/${edit.id}` : '/obat', { method: edit.id ? 'PUT' : 'POST', body });
      toast.ok(edit.id ? 'Data obat diperbarui.' : 'Obat ditambahkan.');
      setEdit(null);
      q.reload(); alerts.refresh();
    } catch (err) {
      setErrors(err.fields || {});
      if (!Object.keys(err.fields || {}).length) toast.bad(err.message);
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/obat/${del.id}`, { method: 'DELETE' });
      toast.ok('Obat dihapus.');
      q.reload(); alerts.refresh();
    } catch (err) { toast.bad(err.message); }
    finally { setBusy(false); setDel(null); }
  }

  const noCategory = kategori.data && kategori.data.items.length === 0;

  return (
    <>
      <PageHead title="Obat" desc="Data obat, harga jual, stok, dan tanggal kedaluwarsa.">
        <button type="button" className="btn" onClick={() => open(null)} disabled={noCategory}><Icon name="plus" size={18} />Tambah obat</button>
      </PageHead>
      {noCategory && <div className="alert warn" style={{ marginBottom: 16 }}><Icon name="awas" size={18} />Obat butuh kategori. Tambahkan kategori lebih dulu di menu Kategori.</div>}

      <div className="toolbar">
        <div className="field grow search-wrap">
          <label className="sr-only" htmlFor="cari">Cari nama obat</label>
          <Icon name="cari" size={18} />
          <input id="cari" type="search" className="input" placeholder="Cari nama obat" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="field">
          <label className="sr-only" htmlFor="f-kat">Kategori</label>
          <select id="f-kat" className="select" value={kat} onChange={(e) => { setKat(e.target.value); setPage(1); }}>
            <option value="">Semua kategori</option>
            {(kategori.data?.items || []).map((k) => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="sr-only" htmlFor="f-status">Status stok</label>
          <select id="f-status" className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Semua status</option>
            <option value="kritis">Stok menipis</option>
            <option value="segera">Segera kedaluwarsa</option>
            <option value="kedaluwarsa">Sudah kedaluwarsa</option>
          </select>
        </div>
      </div>

      <div className="card flush">
        <Async q={q}>
          {(d) => d.items.length === 0 ? (
            <EmptyState title={filtered ? 'Tidak ada obat yang cocok' : 'Belum ada data obat'}
              action={filtered ? <button type="button" className="btn soft" onClick={() => { setSearch(''); setKat(''); setStatus(''); }}>Hapus filter</button> : !noCategory && <button type="button" className="btn" onClick={() => open(null)}>Tambah obat</button>}>
              {filtered ? 'Ubah kata kunci atau filter.' : 'Mulai dengan menambahkan obat pertama.'}
            </EmptyState>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Obat</th><th>Pemasok</th><th className="num">Harga jual</th><th className="num">Stok</th><th>Kedaluwarsa</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                  <tbody>
                    {d.items.map((r) => (
                      <tr key={r.id}>
                        <td className="cell-main"><div className="row-main">{r.nama_obat}</div><div className="row-sub">{r.nama_kategori}</div></td>
                        <td data-label="Pemasok">{r.nama_supplier || <span className="muted">Tanpa pemasok</span>}</td>
                        <td data-label="Harga jual" className="num">{fmtRp(r.harga_jual)}</td>
                        <td data-label="Stok" className="num">{fmtNum(r.stok)} {r.satuan}</td>
                        <td data-label="Kedaluwarsa">{fmtDate(r.tgl_expired)}</td>
                        <td data-label="Status"><StockChips row={r} /></td>
                        <td className="cell-actions">
                          <div className="actions">
                            <button type="button" className="btn soft small" onClick={() => open(r)} aria-label={`Ubah ${r.nama_obat}`}><Icon name="edit" size={18} />Ubah</button>
                            <button type="button" className="btn danger small" onClick={() => setDel(r)} aria-label={`Hapus ${r.nama_obat}`}><Icon name="hapus" size={18} />Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={d.page} perPage={d.per_page} total={d.total} onPage={setPage} />
            </>
          )}
        </Async>
      </div>

      <Modal open={!!edit} wide title={edit?.id ? 'Ubah obat' : 'Tambah obat'} onClose={() => setEdit(null)} labelId="obat-title"
        footer={<><button type="button" className="btn ghost" onClick={() => setEdit(null)}>Batal</button><button type="submit" form="obat-form" className="btn" disabled={busy}>{busy ? 'Menyimpan' : 'Simpan'}</button></>}>
        <form id="obat-form" className="form-grid" onSubmit={save} noValidate>
          <Field id="o-nama" label="Nama obat" error={errors.nama_obat}>
            <input id="o-nama" className="input" maxLength={150} value={form.nama_obat} onChange={set('nama_obat')} {...describe('o-nama', errors.nama_obat)} />
          </Field>
          <div className="field-row">
            <Field id="o-kat" label="Kategori" error={errors.id_kategori}>
              <select id="o-kat" className="select" value={form.id_kategori} onChange={set('id_kategori')} {...describe('o-kat', errors.id_kategori)}>
                <option value="">Pilih kategori</option>
                {(kategori.data?.items || []).map((k) => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
              </select>
            </Field>
            <Field id="o-sup" label="Pemasok (opsional)" error={errors.id_supplier}>
              <select id="o-sup" className="select" value={form.id_supplier} onChange={set('id_supplier')}>
                <option value="">Tanpa pemasok</option>
                {(supplier.data?.items || []).map((s) => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <Field id="o-harga" label="Harga jual (Rp)" error={errors.harga_jual}>
              <input id="o-harga" className="input" inputMode="numeric" value={form.harga_jual} onChange={num('harga_jual')} {...describe('o-harga', errors.harga_jual)} />
            </Field>
            <Field id="o-stok" label="Stok" error={errors.stok}>
              <input id="o-stok" className="input" inputMode="numeric" value={form.stok} onChange={num('stok')} {...describe('o-stok', errors.stok)} />
            </Field>
          </div>
          <div className="field-row">
            <Field id="o-satuan" label="Satuan" error={errors.satuan} hint="Contoh: strip, botol, tube, sachet.">
              <input id="o-satuan" className="input" maxLength={20} value={form.satuan} onChange={set('satuan')} {...describe('o-satuan', errors.satuan, true)} />
            </Field>
            <Field id="o-exp" label="Tanggal kedaluwarsa" error={errors.tgl_expired}>
              <input id="o-exp" type="date" className="input" value={form.tgl_expired} onChange={set('tgl_expired')} {...describe('o-exp', errors.tgl_expired)} />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!del} title="Hapus obat" busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        {del && `Hapus "${del.nama_obat}"? Obat yang sudah pernah dijual atau masuk resep tidak bisa dihapus.`}
      </ConfirmDialog>
    </>
  );
}
