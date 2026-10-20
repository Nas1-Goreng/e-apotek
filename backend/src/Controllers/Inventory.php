<?php
declare(strict_types=1);

final class Inventory
{
    public const SELECT = 'SELECT o.id, o.nama_obat, o.id_kategori, k.nama_kategori, o.id_supplier, s.nama_supplier,
        o.harga_jual, o.stok, o.satuan, o.tgl_expired
        FROM obat o
        JOIN kategori k ON k.id = o.id_kategori
        LEFT JOIN supplier s ON s.id = o.id_supplier';

    public static function today(): string
    {
        return date('Y-m-d');
    }

    public static function limitDate(): string
    {
        return date('Y-m-d', strtotime('+' . App::config()['hari_kedaluwarsa'] . ' days'));
    }

    public static function minStock(): int
    {
        return (int) App::config()['stok_minimum'];
    }

    public static function decorate(array $row): array
    {
        $today = new DateTimeImmutable('today');
        $exp = new DateTimeImmutable($row['tgl_expired']);
        $days = (int) $today->diff($exp)->format('%r%a');
        $row['hari_ke_kedaluwarsa'] = $days;
        $row['kedaluwarsa'] = $days < 0;
        $row['segera_kedaluwarsa'] = $days >= 0 && $days <= (int) App::config()['hari_kedaluwarsa'];
        $row['stok_kritis'] = $row['stok'] < self::minStock();
        return $row;
    }

    public static function reasons(array $row): array
    {
        $out = [];
        $d = $row['hari_ke_kedaluwarsa'];
        if ($row['kedaluwarsa']) {
            $out[] = 'Kedaluwarsa ' . abs($d) . ' hari lalu';
        } elseif ($row['segera_kedaluwarsa']) {
            $out[] = $d === 0 ? 'Kedaluwarsa hari ini' : "Kedaluwarsa $d hari lagi";
        }
        if ($row['stok'] === 0) {
            $out[] = 'Stok habis';
        } elseif ($row['stok_kritis']) {
            $out[] = "Stok {$row['stok']} {$row['satuan']}";
        }
        return $out;
    }

    public static function priority(array $row): int
    {
        if ($row['kedaluwarsa']) {
            return 0;
        }
        if ($row['stok'] === 0) {
            return 1;
        }
        if ($row['segera_kedaluwarsa']) {
            return 2;
        }
        return 3;
    }
}
