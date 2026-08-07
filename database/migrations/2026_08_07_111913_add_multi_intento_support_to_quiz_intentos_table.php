<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_intentos', function (Blueprint $table) {
            $table->index('evaluation_id', 'quiz_intentos_evaluation_id_index');
            $table->index('student_id', 'quiz_intentos_student_id_index');
        });

        Schema::table('quiz_intentos', function (Blueprint $table) {
            $table->dropUnique(['evaluation_id', 'student_id']);
            $table->timestamp('enviado_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_intentos', function (Blueprint $table) {
            $table->timestamp('enviado_at')->nullable(false)->change();
            $table->unique(['evaluation_id', 'student_id']);
        });

        Schema::table('quiz_intentos', function (Blueprint $table) {
            $table->dropIndex('quiz_intentos_evaluation_id_index');
            $table->dropIndex('quiz_intentos_student_id_index');
        });
    }
};
