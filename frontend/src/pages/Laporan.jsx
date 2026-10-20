import { useState } from 'react';
import { Link } from 'react-router-dom';
import { qs } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtDate, fmtDateTime, fmtNum, fmtRp, parseDate, todayISO } from '../lib/format.js';
import PageHead from '../components/PageHead.jsx';
import Icon from '../components/Icon.jsx';
import { BarChart } from '../components/Charts.jsx';
import { Async, EmptyState } from '../components/States.jsx';

const PERIODE = [['harian', 'Harian'], ['mingguan', 'Mingguan'], ['bulanan', 'Bulanan']];

export default function Laporan() {
  const [periode, setPeriode] = useState('harian');
  const [tanggal, setTanggal] = useState(todayISO());
  const q = useApi(`/laporan${qs({ periode, tanggal })}`);

  return (
    <>
      <PageHead title="Laporan penjualan" desc="Pendapatan dan obat terlaris per hari, minggu, atau bulan.">
        <button type="button" className="btn" onClick={() => window.print()} disabled={!q.data}><Icon name="cetak" size={18} />Cetak laporan</button>
      </PageHead>

      <div className="toolbar no-print">
        <div className="field" style={{ flex: '0 1 auto' }}>
          <span className="label" id="lbl-periode">Periode</span>
          <div className="seg" role="radiogroup" aria-labelledby="lbl-periode">
            {PERIODE.map(([v, l]) => (
              <label key={v}><input type="radio" name="periode" value={v} checked={periode === v} onChange={() => setPeriode(v)} /><span>{l}</span></label>
            ))}
          </div>
        </div>
        <div className="field" style={{ flex: '0 1 220px' }}>
          <label htmlFor="tgl-lap">{periode === 'bulanan' ? 'Tanggal dalam bulan' : periode === 'mingguan' ? 'Tanggal dalam minggu' : 'Tanggal'}</label>
          <input id="tgl-lap" type="date" className="input" value={tanggal} max={todayISO()} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
        </div>
      </div>

      <Async q={q}>
        {(d) => {
          const rentang = d.dari === d.sampai ? fmtDate(d.dari, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `${fmtDate(d.dari)} sampai ${fmtDate(d.sampai)}`;
          const r = d.ringkasan;
          const chart = d.per_hari.map((h) => ({
            label: periode === 'bulanan' ? String(parseDate(h.tanggal).getDate()) : parseDate(h.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
            value: h.pendapatan,
            open: h.tanggal === todayISO(),
          }));
          return (
            <>
              <p className="muted" style={{ marginBottom: 16 }}>Periode: <strong style={{ color: 'var(--ink)' }}>{rentang}</strong></p>
              {r.transaksi === 0 ? (
                <div className="card"><EmptyState title="Belum ada penjualan pada periode ini" action={<Link className="btn soft no-print" to="/kasir">Buka kasir</Link>}>Pilih tanggal lain atau selesaikan transaksi di kasir.</EmptyState></div>
              ) : (
                <>
                  <div className="stat-row">
                    <div className="stat hero-stat on-dark"><div className="label">Pendapatan</div><div className="value">{fmtRp(r.pendapatan)}</div></div>
                    <div className="stat"><div className="label">Transaksi</div><div className="value">{fmtNum(r.transaksi)}</div></div>
                    <div className="stat"><div className="label">Item terjual</div><div className="value">{fmtNum(r.item)}</div></div>
                    <div className="stat"><div className="label">Rata-rata per transaksi</div><div className="value">{fmtRp(r.rata_rata)}</div></div>
                  </div>

                  {d.per_hari.length > 1 && (
                    <section className="card" style={{ marginBottom: 16 }} aria-labelledby="h-lap-chart">
                      <div className="card-head"><div><h2 id="h-lap-chart">Pendapatan per hari</h2><p>Hari ini diberi garis miring karena belum final.</p></div></div>
                      <BarChart data={chart} title={`Pendapatan per hari, ${rentang}`} valueName="Pendapatan" />
                    </section>
                  )}

                  <div className="report-grid">
                    <section className="card flush" aria-labelledby="h-terlaris">
                      <div style={{ padding: '18px 20px 12px' }}><h2 id="h-terlaris">Obat terlaris</h2><p className="muted">Berdasarkan jumlah terjual, 10 teratas.</p></div>
                      <div className="table-wrap"><table className="table">
                        <thead><tr><th>Obat</th><th className="num">Terjual</th><th className="num">Pendapatan</th></tr></thead>
                        <tbody>{d.terlaris.map((o) => (
                          <tr key={o.id_obat}><td className="cell-main row-main">{o.nama_obat}</td><td data-label="Terjual" className="num">{fmtNum(o.jumlah)} {o.satuan}</td><td data-label="Pendapatan" className="num">{fmtRp(o.pendapatan)}</td></tr>
                        ))}</tbody>
                      </table></div>
                    </section>

                    {d.per_hari.length > 1 && (
                      <section className="card flush" aria-labelledby="h-hari">
                        <div style={{ padding: '18px 20px 12px' }}><h2 id="h-hari">Rincian per hari</h2></div>
                        <div className="table-wrap"><table className="table">
                          <thead><tr><th>Tanggal</th><th className="num">Transaksi</th><th className="num">Item</th><th className="num">Pendapatan</th></tr></thead>
                          <tbody>{d.per_hari.map((h) => (
                            <tr key={h.tanggal}><td className="cell-main row-main">{fmtDate(h.tanggal, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td data-label="Transaksi" className="num">{h.transaksi}</td><td data-label="Item" className="num">{h.item}</td><td data-label="Pendapatan" className="num">{fmtRp(h.pendapatan)}</td></tr>
                          ))}</tbody>
                        </table></div>
                      </section>
                    )}
                  </div>

                  <section className="card flush" aria-labelledby="h-daftar">
                    <div style={{ padding: '18px 20px 12px' }}>
                      <h2 id="h-daftar">Daftar transaksi</h2>
                      {d.transaksi_terpotong && <p className="muted">Hanya 500 transaksi terbaru yang ditampilkan. Ringkasan di atas tetap menghitung semuanya.</p>}
                    </div>
                    <div className="table-wrap"><table className="table">
                      <thead><tr><th>Nota</th><th>Waktu</th><th>Kasir</th><th className="num">Total bayar</th><th className="no-print"><span className="sr-only">Aksi</span></th></tr></thead>
                      <tbody>{d.transaksi.map((t) => (
                        <tr key={t.id}><td className="cell-main row-main">#{t.id}</td><td data-label="Waktu">{fmtDateTime(t.tgl_transaksi)}</td><td data-label="Kasir">{t.kasir}</td><td data-label="Total bayar" className="num">{fmtRp(t.total_bayar)}</td>
                          <td className="cell-actions no-print"><div className="actions"><Link className="btn soft small" to={`/nota/${t.id}`}>Lihat nota</Link></div></td></tr>
                      ))}</tbody>
                    </table></div>
                  </section>
                </>
              )}
            </>
          );
        }}
      </Async>
    </>
  );
}
