<?php
declare(strict_types=1);

final class V
{
    private array $errors = [];

    public function __construct(private array $in)
    {
    }

    public function text(string $key, string $label, int $max, bool $required = true): ?string
    {
        $v = $this->in[$key] ?? null;
        $v = is_string($v) ? trim($v) : '';
        if ($v === '') {
            if ($required) {
                $this->errors[$key] = "$label wajib diisi.";
            }
            return null;
        }
        if (self::len($v) > $max) {
            $this->errors[$key] = "$label maksimal $max karakter.";
            return null;
        }
        return $v;
    }

    public function int(string $key, string $label, int $min = 0, ?int $max = null, bool $required = true): ?int
    {
        $v = $this->in[$key] ?? null;
        if ($v === null || $v === '') {
            if ($required) {
                $this->errors[$key] = "$label wajib diisi.";
            }
            return null;
        }
        $isWhole = is_int($v)
            || (is_float($v) && floor($v) === $v)
            || (is_string($v) && preg_match('/^-?\d+$/', trim($v)) === 1);
        if (!$isWhole) {
            $this->errors[$key] = "$label harus berupa bilangan bulat.";
            return null;
        }
        $n = (int) $v;
        if ($n < $min || ($max !== null && $n > $max)) {
            $this->errors[$key] = $max === null ? "$label minimal $min." : "$label harus antara $min dan $max.";
            return null;
        }
        return $n;
    }

    public function date(string $key, string $label, bool $required = true): ?string
    {
        $v = $this->in[$key] ?? null;
        if ($v === null || $v === '') {
            if ($required) {
                $this->errors[$key] = "$label wajib diisi.";
            }
            return null;
        }
        if (!is_string($v) || !Http::isDate($v)) {
            $this->errors[$key] = "$label harus berformat tanggal yang valid.";
            return null;
        }
        return $v;
    }

    public function oneOf(string $key, string $label, array $allowed): ?string
    {
        $v = $this->in[$key] ?? null;
        if (!is_string($v) || !in_array($v, $allowed, true)) {
            $this->errors[$key] = "$label tidak valid.";
            return null;
        }
        return $v;
    }

    private static function len(string $s): int
    {
        return function_exists('mb_strlen') ? mb_strlen($s) : (int) preg_match_all('/./su', $s);
    }

    public function error(string $key, string $message): void
    {
        $this->errors[$key] = $message;
    }

    public function done(): void
    {
        if ($this->errors) {
            Http::fail(422, 'Data belum valid. Periksa kolom yang ditandai.', $this->errors);
        }
    }
}
