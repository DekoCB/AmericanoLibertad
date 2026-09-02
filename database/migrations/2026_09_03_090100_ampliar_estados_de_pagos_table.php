<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ahora TODO pago (no solo los que declara el estudiante) queda pendiente de
 * aprobación hasta que Gerencia/Administrativo lo confirme o lo rechace.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE pagos MODIFY estado ENUM('declarado', 'confirmado', 'pendiente', 'rechazado') NOT NULL DEFAULT 'confirmado'");
        DB::statement("UPDATE pagos SET estado = 'pendiente' WHERE estado = 'declarado'");
        DB::statement("ALTER TABLE pagos MODIFY estado ENUM('pendiente', 'confirmado', 'rechazado') NOT NULL DEFAULT 'pendiente'");

        Schema::table('pagos', function (Blueprint $table) {
            $table->string('motivo_rechazo')->nullable()->after('confirmado_at');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn('motivo_rechazo');
        });

        DB::statement("ALTER TABLE pagos MODIFY estado ENUM('pendiente', 'confirmado', 'rechazado', 'declarado') NOT NULL DEFAULT 'confirmado'");
        DB::statement("UPDATE pagos SET estado = 'declarado' WHERE estado IN ('pendiente', 'rechazado')");
        DB::statement("ALTER TABLE pagos MODIFY estado ENUM('declarado', 'confirmado') NOT NULL DEFAULT 'confirmado'");
    }
};
