<?php

namespace Workdo\StockRequisition\Providers;

use Illuminate\Support\ServiceProvider;

class StockRequisitionServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/web.php');
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'stock-requisition');
    }

    public function register()
    {
        //
    }
}
