<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroHoras extends Model
{
    /** @use HasFactory<\Database\Factories\RegistroHorasFactory> */
    use HasFactory;

    protected $table = 'registros_horas';

    protected $fillable = [
        'teacher_id',
        'course_id',
        'fecha',
        'horas_academicas',
        'minutos_tardanza',
        'nota',
        'pagado',
        'egreso_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'pagado' => 'boolean',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function egreso(): BelongsTo
    {
        return $this->belongsTo(Egreso::class);
    }

    public function montoBruto(): float
    {
        return round((float) $this->horas_academicas * (float) $this->teacher->tarifa_hora, 2);
    }

    public function descuentoTardanza(): float
    {
        return round((float) $this->minutos_tardanza * 1, 2);
    }

    public function montoNeto(): float
    {
        return round($this->montoBruto() - $this->descuentoTardanza(), 2);
    }
}
