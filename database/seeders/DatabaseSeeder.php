<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Asistencia;
use App\Models\Carrera;
use App\Models\Course;
use App\Models\Cuota;
use App\Models\Egreso;
use App\Models\Evaluation;
use App\Models\Horario;
use App\Models\Matricula;
use App\Models\PermisoDocente;
use App\Models\RecursoAula;
use App\Models\RegistroHoras;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const CARRERAS = [
        ['name' => 'Enfermería', 'code' => 'ENF'],
        ['name' => 'Farmacia', 'code' => 'FAR'],
        ['name' => 'Administración', 'code' => 'ADM'],
        ['name' => 'Fisioterapia y Rehabilitación', 'code' => 'FIS'],
    ];

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $carreras = collect(self::CARRERAS)->map(fn (array $carrera) => Carrera::create([
            ...$carrera,
            'total_ciclos' => 6,
        ]));

        $teachers = Teacher::factory(6)->create();

        $subjects = $carreras->flatMap(function (Carrera $carrera) {
            return collect(range(1, $carrera->total_ciclos))->flatMap(fn (int $ciclo) => Subject::factory(3)->create([
                'carrera_id' => $carrera->id,
                'ciclo' => $ciclo,
            ]));
        });

        $students = Student::factory(40)->create()->each(function (Student $student) use ($carreras) {
            $carrera = $carreras->random();

            $student->update([
                'carrera_id' => $carrera->id,
                'ciclo' => fake()->numberBetween(1, $carrera->total_ciclos),
                'turno' => fake()->randomElement(['mañana', 'tarde', 'noche']),
            ]);
        });

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
                            'score' => fake()->numberBetween(8, 20),
                        ]);
                    });
                });
        });

        $demoTeacher = Teacher::has('courses')->first() ?? $teachers->first();
        $demoStudent = Student::has('enrollments')->first() ?? $students->first();

        $matriculatedStudents = $students->random(25)->push($demoStudent)->unique('id');

        $matriculatedStudents->each(function (Student $student) {
            $this->seedMatricula($student);
        });

        $this->seedEgresos();

        $this->seedHorarios($courses);
        $this->seedAsistencias($courses);
        $this->seedRecursosAula($courses);
        $this->seedPagosDocentes($teachers);

        $this->createDemoUser('Gerencia Demo', 'test@example.com', UserRole::Gerencia);
        $this->createDemoUser('Secretaría Demo', 'administrativo@ejemplo.com', UserRole::Administrativo);
        $this->createDemoUser('Coordinador Demo', 'coordinador@ejemplo.com', UserRole::Coordinador);
        $this->createDemoUser('Académico Demo', 'academico@ejemplo.com', UserRole::Academico);
        $this->createDemoUser('Docente Demo', 'docente@ejemplo.com', UserRole::Docente, teacherId: $demoTeacher?->id);
        $this->createDemoUser('Estudiante Demo', 'estudiante@ejemplo.com', UserRole::Estudiante, studentId: $demoStudent?->id);
    }

    private function seedMatricula(Student $student): void
    {
        $ciclo = $student->ciclo ?? 1;

        $matricula = Matricula::create([
            'student_id' => $student->id,
            'carrera_id' => $student->carrera_id,
            'ciclo' => $ciclo,
            'turno' => $student->turno ?? 'mañana',
            'period' => '2026-I',
            'monto_matricula' => Matricula::montoSugerido($ciclo),
            'fecha_matricula' => now()->subMonths(random_int(1, 4)),
            'estado' => 'pendiente',
        ]);

        $cuotaMatricula = $matricula->cuotas()->create([
            'tipo' => 'matricula',
            'mes' => null,
            'monto_programado' => $matricula->monto_matricula,
            'monto_pagado' => 0,
            'fecha_vencimiento' => $matricula->fecha_matricula,
            'estado' => 'pendiente',
        ]);

        $cuotas = collect([$cuotaMatricula]);

        if ($ciclo > 1) {
            $meses = ['Marzo 2026', 'Abril 2026', 'Mayo 2026'];

            foreach (array_slice($meses, 0, random_int(1, 3)) as $index => $mes) {
                $cuotas->push($matricula->cuotas()->create([
                    'tipo' => 'pension',
                    'mes' => $mes,
                    'monto_programado' => 150,
                    'monto_pagado' => 0,
                    'fecha_vencimiento' => now()->addMonths($index)->endOfMonth(),
                    'estado' => 'pendiente',
                ]));
            }
        }

        $cuotas->each(function (Cuota $cuota) {
            $roll = fake()->numberBetween(1, 10);

            if ($roll <= 6) {
                $this->registrarPago($cuota, $cuota->monto_programado);
            } elseif ($roll <= 8) {
                $this->registrarPago($cuota, round($cuota->monto_programado * 0.5, 2));
            }

            $cuota->refresh();
            $cuota->actualizarEstado();
        });

        $matricula->refresh();
        $estados = $matricula->cuotas()->pluck('estado');

        $matricula->estado = match (true) {
            $estados->every(fn ($estado) => $estado === 'pagado') => 'pagado',
            $estados->contains(fn ($estado) => in_array($estado, ['parcial', 'pagado'], true)) => 'parcial',
            $estados->contains('vencido') => 'vencido',
            default => 'pendiente',
        };
        $matricula->save();
    }

    private function registrarPago(Cuota $cuota, float $monto): void
    {
        $medio = fake()->randomElement(['efectivo', 'yape', 'plin', 'tarjeta']);

        $montoEfectivo = $medio === 'efectivo' ? $monto : 0;
        $montoYape = $medio === 'yape' ? $monto : 0;

        $cuota->pagos()->create([
            'student_id' => $cuota->matricula->student_id,
            'registrado_por' => null,
            'monto' => $monto,
            'medio' => $medio,
            'monto_efectivo' => $montoEfectivo,
            'monto_yape' => $montoYape,
            'fecha' => fake()->dateTimeBetween('-2 months', 'now'),
            'nota' => null,
        ]);

        $cuota->increment('monto_pagado', $monto);
    }

    private function seedEgresos(): void
    {
        Egreso::factory(12)->create();
    }

    private function seedHorarios(Collection $courses): void
    {
        $courses->each(function (Course $course) {
            Horario::factory(random_int(1, 2))->create(['course_id' => $course->id]);
        });
    }

    private function seedAsistencias(Collection $courses): void
    {
        $fechas = collect(range(1, 2))->map(fn ($i) => now()->subWeeks($i)->toDateString());

        $courses->each(function (Course $course) use ($fechas) {
            $enrollments = $course->enrollments()->where('status', 'active')->get();

            $enrollments->each(function ($enrollment) use ($course, $fechas) {
                $fechas->each(function ($fecha) use ($course, $enrollment) {
                    $estado = fake()->randomElement(['presente', 'presente', 'presente', 'tardanza', 'falta']);

                    Asistencia::create([
                        'course_id' => $course->id,
                        'student_id' => $enrollment->student_id,
                        'fecha' => $fecha,
                        'estado' => $estado,
                        'hora_registro' => $estado === 'falta' ? null : now(),
                        'registrado_por' => null,
                    ]);
                });
            });
        });
    }

    private function seedRecursosAula(Collection $courses): void
    {
        $courses->each(function (Course $course) {
            RecursoAula::factory(random_int(2, 4))->create(['course_id' => $course->id]);
        });
    }

    private function seedPagosDocentes(Collection $teachers): void
    {
        $teachers->each(function (Teacher $teacher) {
            $courseIds = $teacher->courses()->pluck('id');

            $registrosPagados = collect(range(1, 4))->map(fn ($i) => RegistroHoras::create([
                'teacher_id' => $teacher->id,
                'course_id' => $courseIds->isNotEmpty() ? $courseIds->random() : null,
                'fecha' => now()->subMonths(2)->addDays($i * 5),
                'horas_academicas' => fake()->randomElement([2, 3, 4]),
                'minutos_tardanza' => fake()->randomElement([0, 0, 5, 10]),
                'nota' => null,
                'pagado' => false,
                'egreso_id' => null,
            ]));

            $montoNeto = $registrosPagados->sum(fn (RegistroHoras $r) => $r->montoNeto());

            if ($montoNeto > 0) {
                $egreso = Egreso::create([
                    'concepto' => "Pago docente: {$teacher->first_name} {$teacher->last_name} (histórico)",
                    'categoria' => 'pago_docente',
                    'monto' => $montoNeto,
                    'fecha' => now()->subMonths(2)->toDateString(),
                    'registrado_por' => null,
                ]);

                RegistroHoras::whereIn('id', $registrosPagados->pluck('id'))->update([
                    'pagado' => true,
                    'egreso_id' => $egreso->id,
                ]);
            }

            collect(range(1, 3))->each(fn ($i) => RegistroHoras::create([
                'teacher_id' => $teacher->id,
                'course_id' => $courseIds->isNotEmpty() ? $courseIds->random() : null,
                'fecha' => now()->subDays($i * 3),
                'horas_academicas' => fake()->randomElement([2, 3, 4]),
                'minutos_tardanza' => fake()->randomElement([0, 0, 5]),
                'nota' => null,
                'pagado' => false,
                'egreso_id' => null,
            ]));

            PermisoDocente::factory(random_int(1, 2))->create(['teacher_id' => $teacher->id]);
        });
    }

    private function createDemoUser(
        string $name,
        string $email,
        UserRole $role,
        ?int $teacherId = null,
        ?int $studentId = null,
    ): void {
        User::factory()->create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => $role,
            'teacher_id' => $teacherId,
            'student_id' => $studentId,
        ]);
    }
}
