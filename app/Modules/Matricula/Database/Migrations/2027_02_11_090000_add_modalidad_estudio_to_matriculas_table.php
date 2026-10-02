<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            // Presencial/Virtual, elegido por cada matrícula individual --
            // no depende del Ciclo/Periodo, dos estudiantes del mismo
            // periodo pueden tener modalidades distintas.
            $table->string('modalidad_estudio')->default('presencial')->after('ciclo_curricular');
        });
    }

    public function down(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropColumn('modalidad_estudio');
        });
    }
};
