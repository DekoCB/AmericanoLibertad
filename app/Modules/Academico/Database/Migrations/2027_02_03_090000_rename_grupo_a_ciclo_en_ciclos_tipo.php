<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * TipoCicloEnum::GRUPO_1..4 ('grupo_1'..'grupo_4') pasa a CICLO_1..4
 * ('ciclo_1'..'ciclo_4') -- solo la terminología visible cambia ("Grupo" ->
 * "Ciclo"), el modelo Ciclo y su tabla ya se llamaban así. ciclos.tipo es
 * un varchar plano, no un enum de base de datos, así que solo hace falta
 * actualizar los valores ya guardados.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (range(1, 4) as $numero) {
            DB::table('ciclos')->where('tipo', "grupo_{$numero}")->update(['tipo' => "ciclo_{$numero}"]);
        }
    }

    public function down(): void
    {
        foreach (range(1, 4) as $numero) {
            DB::table('ciclos')->where('tipo', "ciclo_{$numero}")->update(['tipo' => "grupo_{$numero}"]);
        }
    }
};
