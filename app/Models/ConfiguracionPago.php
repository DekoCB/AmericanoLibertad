<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfiguracionPago extends Model
{
    protected $table = 'configuracion_pagos';

    protected $fillable = [
        'yape_numero',
        'yape_qr_path',
        'plin_numero',
        'plin_qr_path',
        'cuenta_detalle',
    ];

    public static function actual(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }
}
