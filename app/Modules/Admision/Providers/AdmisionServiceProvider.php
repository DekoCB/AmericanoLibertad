<?php

declare(strict_types=1);

namespace App\Modules\Admision\Providers;

use App\Shared\Providers\ModuleServiceProvider;

class AdmisionServiceProvider extends ModuleServiceProvider
{
    public function boot(): void
    {
        $this->loadWebRoutesFrom(__DIR__.'/../Routes/web.php');
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
    }
}
