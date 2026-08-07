<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE recursos_aula MODIFY COLUMN tipo ENUM('enlace', 'archivo', 'anuncio', 'texto') NOT NULL DEFAULT 'anuncio'");
        }

        Schema::table('recursos_aula', function (Blueprint $table) {
            $table->boolean('es_complementario')->default(false)->after('es_principal');
        });
    }

    public function down(): void
    {
        Schema::table('recursos_aula', function (Blueprint $table) {
            $table->dropColumn('es_complementario');
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE recursos_aula MODIFY COLUMN tipo ENUM('enlace', 'archivo', 'anuncio') NOT NULL DEFAULT 'anuncio'");
        }
    }
};
