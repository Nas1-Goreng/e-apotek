import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useApi, useDebounced } from '../lib/useApi.js';
import { digits, fmtDate, fmtNum, todayISO } from '../lib/format.js';
import PageHead from '../components/PageHead.jsx';
import Icon from '../components/Icon.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import Field, { describe } from '../components/Field.jsx';
import Pager from '../components/Pager.jsx';
import { Async, EmptyState, Loading } from '../components/States.jsx';
import { useToast } from '../components/Toast.jsx';

const blankItem = () => ({ key: Math.random(), id_obat: '', jumlah: '1', aturan_pakai: '' });
const blank = () => ({ nama_pasien: '', nama_dokter: '', tgl_resep: todayISO(), catatan: '', items: [blankItem()] });

export default function Resep() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(search);
  const q = useApi(`/resep${qs({ status, q: dq, page })}`);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const detail = useApi(detailId ? `/resep/${detailId}` : null);
  const [del, setDel] = useState(null);
  const obat = useApi(open ? '/obat?per_page=500' : null);
  const filtered = status || dq;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setItem = (key, patch) => setForm((f) => ({ ...f, items: f.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError('');
    try {
      await api('/resep', { method: 'POST', body: { ...form, items: form.items.map(({ key, ...i }) => i) } });
      toast.ok('Resep dicatat. Proses pembayarannya dari menu Kasir.');
      setOpen(false);
      q.reload();
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.fields?.items || (Object.keys(err.fields || {}).length ? '' : err.message));
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try { await api(`/resep/${del.id}`, { method: 'DELETE' }); toast.ok('Resep dihapus.'); q.reload(); }
    catch (err) { toast.bad(err.message); }
    finally { setBusy(false); setDel(null); setDetailId(null); }
  }

  return (
    <>
      <PageHead title="Resep" desc="Resep dokter yang masuk. Resep berstatus menunggu bisa dimuat langsung di kasir.">
        <button type="button" className="btn" onClick={() => { setForm(blank()); setErrors({}); setFormError(''); setOpen(true); }}><Icon name="plus" size={18} />Resep baru</button>
      </PageHead>

      <div className="toolbar">
        <div className="field grow search-wrap">
          <label className="sr-only" htmlFor="r-cari">Cari pasien atau dokter</label>
          <Icon name="cari" size={18} />
          <input id="r-cari" type="search" className="input" placeholder="Cari nama pasien atau dokter" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="field">
          <label className="sr-only" htmlFor="r-status">Status</label>
          <select id="r-status" className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Semua status</option><option value="menunggu">Menunggu</option><option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      <div className="card flush">
        <Async q={q}>
          {(d) => d.items.length === 0 ? (
            <EmptyState title={filtered ? 'Tidak ada resep yang cocok' : 'Belum ada resep'}>{filtered ? 'Ubah kata kunci atau status.' : 'Catat resep pertama dengan tombol Resep baru.'}</EmptyState>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Pasien</th><th>Dokter</th><th>Tanggal</th><th className="num">Obat</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                  <tbody>
                    {d.items.map((r) => (
                      <tr key={r.id}>
                        <td className="cell-main"><div className="row-main">{r.nama_pasien}</div><div className="row-sub">Dicatat {r.pencatat}</div></td>
                        <td data-label="Dokter">{r.nama_dokter}</td>
                        <td data-label="Tanggal">{fmtDate(r.tgl_resep)}</td>
                        <td data-label="Obat" className="num">{r.jumlah_obat}</td>
                        <td data-label="Status"><span className={`chip ${r.status === 'menunggu' ? 'warn' : ''}`}>{r.status === 'menunggu' ? 'Menunggu' : 'Selesai'}</span></td>
                        <td className="cell-actions"><div className="actions">
                          <button type="button" className="btn soft small" onClick={() => setDetailId(r.id)}><Icon name="lihat" size={18} />Detail</button>
                          {r.status === 'menunggu' && <Link className="btn small" to={`/kasir?resep=${r.id}`}>Proses di kasir</Link>}
                        </div></td>
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

      <Modal open={open} wide title="Resep baru" onClose={() => setOpen(false)} labelId="resep-title"
        footer={<><button type="button" className="btn ghost" onClick={() => setOpen(false)}>Batal</button><button type="submit" form="resep-form" className="btn" disabled={busy}>{busy ? 'Menyimpan' : 'Simpan resep'}</button></>}>
        <form id="resep-form" className="form-grid" onSubmit={save} noValidate>
          <div className="field-row">
            <Field id="r-pasien" label="Nama pasien" error={errors.nama_pasien}><input id="r-pasien" className="input" maxLength={100} value={form.nama_pasien} onChange={set('nama_pasien')} {...describe('r-pasien', errors.nama_pasien)} /></Field>
            <Field id="r-dokter" label="Nama dokter" error={errors.nama_dokter}><input id="r-dokter" className="input" maxLength={100} value={form.nama_dokter} onChange={set('nama_dokter')} {...describe('r-dokter', errors.nama_dokter)} /></Field>
          </div>
          <Field id="r-tgl" label="Tanggal resep" error={errors.tgl_resep}><input id="r-tgl" type="date" className="input" value={form.tgl_resep} onChange={set('tgl_resep')} {...describe('r-tgl', errors.tgl_resep)} /></Field>

          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            <legend className="label" style={{ fontWeight: 650, marginBottom: 8 }}>Obat dalam resep</legend>
            {obat.loading && <Loading text="Memuat daftar obat" />}
            {obat.error && <div className="alert bad" role="alert">{obat.error.message}</div>}
            {form.items.map((it, idx) => (
              <div className="card" key={it.key} style={{ padding: 14, display: 'grid', gap: 10 }}>
                <div className="field-row">
                  <Field id={`i-obat-${it.key}`} label={`Obat ${idx + 1}`}>
                    <select id={`i-obat-${it.key}`} className="select" value={it.id_obat} onChange={(e) => setItem(it.key, { id_obat: e.target.value })}>
                      <option value="">Pilih obat</option>
                      {(obat.data?.items || []).map((o) => <option key={o.id} value={o.id}>{o.nama_obat} (stok {fmtNum(o.stok)})</option>)}
                    </select>
                  </Field>
                  <Field id={`i-jml-${it.key}`} label="Jumlah"><input id={`i-jml-${it.key}`} className="input" inputMode="numeric" value={it.jumlah} onChange={(e) => setItem(it.key, { jumlah: digits(e.target.value) })} /></Field>
                </div>
                <Field id={`i-aturan-${it.key}`} label="Aturan pakai (opsional)"><input id={`i-aturan-${it.key}`} className="input" maxLength={150} value={it.aturan_pakai} onChange={(e) => setItem(it.key, { aturan_pakai: e.target.value })} placeholder="Contoh: 3 kali sehari sesudah makan" /></Field>
                {form.items.length > 1 && <div><button type="button" className="btn danger small" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((x) => x.key !== it.key) }))}><Icon name="hapus" size={18} />Hapus baris obat {idx + 1}</button></div>}
              </div>
            ))}
            <div><button type="button" className="btn soft" onClick={() => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }))}><Icon name="plus" size={18} />Tambah obat</button></div>
          </fieldset>
          <Field id="r-catatan" label="Catatan (opsional)" error={errors.catatan}><textarea id="r-catatan" className="textarea" maxLength={255} value={form.catatan} onChange={set('catatan')} /></Field>
          {formError && <div className="alert bad" role="alert"><Icon name="awas" size={18} />{formError}</div>}
        </form>
      </Modal>

      <Modal open={!!detailId} wide title="Detail resep" onClose={() => setDetailId(null)} labelId="detail-title"
        footer={detail.data && (<>
          {detail.data.status === 'menunggu' && <button type="button" className="btn danger" onClick={() => setDel(detail.data)}><Icon name="hapus" size={18} />Hapus resep</button>}
          {detail.data.status === 'menunggu' && <Link className="btn" to={`/kasir?resep=${detail.data.id}`}>Proses di kasir</Link>}
          <button type="button" className="btn ghost" onClick={() => setDetailId(null)}>Tutup</button>
        </>)}>
        <Async q={detail}>
          {(r) => (
            <div className="form-grid">
              <div><div className="row-main">{r.nama_pasien}</div><div className="row-sub">Dokter {r.nama_dokter}, {fmtDate(r.tgl_resep)}, dicatat {r.pencatat}</div></div>
              {r.catatan && <p>{r.catatan}</p>}
              <div className="table-wrap"><table className="table">
                <thead><tr><th>Obat</th><th className="num">Jumlah</th><th>Aturan pakai</th><th>Ketersediaan</th></tr></thead>
                <tbody>{r.items.map((i) => (
                  <tr key={i.id}>
                    <td className="cell-main row-main">{i.nama_obat}</td>
                    <td data-label="Jumlah" className="num">{i.jumlah} {i.satuan}</td>
                    <td data-label="Aturan pakai">{i.aturan_pakai || <span className="muted">Tidak dicatat</span>}</td>
                    <td data-label="Ketersediaan">{i.kedaluwarsa ? <span className="chip bad">Kedaluwarsa</span> : i.stok < i.jumlah ? <span className="chip warn">Stok {i.stok}, kurang</span> : <span className="chip">Tersedia</span>}</td>
                  </tr>))}</tbody>
              </table></div>
            </div>
          )}
        </Async>
      </Modal>

      <ConfirmDialog open={!!del} title="Hapus resep" busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        {del && `Hapus resep untuk ${del.nama_pasien}? Tindakan ini tidak bisa dibatalkan.`}
      </ConfirmDialog>
    </>
  );
}
