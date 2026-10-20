import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { fmtDateTime, fmtNum, fmtRp } from '../lib/format.js';
import PageHead from '../components/PageHead.jsx';
import Icon from '../components/Icon.jsx';
import { Async } from '../components/States.jsx';

export default function Nota() {
  const { id } = useParams();
  const q = useApi(`/penjualan/${id}`);
  return (
    <>
      <PageHead title={`Nota #${id}`} desc="Pilih Simpan sebagai PDF di dialog cetak jika ingin berkas PDF.">
        <Link className="btn ghost" to="/riwayat">Riwayat</Link>
        <button type="button" className="btn" onClick={() => window.print()} disabled={!q.data}><Icon name="cetak" size={18} />Cetak nota</button>
      </PageHead>
      <Async q={q}>
        {(n) => (
          <div className="nota-wrap">
            <article className="nota" aria-label={`Nota penjualan ${n.id}`}>
              <h2>{n.apotek.nama}</h2>
              {n.apotek.alamat && <p className="center">{n.apotek.alamat}</p>}
              {n.apotek.telepon && <p className="center">Telp {n.apotek.telepon}</p>}
              <hr />
              <div className="row"><span>Nota</span><span>#{n.id}</span></div>
              <div className="row"><span>Waktu</span><span>{fmtDateTime(n.tgl_transaksi)}</span></div>
              <div className="row"><span>Kasir</span><span>{n.kasir}</span></div>
              {n.nama_pasien && <div className="row"><span>Pasien</span><span>{n.nama_pasien}</span></div>}
              <hr />
              {n.items.map((i) => (
                <div className="item" key={i.id}>
                  <div>{i.nama_obat}</div>
                  <div className="row"><span>{fmtNum(i.jumlah)} {i.satuan} x {fmtRp(i.harga_satuan)}</span><span>{fmtRp(i.subtotal)}</span></div>
                </div>
              ))}
              <hr />
              <div className="row total"><span>Total</span><span>{fmtRp(n.total_bayar)}</span></div>
              <div className="row"><span>Tunai</span><span>{fmtRp(n.uang_diterima)}</span></div>
              <div className="row"><span>Kembalian</span><span>{fmtRp(n.kembalian)}</span></div>
              <hr />
              <p className="center">Terima kasih. Simpan nota ini sebagai bukti pembelian.</p>
            </article>
          </div>
        )}
      </Async>
    </>
  );
}
