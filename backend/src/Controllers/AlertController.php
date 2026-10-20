<?php
declare(strict_types=1);

final class AlertController
{
    public static function index(): array
    {
        $rows = Db::all(
            Inventory::SELECT . ' WHERE o.stok < ? OR o.tgl_expired <= ? ORDER BY o.tgl_expired ASC, o.stok ASC, o.nama_obat ASC',
            [Inventory::minStock(), Inventory::limitDate()]
        );
        $rows = array_map([Inventory::class, 'decorate'], $rows);
        $kritis = array_values(array_filter($rows, fn ($r) => $r['stok_kritis']));
        usort($kritis, fn ($a, $b) => [$a['stok'], $a['nama_obat']] <=> [$b['stok'], $b['nama_obat']]);
        return [
            'ambang' => ['stok' => Inventory::minStock(), 'hari' => (int) App::config()['hari_kedaluwarsa']],
            'stok_kritis' => $kritis,
            'segera_kedaluwarsa' => array_values(array_filter($rows, fn ($r) => $r['segera_kedaluwarsa'])),
            'kedaluwarsa' => array_values(array_filter($rows, fn ($r) => $r['kedaluwarsa'])),
        ];
    }
}
