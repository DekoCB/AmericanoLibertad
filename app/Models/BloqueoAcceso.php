<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloqueoAcceso extends Model
{
    protected $table = 'bloqueos_acceso';

    protected $fillable = [
        'student_id',
        'motivo',
        'fecha_bloqueo',
        'fecha_desbloqueo',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_bloqueo' => 'datetime',
            'fecha_desbloqueo' => 'datetime',
            'activo' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
