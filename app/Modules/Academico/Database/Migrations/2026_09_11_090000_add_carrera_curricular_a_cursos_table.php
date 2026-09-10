<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Los cursos de un instituto superior (currícula por carrera: módulos,
 * ciclos I-VI, créditos) no encajan en el modelo de "Grado" con el que
 * nació este módulo (los 4 grados de un colegio EBA, heredados de CEBA) --
 * por eso grado_id pasa a ser opcional y estos cursos "de carrera" viven
 * en paralelo, sin tocar los cursos con grado_id existentes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->foreignId('grado_id')->nullable()->change();

            $table->foreignId('carrera_id')->nullable()->after('grado_id')
                ->constrained('carreras')->nullOnDelete();
            $table->unsignedTinyInteger('modulo_numero')->nullable()->after('carrera_id');
            $table->string('modulo_nombre', 150)->nullable()->after('modulo_numero');
            $table->unsignedTinyInteger('ciclo_curricular')->nullable()->after('modulo_nombre');
            $table->decimal('creditos', 4, 1)->nullable()->after('horas');
        });
    }

    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');
            $table->dropColumn(['modulo_numero', 'modulo_nombre', 'ciclo_curricular', 'creditos']);
            $table->foreignId('grado_id')->nullable(false)->change();
        });
    }
};
