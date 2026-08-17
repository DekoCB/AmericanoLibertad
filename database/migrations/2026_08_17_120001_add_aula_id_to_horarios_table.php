<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            $table->foreignId('aula_id')->nullable()->after('aula')
                ->constrained('aulas')->nullOnDelete();
        });

        DB::table('horarios')
            ->whereNotNull('aula')
            ->where('aula', '!=', '')
            ->orderBy('id')
            ->select('id', 'aula')
            ->get()
            ->each(function ($horario) {
                $aulaId = DB::table('aulas')->where('nombre', $horario->aula)->value('id');

                if (! $aulaId) {
                    $aulaId = DB::table('aulas')->insertGetId([
                        'nombre' => $horario->aula,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('horarios')->where('id', $horario->id)->update(['aula_id' => $aulaId]);
            });
    }

    public function down(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('aula_id');
        });
    }
};
