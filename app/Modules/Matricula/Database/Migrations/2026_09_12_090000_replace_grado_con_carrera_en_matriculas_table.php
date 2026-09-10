<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ver 2026_09_12_090000_replace_grado_con_carrera_en_horarios_table (Academico):
 * misma migración Grado->Carrera+ciclo_curricular, aplicada acá a matriculas.
 * Sin datos que migrar (tabla vacía a la fecha, ver Fase 0).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropForeign(['grado_id']);
            $table->dropColumn('grado_id');

            $table->foreignId('carrera_id')->after('ciclo_id')
                ->constrained('carreras')->restrictOnDelete();
            $table->unsignedTinyInteger('ciclo_curricular')->after('carrera_id');
        });
    }

    public function down(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');
            $table->dropColumn('ciclo_curricular');

            $table->foreignId('grado_id')->constrained('grados')->restrictOnDelete();
        });
    }
};
