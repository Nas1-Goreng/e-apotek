// Ikon digambar sendiri di kisi 24px: isian mint tipis di bawah garis siku, bukan set garis bulat bawaan.
const SHAPES = {
  dashboard: (<><path className="duo" d="M3 3h8v10H3z" /><path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z" /></>),
  kasir: (<><path className="duo" d="M7 4h10v6H7z" /><path d="M7 4h10v6H7zM4 10h16v10H4zM8 14h2M12 14h2M16 14h0M8 17h2M12 17h2" /></>),
  resep: (<><path className="duo" d="M5 5h14v16H5z" /><path d="M5 5h14v16H5zM9 3h6v4H9zM12 10v6M9 13h6" /></>),
  obat: (<><path className="duo" d="M3.5 12l8.5-8.5 4 4-8.5 8.5z" /><path d="M10.2 3.8a4 4 0 015.7 0l4.3 4.3a4 4 0 010 5.7l-6.4 6.4a4 4 0 01-5.7 0l-4.3-4.3a4 4 0 010-5.7zM8.5 8.5l7 7" /></>),
  kategori: (<><path className="duo" d="M3 4h8l10 10-7 7L3 11z" /><path d="M3 4h8l10 10-7 7L3 11zM7.5 8.5h.01" /></>),
  pemasok: (<><path className="duo" d="M2 6h11v10H2z" /><path d="M2 6h11v10H2zM13 9h5l3 3v4h-8zM6 16v.01M17 16v.01M4 16a2 2 0 104 0M15 16a2 2 0 104 0" /></>),
  riwayat: (<><path className="duo" d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" /><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8 8h8M8 12h8" /></>),
  peringatan: (<><path className="duo" d="M6 17v-6a6 6 0 0112 0v6l2 2H4z" /><path d="M6 17v-6a6 6 0 0112 0v6l2 2H4zM10 21h4" /></>),
  laporan: (<><path className="duo" d="M10 6h4v14h-4z" /><path d="M4 12h4v8H4zM10 6h4v14h-4zM16 9h4v11h-4zM3 21h18" /></>),
  pengguna: (<><path className="duo" d="M4 21c0-4 3.5-6 8-6s8 2 8 6z" /><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6z" /></>),
  keluar: (<path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H9" />),
  menu: (<path d="M4 7h16M4 12h16M4 17h16" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  minus: (<path d="M5 12h14" />),
  edit: (<path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" />),
  hapus: (<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />),
  cari: (<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></>),
  cetak: (<path d="M7 9V3h10v6M5 9h14v8H5zM7 14h10v7H7z" />),
  tutup: (<path d="M6 6l12 12M18 6L6 18" />),
  cek: (<path d="M5 12l5 5 9-10" />),
  awas: (<><path className="duo" d="M12 3l10 18H2z" /><path d="M12 3l10 18H2zM12 10v5M12 18v.01" /></>),
  lihat: (<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z" />),
};

export default function Icon({ name, size = 22, label }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {SHAPES[name]}
    </svg>
  );
}
