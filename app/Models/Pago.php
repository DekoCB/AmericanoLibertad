<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    /** @use HasFactory<\Database\Factories\PagoFactory> */
    use HasFactory;

    protected $fillable = [
        'cuota_id',
        'student_id',
        'registrado_por',
        'monto',
        'medio',
        'monto_efectivo',
        'monto_yape',
        'fecha',
        'nota',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'monto' => 'float',
            'monto_efectivo' => 'float',
            'monto_yape' => 'float',
        ];
    }

    public function cuota(): BelongsTo
    {
        return $this->belongsTo(Cuota::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
