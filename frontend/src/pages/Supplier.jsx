import MasterCrud from '../components/MasterCrud.jsx';

export default function Supplier() {
  return (
    <MasterCrud
      endpoint="/supplier" title="Pemasok" noun="Pemasok" nameKey="nama_supplier"
      desc="Distributor tempat obat dibeli."
      emptyText="Catat pemasok agar tiap obat tahu dari mana asalnya."
      fields={[
        { key: 'nama_supplier', label: 'Nama pemasok', max: 120, required: true },
        { key: 'telepon', label: 'Telepon', max: 30 },
        { key: 'alamat', label: 'Alamat', max: 255 },
      ]}
    />
  );
}
