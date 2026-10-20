<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

set_exception_handler(function (Throwable $e): void {
    if ($e instanceof HttpError) {
        Http::json(['error' => $e->getMessage(), 'fields' => (object) $e->fields], $e->status);
    }
    error_log((string) $e);
    Http::json(['error' => 'Terjadi kesalahan di server. Coba lagi, atau hubungi pengelola jika berulang.'], 500);
});

Auth::start();

$router = new Router();
$any = null;
$admin = ['admin'];

$router->add('GET', '/auth/me', [AuthController::class, 'me'], null, true);
$router->add('POST', '/auth/login', [AuthController::class, 'login'], null, true);
$router->add('POST', '/auth/logout', [AuthController::class, 'logout'], $any);

$router->add('GET', '/dashboard', [DashboardController::class, 'index'], $any);
$router->add('GET', '/peringatan', [AlertController::class, 'index'], $any);

$router->add('GET', '/obat', [ObatController::class, 'index'], $any);
$router->add('POST', '/obat', [ObatController::class, 'store'], $any);
$router->add('PUT', '/obat/{id}', [ObatController::class, 'update'], $any);
$router->add('DELETE', '/obat/{id}', [ObatController::class, 'destroy'], $any);

$router->add('GET', '/kategori', [MasterController::class, 'kategoriIndex'], $any);
$router->add('POST', '/kategori', [MasterController::class, 'kategoriStore'], $any);
$router->add('PUT', '/kategori/{id}', [MasterController::class, 'kategoriUpdate'], $any);
$router->add('DELETE', '/kategori/{id}', [MasterController::class, 'kategoriDestroy'], $any);

$router->add('GET', '/supplier', [MasterController::class, 'supplierIndex'], $any);
$router->add('POST', '/supplier', [MasterController::class, 'supplierStore'], $any);
$router->add('PUT', '/supplier/{id}', [MasterController::class, 'supplierUpdate'], $any);
$router->add('DELETE', '/supplier/{id}', [MasterController::class, 'supplierDestroy'], $any);

$router->add('GET', '/resep', [ResepController::class, 'index'], $any);
$router->add('GET', '/resep/{id}', [ResepController::class, 'show'], $any);
$router->add('POST', '/resep', [ResepController::class, 'store'], $any);
$router->add('DELETE', '/resep/{id}', [ResepController::class, 'destroy'], $any);

$router->add('GET', '/penjualan', [PenjualanController::class, 'index'], $any);
$router->add('GET', '/penjualan/{id}', [PenjualanController::class, 'show'], $any);
$router->add('POST', '/penjualan', [PenjualanController::class, 'store'], $any);

$router->add('GET', '/laporan', [LaporanController::class, 'index'], $admin);

$router->add('GET', '/users', [UserController::class, 'index'], $admin);
$router->add('POST', '/users', [UserController::class, 'store'], $admin);
$router->add('PUT', '/users/{id}', [UserController::class, 'update'], $admin);
$router->add('DELETE', '/users/{id}', [UserController::class, 'destroy'], $admin);

// Semua yang ada setelah segmen /api dianggap sebagai rute, jadi folder induknya bebas.
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$pos = strpos($uri, '/api/');
$path = $pos === false ? $uri : substr($uri, $pos + 4);
$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', rtrim($path, '/') ?: '/');
