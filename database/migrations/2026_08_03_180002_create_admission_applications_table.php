<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();

            // Estudiante
            $table->string('apellido_paterno');
            $table->string('apellido_materno');
            $table->string('nombres');
            $table->string('dni', 15);
            $table->enum('sexo', ['masculino', 'femenino']);
            $table->date('fecha_nacimiento')->nullable();
            $table->string('telefono')->nullable();
            $table->string('correo')->nullable();
            $table->foreignId('carrera_id')->constrained('carreras');
            $table->enum('turno', ['mañana', 'tarde', 'noche']);
            $table->string('colegio_procedencia')->nullable();
            $table->string('lugar_procedencia')->nullable();

            // Apoderado
            $table->string('apoderado_nombres')->nullable();
            $table->string('apoderado_dni', 15)->nullable();
            $table->string('apoderado_parentesco')->nullable();
            $table->string('apoderado_telefono')->nullable();
            $table->string('apoderado_correo')->nullable();

            // Documentos (rutas en storage)
            $table->string('documento_dni_path')->nullable();
            $table->string('documento_certificado_path')->nullable();
            $table->string('documento_partida_path')->nullable();
            $table->string('documento_foto_path')->nullable();

            $table->enum('estado', ['pendiente', 'revisado', 'aceptado', 'rechazado'])
                ->default('pendiente');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};
