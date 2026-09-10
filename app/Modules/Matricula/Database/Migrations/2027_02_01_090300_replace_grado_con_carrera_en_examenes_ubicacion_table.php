<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * grado_asignado_id (recomendación del examen de ubicación) pasa a
 * carrera_asignada_id + ciclo_asignado. Ver
 * 2026_09_12_090000_replace_grado_con_carrera_en_horarios_table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('examenes_ubicacion', function (Blueprint $table) {
            $table->dropForeign(['grado_asignado_id']);
            $table->dropColumn('grado_asignado_id');

            $table->foreignId('carrera_asignada_id')->nullable()
                ->constrained('carreras')->nullOnDelete();
            $table->unsignedTinyInteger('ciclo_asignado')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('examenes_ubicacion', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_asignada_id');
            $table->dropColumn('ciclo_asignado');

            $table->foreignId('grado_asignado_id')->nullable()
                ->constrained('grados')->nullOnDelete();
        });
    }
};
