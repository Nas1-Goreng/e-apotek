<?php
// Nilai bisa diganti lewat environment variable tanpa mengubah file ini.
return [
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: 'e_apotek',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    ],
    'timezone' => getenv('APP_TZ') ?: 'Asia/Makassar',

    // Stok di bawah angka ini dianggap kritis (ketentuan tugas: di bawah 5).
    'stok_minimum' => 5,
    // Obat yang kedaluwarsa dalam rentang hari ini dianggap mendekati kedaluwarsa.
    'hari_kedaluwarsa' => 60,

    // Dicetak di kepala nota. Kosongkan alamat dan telepon jika belum ada.
    'apotek' => [
        'nama' => getenv('APOTEK_NAMA') ?: 'E-Apotek',
        'alamat' => getenv('APOTEK_ALAMAT') ?: '',
        'telepon' => getenv('APOTEK_TELEPON') ?: '',
    ],
];
