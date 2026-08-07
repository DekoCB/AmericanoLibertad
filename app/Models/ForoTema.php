<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForoTema extends Model
{
    protected $fillable = [
        'course_id',
        'semana',
        'titulo',
        'pregunta',
        'creado_por',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function respuestas(): HasMany
    {
        return $this->hasMany(ForoRespuesta::class)->orderBy('created_at');
    }
}
