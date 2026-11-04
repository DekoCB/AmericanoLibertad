<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pasa de evaluaciones de nombre libre agrupadas por semana a 2 mitades
     * por horario, cada una con 1 Examen fijo (sembrado automáticamente) y
     * cualquier cantidad de evaluaciones Continuas que el docente cree.
     * No hay notas reales cargadas todavía (confirmado con el cliente), así
     * que se vacían evaluaciones/calificaciones en vez de migrar datos.
     */
    public function up(): void
    {
        DB::table('calificaciones')->delete();
        DB::table('evaluaciones')->delete();

        Schema::table('evaluaciones', function (Blueprint $table) {
            $table->dropColumn('semana');
            $table->string('tipo', 10)->after('horario_id');
            $table->string('mitad', 10)->after('tipo');
            $table->string('nombre', 150)->nullable()->change();
            $table->date('fecha')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('evaluaciones', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'mitad']);
            $table->string('nombre', 150)->nullable(false)->change();
            $table->unsignedSmallInteger('semana')->nullable()->after('horario_id');
            $table->date('fecha')->nullable(false)->change();
        });
    }
};
