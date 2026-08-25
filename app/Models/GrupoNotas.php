<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoNotas extends Model
{
    protected $table = 'grupos_notas';

    protected $fillable = [
        'course_id',
        'nombre',
        'peso',
        'tipo',
    ];

    protected function casts(): array
    {
        return [
            'peso' => 'float',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function evaluaciones(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'grupo_notas_id');
    }
}
