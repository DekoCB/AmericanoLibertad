<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('students', StudentController::class)->except('show');
    Route::resource('teachers', TeacherController::class)->except('show');
    Route::resource('subjects', SubjectController::class)->except('show');
    Route::resource('courses', CourseController::class);

    Route::post('courses/{course}/enrollments', [EnrollmentController::class, 'store'])->name('courses.enrollments.store');
    Route::delete('courses/{course}/enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->name('courses.enrollments.destroy');

    Route::get('courses/{course}/evaluations/create', [EvaluationController::class, 'create'])->name('courses.evaluations.create');
    Route::post('courses/{course}/evaluations', [EvaluationController::class, 'store'])->name('courses.evaluations.store');
    Route::get('evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])->name('evaluations.edit');
    Route::put('evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('evaluations.update');
    Route::delete('evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluations.destroy');

    Route::get('evaluations/{evaluation}/grades', [GradeController::class, 'edit'])->name('evaluations.grades.edit');
    Route::put('evaluations/{evaluation}/grades', [GradeController::class, 'update'])->name('evaluations.grades.update');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
