<?php
declare(strict_types=1);

final class PenjualanController
{
    public static function index(array $p): array
    {
        $user = $p['_user'];
        $where = [];
        $args = [];
        $dari = Http::query('dari');
        $sampai = Http::query('sampai');
        if ($dari !== null && Http::isDate($dari)) {
            $where[] = 'p.tgl_transaksi >= ?';
            $args[] = $dari . ' 00:00:00';
        }
        if ($sampai !== null && Http::isDate($sampai)) {
            $where[] = 'p.tgl_transaksi < ?';
            $args[] = date('Y-m-d', strtotime($sampai . ' +1 day')) . ' 00:00:00';
        }
        // Apoteker hanya melihat transaksinya sendiri, admin melihat semuanya.
        if ($user['role'] !== 'admin') {
            $where[] = 'p.id_user = ?';
            $args[] = $user['id'];
        }
        $cond = $where ? ' WHERE ' . implode(' AND ', $where) : '';
        [$page, $per, $offset] = Http::page();

        $total = (int) Db::val('SELECT COUNT(*) FROM penjualan p' . $cond, $args);
        $rows = Db::all(
            'SELECT p.id, p.tgl_transaksi, p.total_bayar, p.uang_diterima, p.id_resep, u.nama_lengkap AS kasir,
                    (SELECT COALESCE(SUM(d.jumlah), 0) FROM detail_penjualan d WHERE d.id_penjualan = p.id) AS jumlah_item
             FROM penjualan p JOIN users u ON u.id = p.id_user' . $cond .
            " ORDER BY p.tgl_transaksi DESC, p.id DESC LIMIT $per OFFSET $offset",
            $args
        );
        return ['items' => $rows, 'total' => $total, 'page' => $page, 'per_page' => $per];
    }

    public static function show(array $p): array
    {
        $user = $p['_user'];
        $row = Db::one(
            'SELECT p.id, p.tgl_transaksi, p.total_bayar, p.uang_diterima, p.id_user, p.id_resep,
                    u.nama_lengkap AS kasir, r.nama_pasien, r.nama_dokter
             FROM penjualan p
             JOIN users u ON u.id = p.id_user
             LEFT JOIN resep r ON r.id = p.id_resep
             WHERE p.id = ?',
            [(int) $p['id']]
        );
        if ($row === null || ($user['role'] !== 'admin' && (int) $row['id_user'] !== (int) $user['id'])) {
            Http::fail(404, 'Transaksi tidak ditemukan.');
        }
        $row['kembalian'] = $row['uang_diterima'] - $row['total_bayar'];
        $row['items'] = Db::all(
            'SELECT id, id_obat, nama_obat, satuan, harga_satuan, jumlah, subtotal FROM detail_penjualan WHERE id_penjualan = ? ORDER BY id',
            [$row['id']]
        );
        $row['apotek'] = App::config()['apotek'];
        return $row;
    }

    public static function store(array $p): never
    {
        $user = $p['_user'];
        $in = Http::body();
        $v = new V($in);
        $diterima = $v->int('uang_diterima', 'Uang diterima', 0, 1000000000);
        $idResep = $v->int('id_resep', 'Resep', 1, null, false);
        $v->done();

        $items = $in['items'] ?? null;
        if (!is_array($items) || count($items) === 0) {
            Http::fail(422, 'Keranjang masih kosong.');
        }
        if (count($items) > 100) {
            Http::fail(422, 'Satu transaksi maksimal 100 jenis obat.');
        }
        $qty = [];
        foreach ($items as $it) {
            $id = is_array($it) ? filter_var($it['id_obat'] ?? null, FILTER_VALIDATE_INT) : false;
            $n = is_array($it) ? filter_var($it['jumlah'] ?? null, FILTER_VALIDATE_INT) : false;
            if (!$id || !$n || $n < 1 || $n > 100000) {
                Http::fail(422, 'Jumlah obat di keranjang tidak valid.');
            }
            $qty[$id] = ($qty[$id] ?? 0) + $n;
        }
        ksort($qty);

        $pdo = Db::pdo();
        $pdo->beginTransaction();
        try {
            $ids = array_keys($qty);
            $marks = implode(',', array_fill(0, count($ids), '?'));
            // Baris obat dikunci supaya dua kasir tidak menjual stok yang sama.
            $rows = Db::all("SELECT id, nama_obat, satuan, harga_jual, stok, tgl_expired FROM obat WHERE id IN ($marks) ORDER BY id FOR UPDATE", $ids);
            if (count($rows) !== count($ids)) {
                Http::fail(409, 'Ada obat di keranjang yang sudah dihapus dari data. Muat ulang halaman kasir.');
            }

            $today = Inventory::today();
            $total = 0;
            $lines = [];
            $problems = [];
            foreach ($rows as $r) {
                $n = $qty[(int) $r['id']];
                if ($r['tgl_expired'] < $today) {
                    $problems[] = "{$r['nama_obat']} sudah kedaluwarsa dan tidak boleh dijual.";
                } elseif ($r['stok'] < $n) {
                    $problems[] = "Stok {$r['nama_obat']} tinggal {$r['stok']} {$r['satuan']}.";
                }
                $sub = $r['harga_jual'] * $n;
                $total += $sub;
                $lines[] = [$r, $n, $sub];
            }
            if ($problems) {
                Http::fail(409, implode(' ', $problems));
            }
            if ($diterima < $total) {
                Http::fail(422, 'Uang diterima kurang dari total bayar.', ['uang_diterima' => 'Uang diterima kurang dari total bayar.']);
            }

            if ($idResep !== null) {
                $resep = Db::one('SELECT status FROM resep WHERE id = ? FOR UPDATE', [$idResep]);
                if ($resep === null) {
                    Http::fail(422, 'Resep tidak ditemukan.');
                }
                if ($resep['status'] !== 'menunggu') {
                    Http::fail(409, 'Resep ini sudah diselesaikan di transaksi lain.');
                }
            }

            $idJual = Db::insert(
                'INSERT INTO penjualan (tgl_transaksi, total_bayar, uang_diterima, id_user, id_resep) VALUES (?, ?, ?, ?, ?)',
                [date('Y-m-d H:i:s'), $total, $diterima, $user['id'], $idResep]
            );
            foreach ($lines as [$r, $n, $sub]) {
                Db::run(
                    'INSERT INTO detail_penjualan (id_penjualan, id_obat, nama_obat, satuan, harga_satuan, jumlah, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$idJual, $r['id'], $r['nama_obat'], $r['satuan'], $r['harga_jual'], $n, $sub]
                );
                Db::run('UPDATE obat SET stok = stok - ? WHERE id = ?', [$n, $r['id']]);
            }
            if ($idResep !== null) {
                Db::run("UPDATE resep SET status = 'selesai' WHERE id = ?", [$idResep]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        Http::json(['id' => $idJual, 'total_bayar' => $total, 'uang_diterima' => $diterima, 'kembalian' => $diterima - $total], 201);
    }
}
