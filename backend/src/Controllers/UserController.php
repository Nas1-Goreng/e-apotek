<?php
declare(strict_types=1);

final class UserController
{
    public static function index(): array
    {
        return ['items' => Db::all('SELECT id, username, nama_lengkap, role, created_at FROM users ORDER BY role ASC, nama_lengkap ASC')];
    }

    public static function store(): never
    {
        $d = self::input(true);
        try {
            $id = Db::insert(
                'INSERT INTO users (username, nama_lengkap, password, role) VALUES (?, ?, ?, ?)',
                [$d['username'], $d['nama_lengkap'], Auth::hash($d['password']), $d['role']]
            );
        } catch (PDOException $e) {
            self::duplicate($e);
        }
        Http::json(['id' => $id], 201);
    }

    public static function update(array $p): array
    {
        $id = (int) $p['id'];
        $current = Db::one('SELECT id, role FROM users WHERE id = ?', [$id]);
        if ($current === null) {
            Http::fail(404, 'Pengguna tidak ditemukan.');
        }
        $d = self::input(false);
        if ($current['role'] === 'admin' && $d['role'] !== 'admin' && self::adminCount() <= 1) {
            Http::fail(409, 'Harus ada minimal satu admin. Jadikan pengguna lain admin lebih dulu.');
        }
        try {
            if ($d['password'] !== null) {
                Db::run('UPDATE users SET username = ?, nama_lengkap = ?, role = ?, password = ? WHERE id = ?', [$d['username'], $d['nama_lengkap'], $d['role'], Auth::hash($d['password']), $id]);
            } else {
                Db::run('UPDATE users SET username = ?, nama_lengkap = ?, role = ? WHERE id = ?', [$d['username'], $d['nama_lengkap'], $d['role'], $id]);
            }
        } catch (PDOException $e) {
            self::duplicate($e);
        }
        return ['id' => $id];
    }

    public static function destroy(array $p): array
    {
        $id = (int) $p['id'];
        if ($id === (int) $p['_user']['id']) {
            Http::fail(409, 'Akun yang sedang dipakai tidak bisa dihapus.');
        }
        $current = Db::one('SELECT role FROM users WHERE id = ?', [$id]);
        if ($current === null) {
            Http::fail(404, 'Pengguna tidak ditemukan.');
        }
        if ($current['role'] === 'admin' && self::adminCount() <= 1) {
            Http::fail(409, 'Harus ada minimal satu admin.');
        }
        try {
            Db::run('DELETE FROM users WHERE id = ?', [$id]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Http::fail(409, 'Pengguna ini punya riwayat transaksi atau resep, jadi tidak bisa dihapus.');
            }
            throw $e;
        }
        return ['ok' => true];
    }

    private static function adminCount(): int
    {
        return (int) Db::val("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    }

    private static function input(bool $passwordRequired): array
    {
        $in = Http::body();
        $v = new V($in);
        $username = $v->text('username', 'Nama pengguna', 50);
        if ($username !== null && !preg_match('/^[A-Za-z0-9._-]{3,50}$/', $username)) {
            $v->error('username', 'Nama pengguna 3 sampai 50 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.');
        }
        $nama = $v->text('nama_lengkap', 'Nama lengkap', 100);
        $role = $v->oneOf('role', 'Peran', ['admin', 'apoteker']);
        $password = is_string($in['password'] ?? null) && $in['password'] !== '' ? $in['password'] : null;
        if ($password === null && $passwordRequired) {
            $v->error('password', 'Kata sandi wajib diisi.');
        } elseif ($password !== null && (strlen($password) < 8 || strlen($password) > 72)) {
            $v->error('password', 'Kata sandi 8 sampai 72 karakter.');
        }
        $v->done();
        return ['username' => $username, 'nama_lengkap' => $nama, 'role' => $role, 'password' => $password];
    }

    private static function duplicate(PDOException $e): never
    {
        if ($e->getCode() === '23000') {
            Http::fail(422, 'Data belum valid. Periksa kolom yang ditandai.', ['username' => 'Nama pengguna ini sudah dipakai.']);
        }
        throw $e;
    }
}
