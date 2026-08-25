<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    /** @use HasFactory<\Database\Factories\CourseFactory> */
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'teacher_id',
        'name',
        'period',
        'periodo_academico_id',
        'schedule',
        'turno',
        'capacity',
        'objetivo_general',
        'mensaje_bienvenida',
        'modalidad',
        'sistema_evaluacion',
        'requisitos',
        'competencia_general',
        'competencias_especificas',
        'resultados_aprendizaje',
        'normas_curso',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function periodoAcademico(): BelongsTo
    {
        return $this->belongsTo(PeriodoAcademico::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class);
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(Asistencia::class);
    }

    public function recursosAula(): HasMany
    {
        return $this->hasMany(RecursoAula::class);
    }

    public function semanaContenidos(): HasMany
    {
        return $this->hasMany(SemanaContenido::class);
    }

    public function foroTemas(): HasMany
    {
        return $this->hasMany(ForoTema::class);
    }

    public function gruposNotas(): HasMany
    {
        return $this->hasMany(GrupoNotas::class);
    }

    protected static function booted(): void
    {
        static::created(function (Course $course) {
            $course->gruposNotas()->create([
                'nombre' => 'Promedio 1',
                'peso' => 50,
                'tipo' => 'promedio',
            ]);

            $course->gruposNotas()->create([
                'nombre' => 'Promedio 2',
                'peso' => 50,
                'tipo' => 'promedio',
            ]);

            $comportamiento = $course->gruposNotas()->create([
                'nombre' => 'Comportamiento',
                'peso' => 0,
                'tipo' => 'comportamiento',
            ]);

            $comportamiento->evaluaciones()->create([
                'course_id' => $course->id,
                'name' => 'Comportamiento',
                'type' => 'comportamiento',
                'weight' => 100,
                'date' => now()->toDateString(),
                'max_score' => 20,
            ]);
        });
    }
}
