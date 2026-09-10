<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * franjas_permitidas solo restringía cuáles de las 3 franjas institucionales
 * fijas se ofrecían al CREAR un horario para este curso -- con las franjas
 * retiradas de la creación (cualquiera de los 7 días, ver
 * academico/horarios/index.blade.php), esta columna ya no tiene ningún
 * consumidor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->dropColumn('franjas_permitidas');
        });
    }

    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->json('franjas_permitidas')->nullable();
        });
    }
};
