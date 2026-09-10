<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Carrera es un concepto propio de Americano Libertad (instituto técnico
 * multi-carrera) sin equivalente en CEBA (programa único de EBA) -- se
 * recrea acá tal como existía en el proyecto original de AL, ya que el
 * wizard de admisión y la landing dependen de ella.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carreras', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 10)->unique();
            $table->unsignedTinyInteger('total_ciclos')->default(6);
            $table->string('imagen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carreras');
    }
};
