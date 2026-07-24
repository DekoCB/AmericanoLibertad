<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Teacher extends Model
{
    /** @use HasFactory<\Database\Factories\TeacherFactory> */
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'specialty',
        'tarifa_hora',
    ];

    protected function casts(): array
    {
        return [
            'specialty' => 'array',
        ];
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function registrosHoras(): HasMany
    {
        return $this->hasMany(RegistroHoras::class);
    }

    public function permisos(): HasMany
    {
        return $this->hasMany(PermisoDocente::class);
    }
}
