<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === UserRole::Docente) {
            return $this->docenteDashboard($user);
        }

        if ($user->role === UserRole::Estudiante) {
            return $this->estudianteDashboard($user);
        }

        return $this->staffDashboard();
    }

    private function staffDashboard(): Response
    {
        return Inertia::render('Dashboard', [
            'view' => 'staff',
            'stats' => [
                'students' => Student::count(),
                'activeStudents' => Student::where('status', 'active')->count(),
                'teachers' => Teacher::count(),
                'subjects' => Subject::count(),
                'courses' => Course::count(),
                'activeEnrollments' => Enrollment::where('status', 'active')->count(),
                'averageScore' => round((float) Grade::avg('score'), 1),
            ],
            'recentEnrollments' => Enrollment::with(['student', 'course.subject'])
                ->latest('enrolled_at')
                ->limit(6)
                ->get(),
            'upcomingEvaluations' => Evaluation::with('course.subject')
                ->whereDate('date', '>=', now())
                ->orderBy('date')
                ->limit(6)
                ->get(),
        ]);
    }

    private function docenteDashboard(User $user): Response
    {
        $courses = Course::query()
            ->with('subject')
            ->withCount('enrollments')
            ->where('teacher_id', $user->teacher_id)
            ->orderByDesc('period')
            ->get();

        $courseIds = $courses->pluck('id');

        return Inertia::render('Dashboard', [
            'view' => 'docente',
            'stats' => [
                'courses' => $courses->count(),
                'students' => Enrollment::whereIn('course_id', $courseIds)
                    ->where('status', 'active')
                    ->distinct('student_id')
                    ->count('student_id'),
                'evaluations' => Evaluation::whereIn('course_id', $courseIds)->count(),
            ],
            'myCourses' => $courses,
            'upcomingEvaluations' => Evaluation::with('course.subject')
                ->whereIn('course_id', $courseIds)
                ->whereDate('date', '>=', now())
                ->orderBy('date')
                ->limit(6)
                ->get(),
        ]);
    }

    private function estudianteDashboard(User $user): Response
    {
        $enrollments = Enrollment::with(['course.subject', 'course.teacher'])
            ->where('student_id', $user->student_id)
            ->where('status', 'active')
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $grades = Grade::with('evaluation.course.subject')
            ->where('student_id', $user->student_id)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'view' => 'estudiante',
            'stats' => [
                'courses' => $enrollments->count(),
                'averageScore' => round((float) Grade::where('student_id', $user->student_id)->avg('score'), 1),
            ],
            'myCourses' => $enrollments->pluck('course'),
            'myGrades' => $grades,
            'upcomingEvaluations' => Evaluation::with('course.subject')
                ->whereIn('course_id', $courseIds)
                ->whereDate('date', '>=', now())
                ->orderBy('date')
                ->limit(6)
                ->get(),
        ]);
    }
}
