<?php
declare(strict_types=1);

final class ObatController
{
    public static function index(): array
    {
        $where = [];
        $p = [];
        if ($q = Http::query('q')) {
            $where[] = 'o.nama_obat LIKE ?';
            $p[] = '%' . addcslashes($q, '%_\\') . '%';
        }
        if ($kat = (int) Http::query('id_kategori', '0')) {
            $where[] = 'o.id_kategori = ?';
            $p[] = $kat;
        }
        switch (Http::query('status')) {
            case 'kritis':
                $where[] = 'o.stok < ?';
                $p[] = Inventory::minStock();
                break;
            case 'kedaluwarsa':
                $where[] = 'o.tgl_expired < ?';
                $p[] = Inventory::today();
                break;
            case 'segera':
                $where[] = 'o.tgl_expired >= ? AND o.tgl_expired <= ?';
                array_push($p, Inventory::today(), Inventory::limitDate());
                break;
            case 'tersedia':
                $where[] = 'o.stok > 0 AND o.tgl_expired >= ?';
                $p[] = Inventory::today();
                break;
        }
        $cond = $where ? ' WHERE ' . implode(' AND ', $where) : '';
        [$page, $per, $offset] = Http::page(15, 500);

        $total = (int) Db::val('SELECT COUNT(*) FROM obat o' . $cond, $p);
        $rows = Db::all(Inventory::SELECT . $cond . " ORDER BY o.nama_obat ASC LIMIT $per OFFSET $offset", $p);
        return [
            'items' => array_map([Inventory::class, 'decorate'], $rows),
            'total' => $total,
            'page' => $page,
            'per_page' => $per,
        ];
    }

    public static function store(): never
    {
        $d = self::input();
        $id = Db::insert(
            'INSERT INTO obat (nama_obat, id_kategori, id_supplier, harga_jual, stok, satuan, tgl_expired) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$d['nama_obat'], $d['id_kategori'], $d['id_supplier'], $d['harga_jual'], $d['stok'], $d['satuan'], $d['tgl_expired']]
        );
        Http::json(['id' => $id], 201);
    }

    public static function update(array $p): array
    {
        $id = (int) $p['id'];
        if (!Db::val('SELECT 1 FROM obat WHERE id = ?', [$id])) {
            Http::fail(404, 'Obat tidak ditemukan.');
        }
        $d = self::input();
        Db::run(
            'UPDATE obat SET nama_obat = ?, id_kategori = ?, id_supplier = ?, harga_jual = ?, stok = ?, satuan = ?, tgl_expired = ? WHERE id = ?',
            [$d['nama_obat'], $d['id_kategori'], $d['id_supplier'], $d['harga_jual'], $d['stok'], $d['satuan'], $d['tgl_expired'], $id]
        );
        return ['id' => $id];
    }

    public static function destroy(array $p): array
    {
        $id = (int) $p['id'];
        try {
            $n = Db::run('DELETE FROM obat WHERE id = ?', [$id])->rowCount();
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Http::fail(409, 'Obat ini sudah dipakai di transaksi atau resep, jadi tidak bisa dihapus. Ubah stoknya menjadi 0 jika tidak dijual lagi.');
            }
            throw $e;
        }
        if ($n === 0) {
            Http::fail(404, 'Obat tidak ditemukan.');
        }
        return ['ok' => true];
    }

    private static function input(): array
    {
        $v = new V(Http::body());
        $d = [
            'nama_obat' => $v->text('nama_obat', 'Nama obat', 150),
            'id_kategori' => $v->int('id_kategori', 'Kategori', 1),
            'id_supplier' => $v->int('id_supplier', 'Pemasok', 1, null, false),
            'harga_jual' => $v->int('harga_jual', 'Harga jual', 1, 100000000),
            'stok' => $v->int('stok', 'Stok', 0, 1000000),
            'satuan' => $v->text('satuan', 'Satuan', 20),
            'tgl_expired' => $v->date('tgl_expired', 'Tanggal kedaluwarsa'),
        ];
        $v->done();
        if (!Db::val('SELECT 1 FROM kategori WHERE id = ?', [$d['id_kategori']])) {
            Http::fail(422, 'Data belum valid. Periksa kolom yang ditandai.', ['id_kategori' => 'Kategori tidak ditemukan.']);
        }
        if ($d['id_supplier'] !== null && !Db::val('SELECT 1 FROM supplier WHERE id = ?', [$d['id_supplier']])) {
            Http::fail(422, 'Data belum valid. Periksa kolom yang ditandai.', ['id_supplier' => 'Pemasok tidak ditemukan.']);
        }
        return $d;
    }
}
