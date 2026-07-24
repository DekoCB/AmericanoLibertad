<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('evaluations')->orderBy('id')->get(['id', 'max_score'])->each(function ($evaluation) {
            $oldMax = (float) $evaluation->max_score;

            if ($oldMax > 0 && $oldMax !== 20.0) {
                $ratio = 20 / $oldMax;

                DB::table('grades')
                    ->where('evaluation_id', $evaluation->id)
                    ->get(['id', 'score'])
                    ->each(function ($grade) use ($ratio) {
                        DB::table('grades')
                            ->where('id', $grade->id)
                            ->update(['score' => round($grade->score * $ratio, 2)]);
                    });
            }

            DB::table('evaluations')->where('id', $evaluation->id)->update(['max_score' => 20]);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE evaluations MODIFY max_score DECIMAL(5, 2) NOT NULL DEFAULT 20');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE evaluations MODIFY max_score DECIMAL(5, 2) NOT NULL DEFAULT 100');
        }
    }
};
