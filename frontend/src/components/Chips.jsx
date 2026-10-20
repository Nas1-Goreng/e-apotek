import Icon from './Icon.jsx';

// Status selalu ditulis sebagai teks, warna hanya penegas.
export function StockChips({ row }) {
  const chips = [];
  if (row.kedaluwarsa) chips.push(<span key="x" className="chip bad"><Icon name="awas" size={14} />Kedaluwarsa</span>);
  else if (row.segera_kedaluwarsa) chips.push(<span key="s" className="chip warn">Segera kedaluwarsa</span>);
  if (row.stok === 0) chips.push(<span key="h" className="chip bad">Stok habis</span>);
  else if (row.stok_kritis) chips.push(<span key="k" className="chip warn">Stok menipis</span>);
  if (!chips.length) chips.push(<span key="a" className="chip">Aman</span>);
  return <span className="chips">{chips}</span>;
}
