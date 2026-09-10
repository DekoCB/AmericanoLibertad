<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->string('apellido_paterno', 100);
            $table->string('apellido_materno', 100);
            $table->string('nombres', 150);
            $table->string('dni', 15);
            $table->enum('sexo', ['masculino', 'femenino']);
            $table->date('fecha_nacimiento')->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('correo', 150)->nullable();
            $table->foreignId('carrera_id')->constrained('carreras')->restrictOnDelete();
            $table->enum('turno', ['mañana', 'tarde', 'noche']);
            $table->string('colegio_procedencia', 200)->nullable();
            $table->string('lugar_procedencia', 200)->nullable();
            $table->string('apoderado_nombres', 200)->nullable();
            $table->string('apoderado_dni', 15)->nullable();
            $table->string('apoderado_parentesco', 50)->nullable();
            $table->string('apoderado_telefono', 20)->nullable();
            $table->string('apoderado_correo', 150)->nullable();
            $table->string('documento_dni_path')->nullable();
            $table->string('documento_certificado_path')->nullable();
            $table->string('documento_partida_path')->nullable();
            $table->string('documento_foto_path')->nullable();
            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};
