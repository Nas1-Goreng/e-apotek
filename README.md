# E-Apotek

Sistem informasi apotek digital: stok obat, resep dokter, kasir, nota cetak, peringatan stok dan kedaluwarsa, laporan penjualan.

- Frontend: React 18 + Vite (`frontend/`)
- Backend: PHP 8.1 atau lebih baru, PDO, tanpa framework (`backend/`)
- Database: MySQL atau MariaDB, memakai database `e_apotek` yang sudah Anda buat

## Peran

| Peran | Akses |
|---|---|
| Admin | Semua menu, termasuk Laporan dan Pengguna |
| Apoteker / Kasir | Dashboard, Kasir, Resep, Riwayat (hanya transaksinya sendiri), Obat, Kategori, Pemasok, Peringatan |

## Menjalankan di komputer sendiri

1. Pastikan database `e_apotek` sudah diimpor lewat phpMyAdmin. Ekstensi PHP `pdo_mysql` harus aktif (bawaan XAMPP).
2. Atur kata sandi akun. Hash lama di tabel `users` tidak dipakai sebagai kata sandi yang Anda ketahui, jadi buat yang baru:

   ```
   php database/set_password.php admin
   php database/set_password.php kasir1 apoteker "Nama Kasir"
   ```

   Perintah pertama mengganti kata sandi `admin`. Perintah kedua membuat akun apoteker baru. Kata sandi diketik di prompt dan disimpan sebagai hash (`password_hash`).
3. Jalankan backend. Jika MySQL memakai kata sandi atau pengguna selain `root` tanpa sandi, set variabel `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME` lebih dulu.

   ```
   cd backend/public
   php -S 127.0.0.1:8000 router.php
   ```
4. Jalankan frontend di terminal lain:

   ```
   cd frontend
   npm install
   npm run dev
   ```

   Buka http://localhost:5173. Permintaan `/api` diteruskan ke server PHP.

## Pengaturan

`backend/config.php`:

- `stok_minimum` (5): stok di bawah angka ini dianggap kritis.
- `hari_kedaluwarsa` (60): obat yang kedaluwarsa dalam rentang ini dianggap mendekati kedaluwarsa.
- `apotek`: nama, alamat, dan telepon yang tercetak di nota. Alamat dan telepon yang kosong tidak dicetak.
- Zona waktu bawaan `Asia/Makassar`. Ubah dengan variabel `APP_TZ`.

## Pemasangan di Apache (XAMPP)

1. `cd frontend && npm run build`, lalu salin isi `dist/` ke `htdocs/e-apotek/`. Jika dipasang di subfolder, build dengan `VITE_BASE=/e-apotek/ npm run build`.
2. Arahkan alias `/api` ke `backend/public` di konfigurasi Apache:

   ```
   Alias /api "C:/path/ke/e-apotek/backend/public"
   <Directory "C:/path/ke/e-apotek/backend/public">
       AllowOverride All
       Require all granted
   </Directory>
   ```

   Nama alias harus `/api`. Folder `backend/src` tidak boleh ikut berada di dalam folder yang dibuka ke web.

## Aturan bisnis yang diterapkan

- Stok dikurangi otomatis di dalam satu transaksi database. Baris obat dikunci (`FOR UPDATE`) supaya dua kasir tidak menjual stok yang sama.
- Harga diambil dari database saat transaksi, bukan dari kiriman browser. Nama, satuan, dan harga disalin ke `detail_penjualan` sehingga nota lama tidak berubah saat harga obat diubah.
- Obat kedaluwarsa atau stok habis tidak bisa dijual.
- Resep yang dimuat di kasir otomatis berstatus selesai setelah transaksi berhasil. Resep selesai tidak bisa dihapus.
- Obat, kategori, atau pengguna yang sudah terpakai di transaksi tidak bisa dihapus (batasan foreign key), dan pesannya dijelaskan ke pengguna.
- Nota dicetak dari browser. Pilih "Simpan sebagai PDF" di dialog cetak jika butuh berkas PDF.
- Login dibatasi 5 kali gagal per 5 menit per sesi. Mutasi data memakai token CSRF.

## Yang masih placeholder

- Logo: sementara teks "E-Apotek" dengan ikon kapsul. Ganti di `frontend/src/components/Shell.jsx` dan `pages/Login.jsx` jika sudah ada logo.
- Alamat dan telepon apotek di nota: kosong sampai diisi di `config.php`.
