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
        Schema::create('registros_horas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->date('fecha');
            $table->decimal('horas_academicas', 5, 2);
            $table->unsignedInteger('minutos_tardanza')->default(0);
            $table->text('nota')->nullable();
            $table->boolean('pagado')->default(false);
            $table->foreignId('egreso_id')->nullable()->constrained('egresos')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registros_horas');
    }
};
