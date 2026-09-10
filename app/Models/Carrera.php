<?php

namespace App\Models;

use App\Modules\Academico\Models\Curso;
use Database\Factories\CarreraFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carrera extends Model
{
    /** @use HasFactory<CarreraFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'total_ciclos',
        'imagen',
    ];

    protected function casts(): array
    {
        return [
            'total_ciclos' => 'integer',
        ];
    }

    public function admissionApplications(): HasMany
    {
        return $this->hasMany(AdmissionApplication::class);
    }

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class);
    }
}
