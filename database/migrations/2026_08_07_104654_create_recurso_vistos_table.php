<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurso_vistos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recurso_aula_id')->constrained('recursos_aula')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->timestamp('visto_at')->useCurrent();

            $table->unique(['recurso_aula_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurso_vistos');
    }
};
