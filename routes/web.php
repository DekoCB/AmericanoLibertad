<?php

use App\Http\Controllers\AdmissionApplicationController;
use App\Http\Controllers\AsistenciaController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CuotaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EgresoController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\EntregaEvaluacionController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\MatriculaController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PermisoDocenteController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizIntentoController;
use App\Http\Controllers\QuizPreguntaController;
use App\Http\Controllers\RecursoAulaController;
use App\Http\Controllers\RegistroHorasController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\UserController;
use App\Models\Carrera;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'stats' => [
            'students' => Student::where('status', 'active')->count(),
            'teachers' => Teacher::count(),
            'subjects' => Subject::count(),
        ],
        'carreras' => Carrera::orderBy('name')->get(['name', 'code', 'total_ciclos']),
    ]);
});

Route::post('/contacto', [ContactMessageController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contacto.store');

Route::get('/admision', [AdmissionApplicationController::class, 'create'])->name('admision.create');
Route::post('/admision', [AdmissionApplicationController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('admision.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('students', StudentController::class)->except('show');
    Route::resource('teachers', TeacherController::class)->except('show');
    Route::resource('subjects', SubjectController::class)->except('show');
    Route::resource('courses', CourseController::class);
    Route::resource('users', UserController::class)->except('show');
    Route::resource('carreras', CarreraController::class)->except('show');

    Route::resource('matriculas', MatriculaController::class)->except('edit');
    Route::post('matriculas/{matricula}/cuotas', [CuotaController::class, 'store'])->name('matriculas.cuotas.store');
    Route::delete('matriculas/{matricula}/cuotas/{cuota}', [CuotaController::class, 'destroy'])->name('matriculas.cuotas.destroy');
    Route::post('cuotas/{cuota}/pagos', [PagoController::class, 'store'])->name('cuotas.pagos.store');
    Route::delete('cuotas/{cuota}/pagos/{pago}', [PagoController::class, 'destroy'])->name('cuotas.pagos.destroy');
    Route::get('pagos/{pago}/comprobante', [PagoController::class, 'comprobante'])->name('pagos.comprobante');
    Route::get('ingresos', [PagoController::class, 'index'])->name('ingresos.index');

    Route::resource('egresos', EgresoController::class)->except(['show', 'edit', 'update']);
    Route::get('caja', [CajaController::class, 'index'])->name('caja.index');

    Route::get('reportes', [ReporteController::class, 'index'])->name('reportes.index');
    Route::get('reportes/exportar', [ReporteController::class, 'exportar'])->name('reportes.exportar');

    Route::post('courses/{course}/enrollments', [EnrollmentController::class, 'store'])->name('courses.enrollments.store');
    Route::delete('courses/{course}/enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->name('courses.enrollments.destroy');

    Route::get('courses/{course}/evaluations/create', [EvaluationController::class, 'create'])->name('courses.evaluations.create');
    Route::post('courses/{course}/evaluations', [EvaluationController::class, 'store'])->name('courses.evaluations.store');
    Route::get('evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])->name('evaluations.edit');
    Route::put('evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('evaluations.update');
    Route::delete('evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluations.destroy');

    Route::get('evaluations/{evaluation}/grades', [GradeController::class, 'edit'])->name('evaluations.grades.edit');
    Route::put('evaluations/{evaluation}/grades', [GradeController::class, 'update'])->name('evaluations.grades.update');

    // Preguntas de cuestionario (docente/staff)
    Route::get('evaluations/{evaluation}/preguntas', [QuizPreguntaController::class, 'index'])->name('evaluations.preguntas.index');
    Route::post('evaluations/{evaluation}/preguntas', [QuizPreguntaController::class, 'store'])->name('evaluations.preguntas.store');
    Route::put('preguntas/{pregunta}', [QuizPreguntaController::class, 'update'])->name('preguntas.update');
    Route::delete('preguntas/{pregunta}', [QuizPreguntaController::class, 'destroy'])->name('preguntas.destroy');

    // Resolver cuestionario (estudiante)
    Route::get('evaluations/{evaluation}/resolver', [QuizIntentoController::class, 'create'])->name('evaluations.resolver');
    Route::post('evaluations/{evaluation}/resolver', [QuizIntentoController::class, 'store'])->name('evaluations.resolver.store');

    // Entrega de archivo (estudiante)
    Route::post('evaluations/{evaluation}/entrega', [EntregaEvaluacionController::class, 'store'])->name('evaluations.entrega.store');

    // Horarios
    Route::get('horarios', [HorarioController::class, 'index'])->name('horarios.index');
    Route::get('horarios/mi-horario/exportar', [HorarioController::class, 'exportarPropio'])
        ->name('horarios.propio.exportar');
    Route::post('horarios/aulas', [HorarioController::class, 'registrarAula'])->name('horarios.aulas.store');
    Route::get('horarios/aulas/{aula}/exportar', [HorarioController::class, 'exportarAula'])
        ->name('horarios.aulas.exportar');
    Route::post('horarios/aulas/{aula}/importar', [HorarioController::class, 'importarAula'])
        ->name('horarios.aulas.importar');

    // Asistencia por DNI/QR
    Route::get('asistencias', [AsistenciaController::class, 'cursos'])->name('asistencias.index');
    Route::get('asistencias/historial', [AsistenciaController::class, 'historial'])->name('asistencias.historial');
    Route::post('mis-asistencias/escanear', [AsistenciaController::class, 'escanearPropio'])->name('mis-asistencias.escanear');
    Route::get('courses/{course}/asistencias', [AsistenciaController::class, 'index'])->name('courses.asistencias.index');
    Route::post('courses/{course}/asistencias', [AsistenciaController::class, 'store'])->name('courses.asistencias.store');
    Route::post('courses/{course}/asistencias/escanear', [AsistenciaController::class, 'escanear'])->name('courses.asistencias.escanear');

    // Aula virtual
    Route::get('aula-virtual', [RecursoAulaController::class, 'index'])->name('aula-virtual.index');
    Route::get('aula-virtual/{course}', [RecursoAulaController::class, 'show'])->name('aula-virtual.show');
    Route::post('aula-virtual/{course}', [RecursoAulaController::class, 'store'])->name('aula-virtual.store');
    Route::delete('aula-virtual/{course}/{recurso}', [RecursoAulaController::class, 'destroy'])->name('aula-virtual.destroy');

    // Panel del docente: pagos y permisos
    Route::get('registros-horas', [RegistroHorasController::class, 'index'])->name('registros-horas.index');
    Route::post('registros-horas', [RegistroHorasController::class, 'store'])->name('registros-horas.store');
    Route::delete('registros-horas/{registroHora}', [RegistroHorasController::class, 'destroy'])->name('registros-horas.destroy');
    Route::post('registros-horas/generar-pago', [RegistroHorasController::class, 'generarPago'])->name('registros-horas.generar-pago');
    Route::get('registros-horas/comprobante/{egreso}', [RegistroHorasController::class, 'comprobante'])->name('registros-horas.comprobante');

    Route::get('permisos', [PermisoDocenteController::class, 'index'])->name('permisos.index');
    Route::post('permisos', [PermisoDocenteController::class, 'store'])->name('permisos.store');
    Route::patch('permisos/{permiso}', [PermisoDocenteController::class, 'update'])->name('permisos.update');
    Route::delete('permisos/{permiso}', [PermisoDocenteController::class, 'destroy'])->name('permisos.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/ayuda', fn () => Inertia::render('Help/Index'))->name('help');
});

require __DIR__.'/auth.php';
