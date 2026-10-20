import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useApi, useDebounced } from '../lib/useApi.js';
import { digits, fmtDate, fmtNum, fmtRp } from '../lib/format.js';
import { useAlerts } from '../context/Alerts.jsx';
import PageHead from '../components/PageHead.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import Field, { describe } from '../components/Field.jsx';
import { Async, EmptyState } from '../components/States.jsx';

export default function Kasir() {
  const nav = useNavigate();
  const alerts = useAlerts();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [kat, setKat] = useState('');
  const dq = useDebounced(search);
  const products = useApi(`/obat${qs({ q: dq, id_kategori: kat, per_page: 30 })}`);
  const kategori = useApi('/kategori');
  const reseps = useApi('/resep?status=menunggu&per_page=50');

  const [cart, setCart] = useState([]);
  const [resep, setResep] = useState(null);
  const [resepPick, setResepPick] = useState('');
  const [notes, setNotes] = useState([]);
  const [cash, setCash] = useState('');
  const [pane, setPane] = useState('pilih');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cashError, setCashError] = useState('');
  const [done, setDone] = useState(null);
  const autoLoaded = useRef(false);

  const total = useMemo(() => cart.reduce((s, i) => s + i.harga_jual * i.jumlah, 0), [cart]);
  const received = Number(digits(cash)) || 0;
  const change = received - total;
  const count = cart.reduce((s, i) => s + i.jumlah, 0);

  const sellable = (p) => (p.kedaluwarsa ? 'Kedaluwarsa' : p.stok === 0 ? 'Stok habis' : null);

  function add(p) {
    setError('');
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, jumlah: Math.min(i.stok, i.jumlah + 1) } : i));
      return [...c, { id: p.id, nama_obat: p.nama_obat, satuan: p.satuan, harga_jual: p.harga_jual, stok: p.stok, jumlah: 1 }];
    });
  }
  const setQty = (id, n) => setCart((c) => c.map((i) => (i.id === id ? { ...i, jumlah: Math.max(1, Math.min(i.stok, Number(n) || 1)) } : i)));
  const remove = (id) => setCart((c) => c.filter((i) => i.id !== id));

  async function loadResep(id) {
    setError('');
    try {
      const r = await api(`/resep/${id}`);
      if (r.status !== 'menunggu') { setError('Resep ini sudah diselesaikan.'); return; }
      const msgs = [];
      const lines = [];
      r.items.forEach((it) => {
        if (it.kedaluwarsa || it.stok === 0) { msgs.push(`${it.nama_obat} dilewati: ${it.kedaluwarsa ? 'sudah kedaluwarsa' : 'stok habis'}.`); return; }
        const qty = Math.min(it.jumlah, it.stok);
        if (qty < it.jumlah) msgs.push(`${it.nama_obat}: diminta ${it.jumlah}, stok hanya ${it.stok}.`);
        lines.push({ id: it.id_obat, nama_obat: it.nama_obat, satuan: it.satuan, harga_jual: it.harga_jual, stok: it.stok, jumlah: qty });
      });
      setCart(lines);
      setResep({ id: r.id, nama_pasien: r.nama_pasien });
      setNotes(msgs);
      setPane('keranjang');
    } catch (e) { setError(e.message); }
  }

  useEffect(() => {
    const id = params.get('resep');
    if (id && !autoLoaded.current) {
      autoLoaded.current = true;
      loadResep(id);
      setParams({}, { replace: true });
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  function releaseResep() { setResep(null); setNotes([]); setCart([]); }

  async function pay() {
    setError('');
    setCashError('');
    if (cart.length === 0) { setError('Keranjang masih kosong.'); return; }
    if (received < total) { setCashError('Uang diterima kurang dari total bayar.'); return; }
    setBusy(true);
    try {
      const r = await api('/penjualan', {
        method: 'POST',
        body: { items: cart.map((i) => ({ id_obat: i.id, jumlah: i.jumlah })), uang_diterima: received, id_resep: resep?.id ?? null },
      });
      setDone(r);
      setCart([]); setCash(''); setResep(null); setNotes([]); setResepPick('');
      products.reload(); reseps.reload(); alerts.refresh();
    } catch (e) {
      setError(e.message);
      products.reload();
    } finally { setBusy(false); }
  }

  const pickable = reseps.data?.items || [];

  return (
    <>
      <PageHead title="Kasir" desc="Pilih obat, atur jumlah, lalu catat pembayaran. Stok berkurang otomatis setelah transaksi selesai." />
      <div className="kasir-tabs no-print">
        <div className="seg" role="group" aria-label="Bagian kasir">
          <label><input type="radio" name="pane" checked={pane === 'pilih'} onChange={() => setPane('pilih')} /><span>Pilih obat</span></label>
          <label><input type="radio" name="pane" checked={pane === 'keranjang'} onChange={() => setPane('keranjang')} /><span>Keranjang ({count})</span></label>
        </div>
      </div>

      <div className="kasir" data-active={pane}>
        <section className="card flush" data-pane="pilih" aria-label="Daftar obat">
          <div style={{ padding: 16 }}>
            <div className="toolbar" style={{ marginBottom: 0 }}>
              <div className="field grow search-wrap">
                <label className="sr-only" htmlFor="cari-obat">Cari obat</label>
                <Icon name="cari" size={18} />
                <input id="cari-obat" className="input" type="search" placeholder="Cari nama obat" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="field">
                <label className="sr-only" htmlFor="kat-kasir">Kategori</label>
                <select id="kat-kasir" className="select" value={kat} onChange={(e) => setKat(e.target.value)}>
                  <option value="">Semua kategori</option>
                  {(kategori.data?.items || []).map((k) => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                </select>
              </div>
            </div>
          </div>
          <Async q={products}>
            {(d) => d.items.length === 0 ? (
              <EmptyState title={dq || kat ? 'Tidak ada obat yang cocok' : 'Belum ada data obat'}>
                {dq || kat ? 'Ubah kata kunci atau kategori.' : 'Tambahkan obat di menu Obat lebih dulu.'}
              </EmptyState>
            ) : (
              <>
                {d.items.map((p) => {
                  const block = sellable(p);
                  return (
                    <div className="product-row" key={p.id}>
                      <div className="product-info">
                        <div className="row-main">{p.nama_obat}</div>
                        <div className="row-sub">{p.nama_kategori}, kedaluwarsa {fmtDate(p.tgl_expired)}</div>
                        <div className="chips" style={{ marginTop: 4 }}>
                          <span className={`chip ${p.stok_kritis ? 'warn' : 'plain'}`}>Stok {fmtNum(p.stok)} {p.satuan}</span>
                          {block && <span className="chip bad">{block}</span>}
                          {!block && p.segera_kedaluwarsa && <span className="chip warn">Segera kedaluwarsa</span>}
                        </div>
                      </div>
                      <div className="product-price">{fmtRp(p.harga_jual)}</div>
                      <button type="button" className="btn small" disabled={!!block} onClick={() => add(p)} aria-label={`Tambah ${p.nama_obat} ke keranjang`}>
                        <Icon name="plus" size={18} />Tambah
                      </button>
                    </div>
                  );
                })}
                {d.total > d.items.length && <p className="muted" style={{ padding: 16 }}>Menampilkan {d.items.length} dari {d.total} obat. Persempit pencarian untuk melihat yang lain.</p>}
              </>
            )}
          </Async>
        </section>

        <section className="card cart" data-pane="keranjang" aria-labelledby="h-cart">
          <div className="card-head"><h2 id="h-cart">Keranjang</h2><span className="chip">{count} item</span></div>

          {resep ? (
            <div className="alert ok" style={{ marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Resep #{resep.id}, pasien {resep.nama_pasien}</span>
              <button type="button" className="btn ghost small" onClick={releaseResep}>Lepas resep</button>
            </div>
          ) : (
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <div className="field">
                <label htmlFor="pick-resep">Muat dari resep</label>
                <select id="pick-resep" className="select" value={resepPick} onChange={(e) => setResepPick(e.target.value)} disabled={pickable.length === 0}>
                  <option value="">{pickable.length === 0 ? 'Tidak ada resep menunggu' : 'Pilih resep'}</option>
                  {pickable.map((r) => <option key={r.id} value={r.id}>#{r.id} {r.nama_pasien}</option>)}
                </select>
              </div>
              <button type="button" className="btn soft" disabled={!resepPick} onClick={() => loadResep(resepPick)}>Muat resep</button>
            </div>
          )}
          {notes.length > 0 && <div className="alert warn" role="status" style={{ marginBottom: 12 }}><Icon name="awas" size={18} /><div>{notes.map((n) => <div key={n}>{n}</div>)}</div></div>}

          {cart.length === 0 ? (
            <EmptyState title="Keranjang kosong">
              Pilih obat di daftar{pickable.length ? ' atau muat dari resep' : ''}.
            </EmptyState>
          ) : (
            <div>
              {cart.map((i) => (
                <div className="cart-line" key={i.id}>
                  <div><div className="row-main">{i.nama_obat}</div><div className="row-sub">{fmtRp(i.harga_jual)} per {i.satuan}, stok {fmtNum(i.stok)}</div></div>
                  <strong>{fmtRp(i.harga_jual * i.jumlah)}</strong>
                  <div className="line-actions">
                    <div className="stepper">
                      <button type="button" onClick={() => setQty(i.id, i.jumlah - 1)} disabled={i.jumlah <= 1} aria-label={`Kurangi ${i.nama_obat}`}><Icon name="minus" size={18} /></button>
                      <input inputMode="numeric" value={i.jumlah} onChange={(e) => setQty(i.id, digits(e.target.value))} aria-label={`Jumlah ${i.nama_obat}`} />
                      <button type="button" onClick={() => setQty(i.id, i.jumlah + 1)} disabled={i.jumlah >= i.stok} aria-label={`Tambah ${i.nama_obat}`}><Icon name="plus" size={18} /></button>
                    </div>
                    <button type="button" className="btn danger small" onClick={() => remove(i.id)} aria-label={`Hapus ${i.nama_obat} dari keranjang`}><Icon name="hapus" size={18} />Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="totals">
            <div className="row"><span>Total bayar</span><span className="grand">{fmtRp(total)}</span></div>
            <Field id="uang" label="Uang diterima" error={cashError}>
              <input id="uang" className="input" inputMode="numeric" placeholder="0" value={cash ? fmtNum(received) : ''} onChange={(e) => { setCash(digits(e.target.value)); setCashError(''); }} {...describe('uang', cashError)} />
            </Field>
            <div className="quick-cash">
              <button type="button" className="btn soft small" disabled={total === 0} onClick={() => setCash(String(total))}>Uang pas</button>
              {[50000, 100000].map((n) => <button key={n} type="button" className="btn soft small" onClick={() => setCash(String(n))}>{fmtRp(n)}</button>)}
            </div>
            <div className="row"><span>Kembalian</span><strong>{received >= total && total > 0 ? fmtRp(change) : 'Belum cukup'}</strong></div>
            {error && <div className="alert bad" role="alert"><Icon name="awas" size={18} />{error}</div>}
            <button type="button" className="btn pill block" onClick={pay} disabled={busy || cart.length === 0}>{busy ? 'Menyimpan transaksi' : 'Selesaikan transaksi'}</button>
          </div>
        </section>
      </div>

      <Modal open={!!done} title="Transaksi selesai" onClose={() => setDone(null)} labelId="done-title"
        footer={done && (<><button type="button" className="btn ghost" onClick={() => setDone(null)}>Transaksi baru</button><button type="button" className="btn" onClick={() => nav(`/nota/${done.id}`)}>Lihat dan cetak nota</button></>)}>
        {done && (
          <div className="form-grid">
            <p>Nota #{done.id} tersimpan dan stok sudah dikurangi.</p>
            <div className="stat"><div className="label">Kembalian</div><div className="value">{fmtRp(done.kembalian)}</div></div>
            <p className="muted">Total {fmtRp(done.total_bayar)}, uang diterima {fmtRp(done.uang_diterima)}. <Link to="/riwayat">Lihat riwayat</Link></p>
          </div>
        )}
      </Modal>
    </>
  );
}
