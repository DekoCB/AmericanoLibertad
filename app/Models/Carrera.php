<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Carrera extends Model
{
    /** @use HasFactory<\Database\Factories\CarreraFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'total_ciclos',
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

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }
}
