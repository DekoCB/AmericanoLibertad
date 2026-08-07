<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SemanaContenido extends Model
{
    protected $fillable = [
        'course_id',
        'semana',
        'titulo',
        'descripcion',
        'objetivo',
        'resultados_aprendizaje',
        'temas',
        'cierre_resumen',
    ];

    protected function casts(): array
    {
        return [
            'temas' => 'array',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
