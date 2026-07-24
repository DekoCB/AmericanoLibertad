<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntregaEvaluacion extends Model
{
    protected $table = 'entregas_evaluacion';

    protected $fillable = [
        'evaluation_id',
        'student_id',
        'archivo',
        'nombre_original',
        'enviado_at',
    ];

    protected function casts(): array
    {
        return [
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
}
