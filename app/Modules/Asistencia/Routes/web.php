<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;

Route::middleware(['auth'])->prefix('asistencia')->name('asistencia.')->group(function () {
    Volt::route('/', 'asistencia.index')->name('index');

    Volt::route('marcar', 'asistencia.marcar')->name('marcar');

    Volt::route('instituto/qr', 'asistencia.instituto.qr')->name('instituto.qr');
    Volt::route('instituto/reporte', 'asistencia.instituto.reporte')->name('instituto.reporte');

    Volt::route('{horario}', 'asistencia.show')->name('show');
});
