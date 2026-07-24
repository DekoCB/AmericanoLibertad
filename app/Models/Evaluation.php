<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluation extends Model
{
    /** @use HasFactory<\Database\Factories\EvaluationFactory> */
    use HasFactory;

    protected $fillable = [
        'course_id',
        'name',
        'type',
        'weight',
        'date',
        'semana',
        'max_score',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'max_score' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function quizPreguntas(): HasMany
    {
        return $this->hasMany(QuizPregunta::class)->orderBy('orden');
    }

    public function quizIntentos(): HasMany
    {
        return $this->hasMany(QuizIntento::class);
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(EntregaEvaluacion::class);
    }
}
