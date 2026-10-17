<?php

declare(strict_types=1);

use App\Modules\Pagos\Http\Controllers\ReciboTicketController;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;

Route::middleware(['auth'])->prefix('pagos')->name('pagos.')->group(function () {
    Volt::route('/', 'pagos.index')->name('index');

    Volt::route('mi-cuenta', 'pagos.mi-cuenta')->name('mi-cuenta');

    Volt::route('conceptos', 'pagos.conceptos')->name('conceptos');

    Volt::route('cuentas-bancarias', 'pagos.cuentas-bancarias')->name('cuentas-bancarias');

    Route::get('recibos/{recibo}/ticket/{ancho}', ReciboTicketController::class)
        ->name('recibos.ticket')
        ->whereIn('ancho', ['80', '58']);
});
