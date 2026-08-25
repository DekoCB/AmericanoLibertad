<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grupos_notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');
            $table->decimal('peso', 5, 2)->default(0);
            $table->enum('tipo', ['promedio', 'comportamiento'])->default('promedio');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grupos_notas');
    }
};
