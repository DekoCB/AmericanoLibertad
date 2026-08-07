<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecursoVisto extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'recurso_aula_id',
        'student_id',
    ];

    protected function casts(): array
    {
        return [
            'visto_at' => 'datetime',
        ];
    }

    public function recurso(): BelongsTo
    {
        return $this->belongsTo(RecursoAula::class, 'recurso_aula_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
