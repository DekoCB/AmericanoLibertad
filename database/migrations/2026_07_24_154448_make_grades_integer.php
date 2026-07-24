<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('UPDATE grades SET score = ROUND(score)');
        DB::statement('ALTER TABLE grades MODIFY score TINYINT UNSIGNED NOT NULL');

        DB::statement('UPDATE evaluations SET max_score = ROUND(max_score)');
        DB::statement('ALTER TABLE evaluations MODIFY max_score TINYINT UNSIGNED NOT NULL DEFAULT 20');

        DB::statement('UPDATE quiz_intentos SET puntaje = ROUND(puntaje)');
        DB::statement('ALTER TABLE quiz_intentos MODIFY puntaje TINYINT UNSIGNED NOT NULL');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE grades MODIFY score DECIMAL(5, 2) NOT NULL');
        DB::statement('ALTER TABLE evaluations MODIFY max_score DECIMAL(5, 2) NOT NULL DEFAULT 20');
        DB::statement('ALTER TABLE quiz_intentos MODIFY puntaje DECIMAL(8, 2) NOT NULL');
    }
};
