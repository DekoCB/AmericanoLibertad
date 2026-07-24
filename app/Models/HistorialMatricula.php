<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialMatricula extends Model
{
    protected $table = 'historial_matriculas';

    protected $fillable = [
        'matricula_id',
        'user_id',
        'campo',
        'valor_anterior',
        'valor_nuevo',
    ];

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
