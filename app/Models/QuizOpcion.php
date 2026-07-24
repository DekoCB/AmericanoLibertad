<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizOpcion extends Model
{
    protected $table = 'quiz_opciones';

    protected $fillable = [
        'quiz_pregunta_id',
        'texto',
        'es_correcta',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'es_correcta' => 'boolean',
        ];
    }

    public function pregunta(): BelongsTo
    {
        return $this->belongsTo(QuizPregunta::class, 'quiz_pregunta_id');
    }
}
