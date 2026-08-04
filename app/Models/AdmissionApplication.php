<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionApplication extends Model
{
    protected $fillable = [
        'apellido_paterno',
        'apellido_materno',
        'nombres',
        'dni',
        'sexo',
        'fecha_nacimiento',
        'telefono',
        'correo',
        'carrera_id',
        'turno',
        'colegio_procedencia',
        'lugar_procedencia',
        'apoderado_nombres',
        'apoderado_dni',
        'apoderado_parentesco',
        'apoderado_telefono',
        'apoderado_correo',
        'documento_dni_path',
        'documento_certificado_path',
        'documento_partida_path',
        'documento_foto_path',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
        ];
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class);
    }
}
