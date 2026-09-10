<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Grado (el modelo de 4 grados fijos de un colegio EBA, heredado de CEBA)
 * queda reemplazado por Carrera+ciclo_curricular en todo el sistema. No hay
 * datos que migrar: a la fecha de esta migración la tabla horarios está
 * vacía (ver Fase 0 de la migración Grado->Carrera+Ciclo).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            $table->dropForeign(['grado_id']);
            $table->dropColumn('grado_id');

            $table->foreignId('carrera_id')->after('ciclo_id')
                ->constrained('carreras')->restrictOnDelete();
            $table->unsignedTinyInteger('ciclo_curricular')->after('carrera_id');
        });
    }

    public function down(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');
            $table->dropColumn('ciclo_curricular');

            $table->foreignId('grado_id')->constrained('grados')->restrictOnDelete();
        });
    }
};
