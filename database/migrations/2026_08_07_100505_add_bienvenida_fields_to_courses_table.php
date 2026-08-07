<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->text('objetivo_general')->nullable()->after('capacity');
            $table->text('mensaje_bienvenida')->nullable()->after('objetivo_general');
            $table->string('modalidad')->nullable()->after('mensaje_bienvenida');
            $table->text('sistema_evaluacion')->nullable()->after('modalidad');
            $table->text('requisitos')->nullable()->after('sistema_evaluacion');
            $table->text('competencia_general')->nullable()->after('requisitos');
            $table->text('competencias_especificas')->nullable()->after('competencia_general');
            $table->text('resultados_aprendizaje')->nullable()->after('competencias_especificas');
            $table->text('normas_curso')->nullable()->after('resultados_aprendizaje');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'objetivo_general',
                'mensaje_bienvenida',
                'modalidad',
                'sistema_evaluacion',
                'requisitos',
                'competencia_general',
                'competencias_especificas',
                'resultados_aprendizaje',
                'normas_curso',
            ]);
        });
    }
};
