<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recibos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pago_id')->constrained()->cascadeOnDelete();
            $table->string('numero_recibo')->unique();
            $table->string('pdf_path');
            $table->timestamp('emitido_en');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recibos');
    }
};
