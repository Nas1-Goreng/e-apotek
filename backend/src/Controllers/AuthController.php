<?php
declare(strict_types=1);

final class AuthController
{
    private const MAX_FAILS = 5;
    private const WINDOW = 300;

    public static function me(): array
    {
        $user = Auth::user();
        return $user === null
            ? ['user' => null, 'csrf' => null]
            : ['user' => $user, 'csrf' => Auth::csrf(), 'apotek' => App::config()['apotek']];
    }

    public static function login(): never
    {
        $in = Http::body();
        $username = is_string($in['username'] ?? null) ? trim($in['username']) : '';
        $password = is_string($in['password'] ?? null) ? $in['password'] : '';
        if ($username === '' || $password === '') {
            Http::fail(422, 'Nama pengguna dan kata sandi wajib diisi.', array_filter([
                'username' => $username === '' ? 'Nama pengguna wajib diisi.' : null,
                'password' => $password === '' ? 'Kata sandi wajib diisi.' : null,
            ]));
        }

        $now = time();
        $fails = array_values(array_filter($_SESSION['gagal'] ?? [], fn ($t) => $t > $now - self::WINDOW));
        if (count($fails) >= self::MAX_FAILS) {
            Http::fail(429, 'Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi.');
        }

        $row = Db::one('SELECT id, username, nama_lengkap, password, role FROM users WHERE username = ?', [$username]);
        // Hash tiruan menjaga waktu respons sama saat nama pengguna tidak ada.
        $hash = $row['password'] ?? '$2y$10$usesomesillystringforsaltuQ9s1PbGJ7xZ9Y3cKpYpN0kq0nLm6a';
        if (!password_verify($password, $hash) || $row === null) {
            $fails[] = $now;
            $_SESSION['gagal'] = $fails;
            Http::fail(401, 'Nama pengguna atau kata sandi salah.');
        }

        if (password_needs_rehash($row['password'], PASSWORD_DEFAULT)) {
            Db::run('UPDATE users SET password = ? WHERE id = ?', [Auth::hash($password), $row['id']]);
        }
        unset($row['password']);
        unset($_SESSION['gagal']);
        Auth::login($row);
        Http::json(['user' => $row, 'csrf' => Auth::csrf(), 'apotek' => App::config()['apotek']]);
    }

    public static function logout(): array
    {
        Auth::logout();
        return ['ok' => true];
    }
}
