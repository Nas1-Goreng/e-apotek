import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/Auth.jsx';
import Shell from './components/Shell.jsx';
import { ErrorState, Loading } from './components/States.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Kasir from './pages/Kasir.jsx';
import Nota from './pages/Nota.jsx';
import Riwayat from './pages/Riwayat.jsx';
import Resep from './pages/Resep.jsx';
import Obat from './pages/Obat.jsx';
import Kategori from './pages/Kategori.jsx';
import Supplier from './pages/Supplier.jsx';
import Peringatan from './pages/Peringatan.jsx';
import Laporan from './pages/Laporan.jsx';
import Pengguna from './pages/Pengguna.jsx';
import NotFound from './pages/NotFound.jsx';

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user.role !== 'admin') {
    return (
      <div className="card">
        <div className="state">
          <h3>Halaman ini khusus admin</h3>
          <p>Akun Anda berperan apoteker atau kasir, jadi menu ini tidak tersedia.</p>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  const { status, user, error, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading text="Menyiapkan E-Apotek" />;
  if (status === 'error') return <ErrorState error={error} onRetry={retry} title="Server tidak bisa dihubungi" />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={location.state?.from || '/'} replace /> : <Login />} />
      <Route element={user ? <Shell /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />}>
        <Route index element={<Dashboard />} />
        <Route path="kasir" element={<Kasir />} />
        <Route path="nota/:id" element={<Nota />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="resep" element={<Resep />} />
        <Route path="obat" element={<Obat />} />
        <Route path="kategori" element={<Kategori />} />
        <Route path="supplier" element={<Supplier />} />
        <Route path="peringatan" element={<Peringatan />} />
        <Route path="laporan" element={<AdminOnly><Laporan /></AdminOnly>} />
        <Route path="pengguna" element={<AdminOnly><Pengguna /></AdminOnly>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
