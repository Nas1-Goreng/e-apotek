import MasterCrud from '../components/MasterCrud.jsx';

export default function Kategori() {
  return (
    <MasterCrud
      endpoint="/kategori" title="Kategori obat" noun="Kategori" nameKey="nama_kategori"
      desc="Pengelompokan obat, misalnya antibiotik atau vitamin."
      emptyText="Kategori dipakai untuk mengelompokkan obat di menu Obat."
      fields={[{ key: 'nama_kategori', label: 'Nama kategori', max: 80, required: true }]}
    />
  );
}
