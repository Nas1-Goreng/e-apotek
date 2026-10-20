<?php
// Pemakaian: php database/set_password.php <username> [peran] [nama lengkap]
// Kata sandi dibaca dari prompt, jadi tidak tersimpan di riwayat terminal.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit("Jalankan lewat terminal.\n");
}
require __DIR__ . '/../backend/src/bootstrap.php';

$username = $argv[1] ?? null;
if ($username === null) {
    exit("Pemakaian: php database/set_password.php <username> [admin|apoteker] [nama lengkap]\n");
}

fwrite(STDOUT, "Kata sandi baru (minimal 8 karakter): ");
$password = rtrim((string) fgets(STDIN), "\r\n");
if (strlen($password) < 8 || strlen($password) > 72) {
    exit("Kata sandi harus 8 sampai 72 karakter.\n");
}
$hash = Auth::hash($password);

$existing = Db::one('SELECT id FROM users WHERE username = ?', [$username]);
if ($existing) {
    Db::run('UPDATE users SET password = ? WHERE id = ?', [$hash, $existing['id']]);
    exit("Kata sandi '$username' diperbarui.\n");
}

$role = $argv[2] ?? 'apoteker';
if (!in_array($role, ['admin', 'apoteker'], true)) {
    exit("Peran harus admin atau apoteker.\n");
}
$nama = $argv[3] ?? $username;
Db::run('INSERT INTO users (username, nama_lengkap, password, role) VALUES (?, ?, ?, ?)', [$username, $nama, $hash, $role]);
exit("Pengguna '$username' ($role) dibuat.\n");
