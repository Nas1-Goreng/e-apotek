import { useState } from 'react';
import { Link } from 'react-router-dom';
import { qs } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtDateTime, fmtNum, fmtRp } from '../lib/format.js';
import { useAuth } from '../context/Auth.jsx';
import PageHead from '../components/PageHead.jsx';
import Pager from '../components/Pager.jsx';
import { Async, EmptyState } from '../components/States.jsx';

export default function Riwayat() {
  const { user } = useAuth();
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [page, setPage] = useState(1);
  const q = useApi(`/penjualan${qs({ dari, sampai, page })}`);
  const filtered = dari || sampai;

  return (
    <>
      <PageHead title="Riwayat penjualan" desc={user.role === 'admin' ? 'Semua transaksi dari seluruh kasir.' : 'Transaksi yang Anda selesaikan.'} />
      <div className="toolbar">
        <div className="field"><label htmlFor="dari">Dari tanggal</label><input id="dari" type="date" className="input" value={dari} onChange={(e) => { setDari(e.target.value); setPage(1); }} /></div>
        <div className="field"><label htmlFor="sampai">Sampai tanggal</label><input id="sampai" type="date" className="input" value={sampai} onChange={(e) => { setSampai(e.target.value); setPage(1); }} /></div>
        {filtered && <button type="button" className="btn ghost" onClick={() => { setDari(''); setSampai(''); setPage(1); }}>Hapus filter</button>}
      </div>
      <div className="card flush">
        <Async q={q}>
          {(d) => d.items.length === 0 ? (
            <EmptyState title={filtered ? 'Tidak ada transaksi pada rentang ini' : 'Belum ada transaksi'} action={!filtered && <Link className="btn" to="/kasir">Buka kasir</Link>}>
              {filtered ? 'Ubah tanggal atau hapus filter.' : 'Transaksi yang selesai di kasir tercatat di sini.'}
            </EmptyState>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Nota</th><th>Waktu</th><th>Kasir</th><th className="num">Item</th><th className="num">Total bayar</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                  <tbody>
                    {d.items.map((t) => (
                      <tr key={t.id}>
                        <td className="cell-main row-main">#{t.id}{t.id_resep ? <span className="chip" style={{ marginLeft: 8 }}>Resep</span> : null}</td>
                        <td data-label="Waktu">{fmtDateTime(t.tgl_transaksi)}</td>
                        <td data-label="Kasir">{t.kasir}</td>
                        <td data-label="Item" className="num">{fmtNum(t.jumlah_item)}</td>
                        <td data-label="Total bayar" className="num"><strong>{fmtRp(t.total_bayar)}</strong></td>
                        <td className="cell-actions"><div className="actions"><Link className="btn soft small" to={`/nota/${t.id}`}>Lihat nota</Link></div></td>
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
    </>
  );
}
