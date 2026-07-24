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
            $table->string('archivo')->nullable()->after('url');
            $table->string('archivo_nombre')->nullable()->after('archivo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recursos_aula', function (Blueprint $table) {
            $table->dropColumn(['archivo', 'archivo_nombre']);
        });
    }
};
