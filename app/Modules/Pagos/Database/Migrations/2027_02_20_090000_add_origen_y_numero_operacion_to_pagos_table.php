<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            // Nullable porque los pagos registrados antes de este cambio no
            // tienen estos datos; los nuevos los exige el formulario (ver
            // OrigenPagoEnum::disponiblesPara()/requiereNumeroOperacion()).
            $table->string('origen', 30)->nullable()->after('metodo');
            $table->string('numero_operacion', 50)->nullable()->after('origen');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn(['origen', 'numero_operacion']);
        });
    }
};
