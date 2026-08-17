<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuracion_pagos', function (Blueprint $table) {
            $table->id();
            $table->string('yape_numero')->nullable();
            $table->string('yape_qr_path')->nullable();
            $table->string('plin_numero')->nullable();
            $table->string('plin_qr_path')->nullable();
            $table->text('cuenta_detalle')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_pagos');
    }
};
