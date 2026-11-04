<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comportamientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('horario_id')->constrained('horarios')->cascadeOnDelete();
            $table->foreignId('estudiante_id')->constrained('estudiantes')->cascadeOnDelete();
            $table->decimal('nota_numerica', 4, 2);
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['horario_id', 'estudiante_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comportamientos');
    }
};
