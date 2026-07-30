<?php

use App\Models\Course;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const PERIODOS = [
        '2025-1' => ['inicio' => '2025-03-01', 'fin' => '2025-07-15'],
        '2025-2' => ['inicio' => '2025-08-01', 'fin' => '2025-12-10'],
    ];

    public function up(): void
    {
        $subjects = Subject::inRandomOrder()->limit(8)->get();
        $teachers = Teacher::all();
        $students = Student::inRandomOrder()->limit(30)->get();

        if ($subjects->isEmpty() || $teachers->isEmpty() || $students->isEmpty()) {
            return;
        }

        foreach (self::PERIODOS as $period => $rango) {
            foreach ($subjects->random(4) as $subject) {
                $course = Course::factory()->create([
                    'subject_id' => $subject->id,
                    'teacher_id' => $teachers->random()->id,
                    'period' => $period,
                ]);

                $enrolledStudents = $students->random(min(15, $students->count()));

                foreach ($enrolledStudents as $student) {
                    $course->enrollments()->create([
                        'student_id' => $student->id,
                        'enrolled_at' => $rango['inicio'],
                        'status' => 'completed',
                    ]);
                }

                foreach ([1, 2, 3] as $numero) {
                    $evaluation = Evaluation::factory()->create([
                        'course_id' => $course->id,
                        'date' => fake()->dateTimeBetween($rango['inicio'], $rango['fin']),
                        'semana' => random_int(1, 16),
                    ]);

                    foreach ($enrolledStudents as $student) {
                        $evaluation->grades()->create([
                            'student_id' => $student->id,
                            'score' => random_int(8, 20),
                        ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        $courseIds = Course::whereIn('period', array_keys(self::PERIODOS))->pluck('id');

        DB::table('grades')
            ->whereIn('evaluation_id', DB::table('evaluations')->whereIn('course_id', $courseIds)->pluck('id'))
            ->delete();

        DB::table('evaluations')->whereIn('course_id', $courseIds)->delete();
        DB::table('enrollments')->whereIn('course_id', $courseIds)->delete();
        DB::table('courses')->whereIn('id', $courseIds)->delete();
    }
};
