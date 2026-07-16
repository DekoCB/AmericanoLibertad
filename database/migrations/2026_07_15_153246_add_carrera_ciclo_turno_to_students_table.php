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
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('carrera_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('ciclo')->nullable()->after('carrera_id');
            $table->enum('turno', ['mañana', 'tarde', 'noche'])->nullable()->after('ciclo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');
            $table->dropColumn(['ciclo', 'turno']);
        });
    }
};
