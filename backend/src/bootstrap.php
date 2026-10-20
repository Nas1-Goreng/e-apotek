<?php
declare(strict_types=1);

final class App
{
    private static array $config = [];

    public static function load(): void
    {
        self::$config = require __DIR__ . '/../config.php';
        date_default_timezone_set(self::$config['timezone']);
    }

    public static function config(): array
    {
        return self::$config;
    }
}

App::load();

require __DIR__ . '/Http.php';
require __DIR__ . '/Db.php';
require __DIR__ . '/Validator.php';
require __DIR__ . '/Auth.php';
require __DIR__ . '/Router.php';
foreach (glob(__DIR__ . '/Controllers/*.php') as $file) {
    require $file;
}
