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
        Schema::table('recursos_aula', function (Blueprint $table) {
            $table->unsignedTinyInteger('semana')->nullable()->after('course_id');
            $table->boolean('entregable')->default(false)->after('tipo');
            $table->date('fecha_entrega')->nullable()->after('entregable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recursos_aula', function (Blueprint $table) {
            $table->dropColumn(['semana', 'entregable', 'fecha_entrega']);
        });
    }
};
