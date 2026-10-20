import Icon from './Icon.jsx';

export function Loading({ text = 'Memuat data' }) {
  return (
    <div className="loading-line" role="status" aria-live="polite">
      <span className="loading-bar" aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Data gagal dimuat' }) {
  return (
    <div className="state" role="alert">
      <Icon name="awas" size={28} />
      <h3>{title}</h3>
      <p>{error?.message || 'Terjadi kesalahan yang tidak diketahui.'}</p>
      {onRetry && <button type="button" className="btn soft" onClick={onRetry}>Muat ulang</button>}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

// Menampilkan salah satu dari tiga keadaan standar: memuat, gagal, atau data.
export function Async({ q, children }) {
  if (q.loading && !q.data) return <Loading />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
  if (!q.data) return null;
  return children(q.data);
}
