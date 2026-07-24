<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizIntento extends Model
{
    protected $table = 'quiz_intentos';

    protected $fillable = [
        'evaluation_id',
        'student_id',
        'puntaje',
        'enviado_at',
    ];

    protected function casts(): array
    {
        return [
            'puntaje' => 'integer',
            'enviado_at' => 'datetime',
        ];
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function respuestas(): HasMany
    {
        return $this->hasMany(QuizRespuesta::class);
    }
}
