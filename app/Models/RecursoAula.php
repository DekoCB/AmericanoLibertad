<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecursoAula extends Model
{
    /** @use HasFactory<\Database\Factories\RecursoAulaFactory> */
    use HasFactory;

    protected $table = 'recursos_aula';

    protected $fillable = [
        'course_id',
        'titulo',
        'tipo',
        'descripcion',
        'url',
        'creado_por',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
