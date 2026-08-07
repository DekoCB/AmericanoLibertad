<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semana_contenidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('semana');
            $table->string('titulo')->nullable();
            $table->text('descripcion')->nullable();
            $table->text('objetivo')->nullable();
            $table->text('resultados_aprendizaje')->nullable();
            $table->json('temas')->nullable();
            $table->text('cierre_resumen')->nullable();
            $table->timestamps();

            $table->unique(['course_id', 'semana']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semana_contenidos');
    }
};
