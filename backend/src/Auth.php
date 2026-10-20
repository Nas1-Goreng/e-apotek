<?php
declare(strict_types=1);

final class Auth
{
    private static ?array $user = null;

    public static function start(): void
    {
        session_name('eapotek_sid');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => !empty($_SERVER['HTTPS']),
        ]);
        session_start();
    }

    // Dibaca ulang dari database supaya perubahan peran atau penghapusan akun langsung berlaku.
    public static function user(): ?array
    {
        if (self::$user !== null) {
            return self::$user;
        }
        $id = $_SESSION['uid'] ?? null;
        if (!is_int($id)) {
            return null;
        }
        self::$user = Db::one('SELECT id, username, nama_lengkap, role FROM users WHERE id = ?', [$id]);
        if (self::$user === null) {
            unset($_SESSION['uid']);
        }
        return self::$user;
    }

    public static function login(array $user): void
    {
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) $user['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        self::$user = null;
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']);
        }
        session_destroy();
        self::$user = null;
    }

    public static function csrf(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    public static function checkCsrf(): void
    {
        $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!is_string($sent) || !hash_equals(self::csrf(), $sent)) {
            Http::fail(403, 'Sesi tidak valid. Muat ulang halaman lalu coba lagi.');
        }
    }

    public static function require(?array $roles): array
    {
        $user = self::user();
        if ($user === null) {
            Http::fail(401, 'Silakan masuk terlebih dahulu.');
        }
        if ($roles !== null && !in_array($user['role'], $roles, true)) {
            Http::fail(403, 'Peran Anda tidak memiliki akses ke fitur ini.');
        }
        return $user;
    }

    public static function hash(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }
}
