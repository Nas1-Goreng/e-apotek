<?php
declare(strict_types=1);

// Kategori dan pemasok punya bentuk CRUD yang sama, jadi memakai satu kelas.
final class MasterController
{
    public static function kategoriIndex(): array
    {
        return ['items' => Db::all(
            'SELECT k.id, k.nama_kategori, COUNT(o.id) AS jumlah_obat
             FROM kategori k LEFT JOIN obat o ON o.id_kategori = k.id
             GROUP BY k.id, k.nama_kategori ORDER BY k.nama_kategori'
        )];
    }

    public static function kategoriStore(): never
    {
        $nama = self::kategoriName();
        self::guardDuplicate(fn () => Db::insert('INSERT INTO kategori (nama_kategori) VALUES (?)', [$nama]), 'nama_kategori', 'Nama kategori ini sudah ada.', $id);
        Http::json(['id' => $id], 201);
    }

    public static function kategoriUpdate(array $p): array
    {
        $id = (int) $p['id'];
        $nama = self::kategoriName();
        self::guardDuplicate(fn () => Db::run('UPDATE kategori SET nama_kategori = ? WHERE id = ?', [$nama, $id]), 'nama_kategori', 'Nama kategori ini sudah ada.');
        return ['id' => $id];
    }

    public static function kategoriDestroy(array $p): array
    {
        return self::delete('kategori', (int) $p['id'], 'Kategori', 'Kategori ini masih dipakai oleh obat. Pindahkan obatnya ke kategori lain dulu.');
    }

    public static function supplierIndex(): array
    {
        return ['items' => Db::all(
            'SELECT s.id, s.nama_supplier, s.telepon, s.alamat, COUNT(o.id) AS jumlah_obat
             FROM supplier s LEFT JOIN obat o ON o.id_supplier = s.id
             GROUP BY s.id, s.nama_supplier, s.telepon, s.alamat ORDER BY s.nama_supplier'
        )];
    }

    public static function supplierStore(): never
    {
        $d = self::supplierInput();
        self::guardDuplicate(
            fn () => Db::insert('INSERT INTO supplier (nama_supplier, telepon, alamat) VALUES (?, ?, ?)', [$d['nama'], $d['telepon'], $d['alamat']]),
            'nama_supplier',
            'Nama pemasok ini sudah ada.',
            $id
        );
        Http::json(['id' => $id], 201);
    }

    public static function supplierUpdate(array $p): array
    {
        $id = (int) $p['id'];
        $d = self::supplierInput();
        self::guardDuplicate(
            fn () => Db::run('UPDATE supplier SET nama_supplier = ?, telepon = ?, alamat = ? WHERE id = ?', [$d['nama'], $d['telepon'], $d['alamat'], $id]),
            'nama_supplier',
            'Nama pemasok ini sudah ada.'
        );
        return ['id' => $id];
    }

    public static function supplierDestroy(array $p): array
    {
        return self::delete('supplier', (int) $p['id'], 'Pemasok', 'Pemasok tidak bisa dihapus.');
    }

    private static function kategoriName(): string
    {
        $v = new V(Http::body());
        $nama = $v->text('nama_kategori', 'Nama kategori', 80);
        $v->done();
        return $nama;
    }

    private static function supplierInput(): array
    {
        $v = new V(Http::body());
        $d = [
            'nama' => $v->text('nama_supplier', 'Nama pemasok', 120),
            'telepon' => $v->text('telepon', 'Telepon', 30, false),
            'alamat' => $v->text('alamat', 'Alamat', 255, false),
        ];
        $v->done();
        return $d;
    }

    private static function guardDuplicate(callable $fn, string $field, string $message, ?int &$id = null): void
    {
        try {
            $r = $fn();
            if (is_int($r)) {
                $id = $r;
            }
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Http::fail(422, 'Data belum valid. Periksa kolom yang ditandai.', [$field => $message]);
            }
            throw $e;
        }
    }

    private static function delete(string $table, int $id, string $label, string $inUse): array
    {
        try {
            $n = Db::run("DELETE FROM $table WHERE id = ?", [$id])->rowCount();
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Http::fail(409, $inUse);
            }
            throw $e;
        }
        if ($n === 0) {
            Http::fail(404, "$label tidak ditemukan.");
        }
        return ['ok' => true];
    }
}
