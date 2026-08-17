<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->enum('estado', ['declarado', 'confirmado'])->default('confirmado')->after('nota');
            $table->string('comprobante_path')->nullable()->after('estado');
            $table->foreignId('confirmado_por')->nullable()->after('comprobante_path')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('confirmado_at')->nullable()->after('confirmado_por');
            $table->date('fecha_limite_pago')->nullable()->after('confirmado_at');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('confirmado_por');
            $table->dropColumn(['estado', 'comprobante_path', 'confirmado_at', 'fecha_limite_pago']);
        });
    }
};
