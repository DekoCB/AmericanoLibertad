<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('qr_token', 40)->nullable()->unique()->after('document_number');
        });

        DB::table('students')->whereNull('qr_token')->get(['id'])->each(function ($student) {
            DB::table('students')->where('id', $student->id)->update([
                'qr_token' => (string) Str::uuid(),
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
