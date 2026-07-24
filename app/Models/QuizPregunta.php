<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizPregunta extends Model
{
    protected $table = 'quiz_preguntas';

    protected $fillable = [
        'evaluation_id',
        'texto',
        'orden',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function opciones(): HasMany
    {
        return $this->hasMany(QuizOpcion::class);
    }
}
