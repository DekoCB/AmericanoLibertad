<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matricula_refuerzos', function (Blueprint $table) {
            $table->id();
            // La matrícula DESTINO (la nueva, avanzada) a la que queda
            // colgado el curso que se repite -- no se crea una matrícula
            // aparte para el curso jalado, ver MatriculaService::matricular()
            // (una sola matrícula por estudiante y ciclo académico).
            $table->foreignId('matricula_id')->constrained('matriculas')->cascadeOnDelete();
            // El curso que se repite. Su propio ciclo_curricular puede ser
            // menor al de la matrícula -- es justamente lo que se quiere
            // reflejar (un curso de ciclo II arrastrado mientras se avanza
            // a ciclo III).
            $table->foreignId('curso_id')->constrained('cursos')->restrictOnDelete();
            // La sección para repetirlo este periodo. Null mientras no se
            // asigna (mismo patrón que "Sin asignar -- elige sección" en
            // Ficha de Estudiante).
            $table->foreignId('horario_id')->nullable()->constrained('horarios')->nullOnDelete();
            $table->string('estado');
            // En qué matrícula se desaprobó originalmente, solo para
            // trazabilidad -- no se usa para ninguna regla de negocio.
            $table->foreignId('matricula_origen_id')->nullable()->constrained('matriculas')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matricula_refuerzos');
    }
};
