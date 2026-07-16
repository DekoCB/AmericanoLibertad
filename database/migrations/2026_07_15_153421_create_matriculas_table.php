<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('matriculas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('carrera_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('ciclo');
            $table->enum('turno', ['mañana', 'tarde', 'noche']);
            $table->string('period');
            $table->decimal('monto_matricula', 8, 2);
            $table->date('fecha_matricula');
            $table->enum('estado', ['pendiente', 'parcial', 'pagado', 'vencido'])->default('pendiente');
            $table->timestamps();

            $table->unique(['student_id', 'ciclo', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matriculas');
    }
};
