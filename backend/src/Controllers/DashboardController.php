<?php
declare(strict_types=1);

final class DashboardController
{
    public static function index(): array
    {
        $today = Inventory::today();
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $start = date('Y-m-d', strtotime('-6 days'));

        $perHari = [];
        foreach (Db::all(
            'SELECT DATE(tgl_transaksi) AS tanggal, COUNT(*) AS transaksi, SUM(total_bayar) AS pendapatan
             FROM penjualan WHERE tgl_transaksi >= ? AND tgl_transaksi < ? GROUP BY DATE(tgl_transaksi)',
            [$start . ' 00:00:00', date('Y-m-d', strtotime('+1 day')) . ' 00:00:00']
        ) as $r) {
            $perHari[$r['tanggal']] = ['transaksi' => (int) $r['transaksi'], 'pendapatan' => (int) $r['pendapatan']];
        }
        $grafik = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $grafik[] = ['tanggal' => $d] + ($perHari[$d] ?? ['transaksi' => 0, 'pendapatan' => 0]);
        }

        $items = (int) Db::val(
            'SELECT COALESCE(SUM(d.jumlah), 0) FROM detail_penjualan d JOIN penjualan p ON p.id = d.id_penjualan
             WHERE p.tgl_transaksi >= ? AND p.tgl_transaksi < ?',
            [$today . ' 00:00:00', date('Y-m-d', strtotime('+1 day')) . ' 00:00:00']
        );

        $min = Inventory::minStock();
        $limit = Inventory::limitDate();
        $stok = Db::one(
            'SELECT COUNT(*) AS total,
                    COALESCE(SUM(stok < ?), 0) AS kritis,
                    COALESCE(SUM(tgl_expired < ?), 0) AS kedaluwarsa,
                    COALESCE(SUM(tgl_expired >= ? AND tgl_expired <= ?), 0) AS segera,
                    COALESCE(SUM(stok < ? OR tgl_expired <= ?), 0) AS perlu_tindakan
             FROM obat',
            [$min, $today, $today, $limit, $min, $limit]
        );
        $stok = array_map('intval', $stok);
        $stok['aman'] = $stok['total'] - $stok['perlu_tindakan'];

        $rows = Db::all(Inventory::SELECT . ' WHERE o.stok < ? OR o.tgl_expired <= ?', [$min, $limit]);
        $rows = array_map([Inventory::class, 'decorate'], $rows);
        usort($rows, fn ($a, $b) => [Inventory::priority($a), $a['hari_ke_kedaluwarsa'], $a['stok']] <=> [Inventory::priority($b), $b['hari_ke_kedaluwarsa'], $b['stok']]);
        $perluTindakan = array_map(
            fn ($r) => ['id' => $r['id'], 'nama_obat' => $r['nama_obat'], 'satuan' => $r['satuan'], 'stok' => $r['stok'], 'alasan' => Inventory::reasons($r), 'darurat' => $r['kedaluwarsa'] || $r['stok'] === 0],
            array_slice($rows, 0, 6)
        );

        return [
            'hari_ini' => [
                'pendapatan' => $perHari[$today]['pendapatan'] ?? 0,
                'transaksi' => $perHari[$today]['transaksi'] ?? 0,
                'item' => $items,
            ],
            'kemarin' => [
                'pendapatan' => $perHari[$yesterday]['pendapatan'] ?? 0,
                'transaksi' => $perHari[$yesterday]['transaksi'] ?? 0,
            ],
            'grafik' => $grafik,
            'stok' => $stok,
            'perlu_tindakan' => $perluTindakan,
            'resep_menunggu' => [
                'jumlah' => (int) Db::val("SELECT COUNT(*) FROM resep WHERE status = 'menunggu'"),
                'items' => Db::all(
                    "SELECT id, nama_pasien, nama_dokter, tgl_resep FROM resep WHERE status = 'menunggu' ORDER BY tgl_resep ASC, id ASC LIMIT 5"
                ),
            ],
            'transaksi_terakhir' => Db::all(
                'SELECT p.id, p.tgl_transaksi, p.total_bayar, u.nama_lengkap AS kasir
                 FROM penjualan p JOIN users u ON u.id = p.id_user ORDER BY p.tgl_transaksi DESC, p.id DESC LIMIT 5'
            ),
        ];
    }
}
