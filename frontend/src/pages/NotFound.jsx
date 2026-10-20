import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';

export default function NotFound() {
  return (
    <>
      <PageHead title="Halaman tidak ditemukan" />
      <div className="card">
        <div className="state">
          <h3>Alamat ini tidak ada di E-Apotek</h3>
          <p>Periksa alamatnya atau kembali ke dashboard.</p>
          <Link className="btn" to="/">Ke dashboard</Link>
        </div>
      </div>
    </>
  );
}
