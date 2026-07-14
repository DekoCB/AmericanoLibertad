<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard', [
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
}
