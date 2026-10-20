<?php
declare(strict_types=1);

final class HttpError extends Exception
{
    public function __construct(public int $status, string $message, public array $fields = [])
    {
        parent::__construct($message);
    }
}

final class Http
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    public static function fail(int $status, string $message, array $fields = []): never
    {
        throw new HttpError($status, $message, $fields);
    }

    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            self::fail(400, 'Isi permintaan harus berupa JSON yang valid.');
        }
        return $data;
    }

    public static function query(string $key, ?string $default = null): ?string
    {
        $v = $_GET[$key] ?? null;
        return is_string($v) && $v !== '' ? $v : $default;
    }

    public static function page(int $defaultPerPage = 15, int $maxPerPage = 100): array
    {
        $page = max(1, (int) (self::query('page') ?? 1));
        $per = min($maxPerPage, max(1, (int) (self::query('per_page') ?? $defaultPerPage)));
        return [$page, $per, ($page - 1) * $per];
    }

    public static function isDate(?string $s): bool
    {
        if ($s === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) {
            return false;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $s));
        return checkdate($m, $d, $y);
    }
}
