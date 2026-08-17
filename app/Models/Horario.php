<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Horario extends Model
{
    /** @use HasFactory<\Database\Factories\HorarioFactory> */
    use HasFactory;

    protected $fillable = [
        'course_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'aula',
        'aula_id',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function aulaRef(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }
}
