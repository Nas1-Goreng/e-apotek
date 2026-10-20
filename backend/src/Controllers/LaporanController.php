<?php
declare(strict_types=1);

final class LaporanController
{
    public static function index(): array
    {
        $periode = Http::query('periode', 'harian');
        if (!in_array($periode, ['harian', 'mingguan', 'bulanan'], true)) {
            Http::fail(422, 'Periode harus harian, mingguan, atau bulanan.');
        }
        $tanggal = Http::query('tanggal', date('Y-m-d'));
        if (!Http::isDate($tanggal)) {
            Http::fail(422, 'Tanggal tidak valid.');
        }

        $anchor = new DateTimeImmutable($tanggal);
        if ($periode === 'harian') {
            $from = $to = $anchor;
        } elseif ($periode === 'mingguan') {
            $from = $anchor->modify('-' . ((int) $anchor->format('N') - 1) . ' days');
            $to = $from->modify('+6 days');
        } else {
            $from = $anchor->modify('first day of this month');
            $to = $anchor->modify('last day of this month');
        }
        $start = $from->format('Y-m-d') . ' 00:00:00';
        $end = $to->modify('+1 day')->format('Y-m-d') . ' 00:00:00';

        $ringkas = Db::one(
            'SELECT COUNT(*) AS transaksi, COALESCE(SUM(total_bayar), 0) AS pendapatan FROM penjualan WHERE tgl_transaksi >= ? AND tgl_transaksi < ?',
            [$start, $end]
        );
        $item = (int) Db::val(
            'SELECT COALESCE(SUM(d.jumlah), 0) FROM detail_penjualan d JOIN penjualan p ON p.id = d.id_penjualan WHERE p.tgl_transaksi >= ? AND p.tgl_transaksi < ?',
            [$start, $end]
        );

        $hari = [];
        for ($d = $from; $d <= $to; $d = $d->modify('+1 day')) {
            $hari[$d->format('Y-m-d')] = ['tanggal' => $d->format('Y-m-d'), 'transaksi' => 0, 'item' => 0, 'pendapatan' => 0];
        }
        foreach (Db::all(
            'SELECT DATE(tgl_transaksi) AS tanggal, COUNT(*) AS transaksi, SUM(total_bayar) AS pendapatan
             FROM penjualan WHERE tgl_transaksi >= ? AND tgl_transaksi < ? GROUP BY DATE(tgl_transaksi)',
            [$start, $end]
        ) as $r) {
            $hari[$r['tanggal']]['transaksi'] = (int) $r['transaksi'];
            $hari[$r['tanggal']]['pendapatan'] = (int) $r['pendapatan'];
        }
        foreach (Db::all(
            'SELECT DATE(p.tgl_transaksi) AS tanggal, SUM(d.jumlah) AS item
             FROM detail_penjualan d JOIN penjualan p ON p.id = d.id_penjualan
             WHERE p.tgl_transaksi >= ? AND p.tgl_transaksi < ? GROUP BY DATE(p.tgl_transaksi)',
            [$start, $end]
        ) as $r) {
            $hari[$r['tanggal']]['item'] = (int) $r['item'];
        }

        $terlaris = Db::all(
            'SELECT d.id_obat, d.nama_obat, d.satuan, SUM(d.jumlah) AS jumlah, SUM(d.subtotal) AS pendapatan
             FROM detail_penjualan d JOIN penjualan p ON p.id = d.id_penjualan
             WHERE p.tgl_transaksi >= ? AND p.tgl_transaksi < ?
             GROUP BY d.id_obat, d.nama_obat, d.satuan ORDER BY jumlah DESC, d.nama_obat ASC LIMIT 10',
            [$start, $end]
        );
        $transaksi = Db::all(
            'SELECT p.id, p.tgl_transaksi, p.total_bayar, u.nama_lengkap AS kasir
             FROM penjualan p JOIN users u ON u.id = p.id_user
             WHERE p.tgl_transaksi >= ? AND p.tgl_transaksi < ? ORDER BY p.tgl_transaksi DESC, p.id DESC LIMIT 500',
            [$start, $end]
        );

        $n = (int) $ringkas['transaksi'];
        $total = (int) $ringkas['pendapatan'];
        return [
            'periode' => $periode,
            'dari' => $from->format('Y-m-d'),
            'sampai' => $to->format('Y-m-d'),
            'ringkasan' => [
                'transaksi' => $n,
                'pendapatan' => $total,
                'item' => $item,
                'rata_rata' => $n > 0 ? intdiv($total, $n) : 0,
            ],
            'per_hari' => array_values($hari),
            'terlaris' => array_map(fn ($r) => ['jumlah' => (int) $r['jumlah'], 'pendapatan' => (int) $r['pendapatan']] + $r, $terlaris),
            'transaksi' => $transaksi,
            'transaksi_terpotong' => $n > 500,
        ];
    }
}
