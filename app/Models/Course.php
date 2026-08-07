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
}
