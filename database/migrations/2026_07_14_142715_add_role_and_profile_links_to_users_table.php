<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('estudiante')->after('email');
            $table->foreignId('teacher_id')->nullable()->after('role')->constrained()->nullOnDelete();
            $table->foreignId('student_id')->nullable()->after('teacher_id')->constrained()->nullOnDelete();

            $table->unique('teacher_id');
            $table->unique('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_id');
            $table->dropConstrainedForeignId('student_id');
            $table->dropColumn('role');
        });
    }
};
