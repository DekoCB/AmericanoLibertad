<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizRespuesta extends Model
{
    protected $table = 'quiz_respuestas';

    protected $fillable = [
        'quiz_intento_id',
        'quiz_pregunta_id',
        'quiz_opcion_id',
    ];

    public function intento(): BelongsTo
    {
        return $this->belongsTo(QuizIntento::class, 'quiz_intento_id');
    }

    public function pregunta(): BelongsTo
    {
        return $this->belongsTo(QuizPregunta::class, 'quiz_pregunta_id');
    }

    public function opcion(): BelongsTo
    {
        return $this->belongsTo(QuizOpcion::class, 'quiz_opcion_id');
    }
}
