<?php
declare(strict_types=1);

final class ResepController
{
    public static function index(): array
    {
        $where = [];
        $args = [];
        $status = Http::query('status');
        if (in_array($status, ['menunggu', 'selesai'], true)) {
            $where[] = 'r.status = ?';
            $args[] = $status;
        }
        if ($q = Http::query('q')) {
            $where[] = '(r.nama_pasien LIKE ? OR r.nama_dokter LIKE ?)';
            $like = '%' . addcslashes($q, '%_\\') . '%';
            array_push($args, $like, $like);
        }
        $cond = $where ? ' WHERE ' . implode(' AND ', $where) : '';
        [$page, $per, $offset] = Http::page();

        $total = (int) Db::val('SELECT COUNT(*) FROM resep r' . $cond, $args);
        $rows = Db::all(
            'SELECT r.id, r.nama_pasien, r.nama_dokter, r.tgl_resep, r.status, r.catatan, u.nama_lengkap AS pencatat,
                    (SELECT COUNT(*) FROM detail_resep d WHERE d.id_resep = r.id) AS jumlah_obat
             FROM resep r JOIN users u ON u.id = r.id_user' . $cond .
            " ORDER BY r.status = 'menunggu' DESC, r.tgl_resep DESC, r.id DESC LIMIT $per OFFSET $offset",
            $args
        );
        return ['items' => $rows, 'total' => $total, 'page' => $page, 'per_page' => $per];
    }

    public static function show(array $p): array
    {
        $row = Db::one(
            'SELECT r.id, r.nama_pasien, r.nama_dokter, r.tgl_resep, r.catatan, r.status, u.nama_lengkap AS pencatat
             FROM resep r JOIN users u ON u.id = r.id_user WHERE r.id = ?',
            [(int) $p['id']]
        );
        if ($row === null) {
            Http::fail(404, 'Resep tidak ditemukan.');
        }
        $items = Db::all(
            'SELECT d.id, d.id_obat, d.jumlah, d.aturan_pakai, o.nama_obat, o.satuan, o.harga_jual, o.stok, o.tgl_expired
             FROM detail_resep d JOIN obat o ON o.id = d.id_obat WHERE d.id_resep = ? ORDER BY d.id',
            [$row['id']]
        );
        $row['items'] = array_map([Inventory::class, 'decorate'], $items);
        return $row;
    }

    public static function store(array $p): never
    {
        $in = Http::body();
        $v = new V($in);
        $pasien = $v->text('nama_pasien', 'Nama pasien', 100);
        $dokter = $v->text('nama_dokter', 'Nama dokter', 100);
        $tgl = $v->date('tgl_resep', 'Tanggal resep');
        $catatan = $v->text('catatan', 'Catatan', 255, false);
        $v->done();

        $items = $in['items'] ?? null;
        if (!is_array($items) || count($items) === 0) {
            Http::fail(422, 'Tambahkan minimal satu obat pada resep.', ['items' => 'Tambahkan minimal satu obat pada resep.']);
        }
        $clean = [];
        foreach ($items as $i => $it) {
            $iv = new V(is_array($it) ? $it : []);
            $idObat = $iv->int('id_obat', 'Obat', 1);
            $jumlah = $iv->int('jumlah', 'Jumlah', 1, 100000);
            $aturan = $iv->text('aturan_pakai', 'Aturan pakai', 150, false);
            try {
                $iv->done();
            } catch (HttpError $e) {
                Http::fail(422, 'Obat baris ' . ($i + 1) . ' belum lengkap. ' . implode(' ', $e->fields));
            }
            if (isset($clean[$idObat])) {
                Http::fail(422, 'Obat yang sama muncul dua kali di resep. Gabungkan jumlahnya di satu baris.');
            }
            $clean[$idObat] = [$idObat, $jumlah, $aturan];
        }
        $marks = implode(',', array_fill(0, count($clean), '?'));
        if ((int) Db::val("SELECT COUNT(*) FROM obat WHERE id IN ($marks)", array_keys($clean)) !== count($clean)) {
            Http::fail(422, 'Ada obat di resep yang tidak ditemukan.');
        }

        $pdo = Db::pdo();
        $pdo->beginTransaction();
        try {
            $id = Db::insert(
                'INSERT INTO resep (nama_pasien, nama_dokter, tgl_resep, catatan, id_user) VALUES (?, ?, ?, ?, ?)',
                [$pasien, $dokter, $tgl, $catatan, $p['_user']['id']]
            );
            foreach ($clean as [$idObat, $jumlah, $aturan]) {
                Db::run('INSERT INTO detail_resep (id_resep, id_obat, jumlah, aturan_pakai) VALUES (?, ?, ?, ?)', [$id, $idObat, $jumlah, $aturan]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
        Http::json(['id' => $id], 201);
    }

    public static function destroy(array $p): array
    {
        $id = (int) $p['id'];
        $status = Db::val('SELECT status FROM resep WHERE id = ?', [$id]);
        if ($status === null) {
            Http::fail(404, 'Resep tidak ditemukan.');
        }
        if ($status !== 'menunggu') {
            Http::fail(409, 'Resep yang sudah diselesaikan tidak bisa dihapus karena terhubung ke transaksi.');
        }
        Db::run('DELETE FROM resep WHERE id = ?', [$id]);
        return ['ok' => true];
    }
}
