<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingresos_instituto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('estudiantes')->cascadeOnDelete();
            $table->date('fecha');
            $table->boolean('llego_tarde')->default(false);
            $table->timestamps();

            $table->unique(['estudiante_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingresos_instituto');
    }
};
