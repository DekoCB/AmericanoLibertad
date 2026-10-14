<?php

declare(strict_types=1);

namespace App\Modules\Asistencia\Models;

use App\Modules\Asistencia\Database\Factories\IngresoInstitutoFactory;
use App\Modules\Identidad\Support\Auditable;
use App\Modules\Matricula\Models\Estudiante;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Un registro por (estudiante, día): llegó físicamente al instituto hoy,
 * independiente de a qué curso le toque. No modela FALTA/JUSTIFICADO como
 * EstadoAsistenciaEnum -- no hay un roster esperado contra el cual comparar,
 * solo se crea una fila cuando el estudiante efectivamente escanea.
 *
 * @property int $id
 * @property int $estudiante_id
 * @property string $fecha formato Y-m-d; sin cast a Carbon, mismo criterio
 *                         que Asistencia::$fecha, para comparar contra
 *                         now()->format('Y-m-d') sin líos de zona horaria
 * @property bool $llego_tarde
 * @property-read Estudiante $estudiante
 */
class IngresoInstituto extends Model
{
    /** @use HasFactory<IngresoInstitutoFactory> */
    use Auditable, HasFactory;

    protected $table = 'ingresos_instituto';

    protected $fillable = [
        'estudiante_id',
        'fecha',
        'llego_tarde',
    ];

    protected function casts(): array
    {
        return [
            'llego_tarde' => 'boolean',
        ];
    }

    protected static function newFactory(): IngresoInstitutoFactory
    {
        return IngresoInstitutoFactory::new();
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class);
    }
}
