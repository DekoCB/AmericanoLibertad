<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Subject extends Model
{
    /** @use HasFactory<\Database\Factories\SubjectFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'credit_hours',
        'carrera_id',
        'ciclo',
        'imagen_path',
    ];

    protected $appends = [
        'imagen_url',
    ];

    protected function imagenUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->imagen_path ? Storage::disk('public')->url($this->imagen_path) : null,
        );
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class);
    }
}
