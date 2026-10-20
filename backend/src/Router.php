<?php
declare(strict_types=1);

final class Router
{
    private array $routes = [];

    // $roles null berarti semua pengguna yang sudah masuk. $public membuka rute tanpa login.
    public function add(string $method, string $pattern, callable $handler, ?array $roles = null, bool $public = false): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
        $this->routes[] = compact('method', 'regex', 'handler', 'roles', 'public');
    }

    public function dispatch(string $method, string $path): void
    {
        $allowed = [];
        foreach ($this->routes as $r) {
            if (!preg_match($r['regex'], $path, $m)) {
                continue;
            }
            if ($r['method'] !== $method) {
                $allowed[] = $r['method'];
                continue;
            }
            $params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            if (!$r['public']) {
                $user = Auth::require($r['roles']);
                if (!in_array($method, ['GET', 'HEAD'], true)) {
                    Auth::checkCsrf();
                }
                $params['_user'] = $user;
            }
            $result = ($r['handler'])($params);
            Http::json($result ?? ['ok' => true]);
        }
        if ($allowed) {
            Http::fail(405, 'Metode tidak diizinkan untuk alamat ini.');
        }
        Http::fail(404, 'Alamat tidak ditemukan.');
    }
}
