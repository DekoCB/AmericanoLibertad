<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class RecursoAula extends Model
{
    /** @use HasFactory<\Database\Factories\RecursoAulaFactory> */
    use HasFactory;

    protected $table = 'recursos_aula';

    protected $fillable = [
        'course_id',
        'semana',
        'titulo',
        'tipo',
        'entregable',
        'es_principal',
        'fecha_entrega',
        'descripcion',
        'url',
        'archivo',
        'archivo_nombre',
        'creado_por',
    ];

    protected $appends = ['archivo_url'];

    protected function casts(): array
    {
        return [
            'entregable' => 'boolean',
            'es_principal' => 'boolean',
            'fecha_entrega' => 'date',
        ];
    }

    protected function archivoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->archivo ? Storage::disk('public')->url($this->archivo) : null,
        );
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
