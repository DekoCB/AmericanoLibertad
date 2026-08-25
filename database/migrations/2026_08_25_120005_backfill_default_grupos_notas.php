<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        $courseIds = DB::table('courses')
            ->whereNotIn('id', DB::table('grupos_notas')->select('course_id'))
            ->pluck('id');

        foreach ($courseIds as $courseId) {
            DB::table('grupos_notas')->insert([
                'course_id' => $courseId,
                'nombre' => 'Promedio 1',
                'peso' => 50,
                'tipo' => 'promedio',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('grupos_notas')->insert([
                'course_id' => $courseId,
                'nombre' => 'Promedio 2',
                'peso' => 50,
                'tipo' => 'promedio',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $comportamientoId = DB::table('grupos_notas')->insertGetId([
                'course_id' => $courseId,
                'nombre' => 'Comportamiento',
                'peso' => 0,
                'tipo' => 'comportamiento',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('evaluations')->insert([
                'course_id' => $courseId,
                'grupo_notas_id' => $comportamientoId,
                'name' => 'Comportamiento',
                'type' => 'comportamiento',
                'weight' => 100,
                'date' => $now->toDateString(),
                'semana' => null,
                'max_score' => 20,
                'intentos_permitidos' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('evaluations')->where('type', 'comportamiento')->delete();
        DB::table('grupos_notas')->delete();
    }
};
