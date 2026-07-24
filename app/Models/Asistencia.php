<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asistencia extends Model
{
    /** @use HasFactory<\Database\Factories\AsistenciaFactory> */
    use HasFactory;

    protected $fillable = [
        'course_id',
        'student_id',
        'fecha',
        'estado',
        'hora_registro',
        'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'hora_registro' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public static function marcar(
        int $courseId,
        int $studentId,
        string $fecha,
        string $estado,
        ?int $registradoPor,
    ): self {
        $asistencia = static::where('course_id', $courseId)
            ->where('student_id', $studentId)
            ->whereDate('fecha', $fecha)
            ->first() ?? new static([
                'course_id' => $courseId,
                'student_id' => $studentId,
                'fecha' => $fecha,
            ]);

        $asistencia->fill([
            'estado' => $estado,
            'hora_registro' => now(),
            'registrado_por' => $registradoPor,
        ])->save();

        return $asistencia;
    }
}
