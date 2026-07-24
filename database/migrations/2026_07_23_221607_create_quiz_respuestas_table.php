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
        Schema::create('quiz_respuestas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_intento_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_pregunta_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_opcion_id')->nullable()->constrained('quiz_opciones')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_respuestas');
    }
};
