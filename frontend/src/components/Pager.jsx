export default function Pager({ page, perPage, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (total <= perPage) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <nav className="pager" aria-label="Halaman data">
      <span>Menampilkan {from} sampai {to} dari {total}</span>
      <div className="btns">
        <button type="button" className="btn ghost small" disabled={page <= 1} onClick={() => onPage(page - 1)}>Sebelumnya</button>
        <button type="button" className="btn ghost small" disabled={page >= pages} onClick={() => onPage(page + 1)}>Berikutnya</button>
      </div>
    </nav>
  );
}
