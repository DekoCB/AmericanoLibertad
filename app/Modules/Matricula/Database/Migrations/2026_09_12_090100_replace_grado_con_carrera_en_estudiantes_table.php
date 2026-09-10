<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * grado_actual_id (caché denormalizado del último grado matriculado) pasa a
 * carrera_actual_id + ciclo_actual. Ver
 * 2026_09_12_090000_replace_grado_con_carrera_en_horarios_table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estudiantes', function (Blueprint $table) {
            $table->dropForeign(['grado_actual_id']);
            $table->dropColumn('grado_actual_id');

            $table->foreignId('carrera_actual_id')->nullable()
                ->constrained('carreras')->nullOnDelete();
            $table->unsignedTinyInteger('ciclo_actual')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('estudiantes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_actual_id');
            $table->dropColumn('ciclo_actual');

            $table->foreignId('grado_actual_id')->nullable()
                ->constrained('grados')->nullOnDelete();
        });
    }
};
