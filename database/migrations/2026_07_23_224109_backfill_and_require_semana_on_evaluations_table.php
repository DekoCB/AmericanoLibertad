<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('UPDATE evaluations SET semana = FLOOR(1 + RAND() * 16) WHERE semana IS NULL');

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE evaluations MODIFY semana TINYINT UNSIGNED NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE evaluations MODIFY semana TINYINT UNSIGNED NULL');
        }
    }
};
