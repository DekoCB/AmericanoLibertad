<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $teachers = Teacher::factory(6)->create();
        $subjects = Subject::factory(10)->create();
        $students = Student::factory(40)->create();

        $courses = $subjects->flatMap(function (Subject $subject) use ($teachers) {
            return Course::factory(2)->create([
                'subject_id' => $subject->id,
                'teacher_id' => $teachers->random()->id,
            ]);
        });

        $courses->each(function (Course $course) use ($students) {
            $enrolledStudents = $students->random(random_int(10, 20));

            $enrolledStudents->each(function (Student $student) use ($course) {
                $course->enrollments()->create([
                    'student_id' => $student->id,
                    'enrolled_at' => now()->subMonths(random_int(1, 6)),
                    'status' => 'active',
                ]);
            });

            Evaluation::factory(3)->create(['course_id' => $course->id])
                ->each(function (Evaluation $evaluation) use ($enrolledStudents) {
                    $enrolledStudents->each(function (Student $student) use ($evaluation) {
                        $evaluation->grades()->create([
                            'student_id' => $student->id,
                            'score' => fake()->randomFloat(2, 40, 100),
                        ]);
                    });
                });
        });
    }
}
