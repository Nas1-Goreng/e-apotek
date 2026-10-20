import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { fmtDate, fmtNum } from '../lib/format.js';
import PageHead from '../components/PageHead.jsx';
import { Async, EmptyState } from '../components/States.jsx';

function Section({ id, title, desc, rows, empty, cols }) {
  return (
    <section className="card flush" aria-labelledby={id} style={{ marginBottom: 16 }}>
      <div style={{ padding: '18px 20px 12px' }}>
        <h2 id={id}>{title} <span className="chip plain">{rows.length}</span></h2>
        <p className="muted">{desc}</p>
      </div>
      {rows.length === 0 ? <EmptyState title={empty} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Obat</th>{cols.map((c) => <th key={c.label} className={c.num ? 'num' : ''}>{c.label}</th>)}<th><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="cell-main"><div className="row-main">{r.nama_obat}</div><div className="row-sub">{r.nama_kategori}</div></td>
                  {cols.map((c) => <td key={c.label} data-label={c.label} className={c.num ? 'num' : ''}>{c.render(r)}</td>)}
                  <td className="cell-actions"><div className="actions"><Link className="btn soft small" to={`/obat?q=${encodeURIComponent(r.nama_obat)}`}>Buka di data obat</Link></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Peringatan() {
  const q = useApi('/peringatan');
  return (
    <>
      <PageHead title="Peringatan stok" desc="Obat yang perlu dipesan ulang atau dipisahkan dari rak penjualan." />
      <Async q={q}>
        {(d) => {
          const stok = { label: 'Stok', num: true, render: (r) => <strong>{fmtNum(r.stok)} {r.satuan}</strong> };
          const exp = { label: 'Kedaluwarsa', render: (r) => fmtDate(r.tgl_expired) };
          const sisa = { label: 'Sisa waktu', render: (r) => (r.hari_ke_kedaluwarsa < 0 ? <span className="chip bad">Lewat {Math.abs(r.hari_ke_kedaluwarsa)} hari</span> : <span className="chip warn">{r.hari_ke_kedaluwarsa} hari lagi</span>) };
          return (
            <>
              <Section id="p-exp" title="Sudah kedaluwarsa" desc="Jangan dijual. Kasir menolak transaksi untuk obat ini." rows={d.kedaluwarsa} empty="Tidak ada obat yang sudah kedaluwarsa." cols={[exp, sisa, stok]} />
              <Section id="p-kritis" title="Stok menipis" desc={`Stok di bawah ${d.ambang.stok}.`} rows={d.stok_kritis} empty="Tidak ada obat dengan stok menipis." cols={[stok, exp]} />
              <Section id="p-segera" title="Segera kedaluwarsa" desc={`Kedaluwarsa dalam ${d.ambang.hari} hari ke depan.`} rows={d.segera_kedaluwarsa} empty="Tidak ada obat yang dekat masa kedaluwarsa." cols={[exp, sisa, stok]} />
            </>
          );
        }}
      </Async>
    </>
  );
}
