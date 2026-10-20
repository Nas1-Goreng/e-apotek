import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { fmtDate, fmtDateTime, fmtNum, fmtRp, parseDate } from '../lib/format.js';
import PageHead from '../components/PageHead.jsx';
import { Async, EmptyState } from '../components/States.jsx';
import { BarChart, Gauge } from '../components/Charts.jsx';

const isUrgent = (t) => /lalu|hari ini|habis/.test(t);

export default function Dashboard() {
  const q = useApi('/dashboard');
  return (
    <>
      <PageHead title="Dashboard" desc="Yang perlu ditangani hari ini, lalu ringkasan penjualan." />
      <Async q={q}>{(d) => <Body d={d} />}</Async>
    </>
  );
}

function Body({ d }) {
  const hari = d.grafik.map((g, i) => ({
    label: parseDate(g.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
    value: g.pendapatan,
    open: i === d.grafik.length - 1,
  }));
  const adaPenjualan = d.grafik.some((g) => g.pendapatan > 0);
  const s = d.stok;

  return (
    <div className="dash">
      <section className="card c-8" aria-labelledby="h-todo">
        <div className="card-head">
          <div>
            <h2 id="h-todo">Perlu ditindak</h2>
            <p>Stok di bawah batas, atau kedaluwarsa dalam waktu dekat.</p>
          </div>
          <Link className="btn soft small" to="/peringatan">Semua peringatan</Link>
        </div>
        {d.perlu_tindakan.length === 0 ? (
          s.total === 0 ? (
            <EmptyState title="Belum ada data obat" action={<Link className="btn" to="/obat">Tambah obat</Link>}>
              Peringatan muncul setelah obat dicatat di menu Obat.
            </EmptyState>
          ) : (
            <EmptyState title="Semua stok aman">Tidak ada obat dengan stok menipis atau tanggal kedaluwarsa yang dekat.</EmptyState>
          )
        ) : (
          <ul className="todo-list">
            {d.perlu_tindakan.map((r) => (
              <li className="todo-item" key={r.id}>
                <div>
                  <div className="name">{r.nama_obat}</div>
                  <div className="row-sub">Stok {fmtNum(r.stok)} {r.satuan}</div>
                </div>
                <div className="chips">
                  {r.alasan.map((a) => <span key={a} className={`chip ${isUrgent(a) ? 'bad' : 'warn'}`}>{a}</span>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hero c-4 on-dark" aria-labelledby="h-hero">
        <div>
          <div className="label" id="h-hero">Penjualan hari ini</div>
          <div className="big">{fmtRp(d.hari_ini.pendapatan)}</div>
          <div className="sub">Kemarin {fmtRp(d.kemarin.pendapatan)}</div>
        </div>
        <div className="figures">
          <div><strong>{fmtNum(d.hari_ini.transaksi)}</strong><span className="sub">transaksi</span></div>
          <div><strong>{fmtNum(d.hari_ini.item)}</strong><span className="sub">item terjual</span></div>
        </div>
        <Link className="btn on-mint pill" to="/kasir">Buka kasir</Link>
      </section>

      <section className="card c-7" aria-labelledby="h-chart">
        <div className="card-head"><div><h2 id="h-chart">Penjualan harian, 7 hari terakhir</h2><p>Total bayar per hari dalam Rupiah.</p></div></div>
        {adaPenjualan ? (
          <>
            <BarChart data={hari} title="Penjualan harian 7 hari terakhir" />
            <div className="chart-legend">
              <span><span className="legend-key solid" />Hari selesai</span>
              <span><span className="legend-key hatch" />Hari ini, belum final</span>
            </div>
          </>
        ) : (
          <EmptyState title="Belum ada penjualan minggu ini">Grafik terisi setelah transaksi pertama dibuat di menu Kasir.</EmptyState>
        )}
      </section>

      <section className="card c-5" aria-labelledby="h-gauge">
        <div className="card-head"><div><h2 id="h-gauge">Kondisi stok obat</h2><p>Obat yang aman dibanding yang perlu tindakan.</p></div></div>
        {s.total === 0 ? (
          <EmptyState title="Belum ada obat">Data stok tampil setelah obat ditambahkan.</EmptyState>
        ) : (
          <>
            <Gauge safe={s.aman} total={s.total} label="aman" />
            <div className="gauge-legend">
              <div><span><span className="legend-key solid" />Aman</span><strong>{s.aman}</strong></div>
              <div><span><span className="legend-key hatch" />Perlu tindakan</span><strong>{s.perlu_tindakan}</strong></div>
              <div className="muted"><span>Stok menipis</span><span>{s.kritis}</span></div>
              <div className="muted"><span>Segera kedaluwarsa</span><span>{s.segera}</span></div>
              <div className="muted"><span>Sudah kedaluwarsa</span><span>{s.kedaluwarsa}</span></div>
            </div>
          </>
        )}
      </section>

      <section className="card c-5" aria-labelledby="h-resep">
        <div className="card-head">
          <div><h2 id="h-resep">Resep menunggu</h2><p>{d.resep_menunggu.jumlah} resep belum diproses.</p></div>
          <Link className="btn soft small" to="/resep">Semua resep</Link>
        </div>
        {d.resep_menunggu.items.length === 0 ? (
          <EmptyState title="Tidak ada resep yang menunggu">Resep baru dicatat di menu Resep.</EmptyState>
        ) : (
          <ul className="mini-list">
            {d.resep_menunggu.items.map((r) => (
              <li key={r.id}>
                <div><div className="row-main">{r.nama_pasien}</div><div className="row-sub">{r.nama_dokter}, {fmtDate(r.tgl_resep)}</div></div>
                <Link className="btn soft small" to={`/kasir?resep=${r.id}`}>Proses</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card c-7" aria-labelledby="h-trx">
        <div className="card-head">
          <div><h2 id="h-trx">Transaksi terakhir</h2></div>
          <Link className="btn soft small" to="/riwayat">Riwayat</Link>
        </div>
        {d.transaksi_terakhir.length === 0 ? (
          <EmptyState title="Belum ada transaksi">Transaksi yang selesai di kasir muncul di sini.</EmptyState>
        ) : (
          <ul className="mini-list">
            {d.transaksi_terakhir.map((t) => (
              <li key={t.id}>
                <div><div className="row-main">Nota #{t.id}</div><div className="row-sub">{fmtDateTime(t.tgl_transaksi)}, {t.kasir}</div></div>
                <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <strong>{fmtRp(t.total_bayar)}</strong>
                  <Link className="btn soft small" to={`/nota/${t.id}`}>Nota</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
