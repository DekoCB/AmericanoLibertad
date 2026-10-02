<?php

declare(strict_types=1);

namespace App\Modules\Matricula\Models;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\Periodo;
use App\Modules\Identidad\Support\Auditable;
use App\Modules\Matricula\Database\Factories\MatriculaFactory;
use App\Modules\Matricula\Enums\EstadoMatriculaEnum;
use App\Modules\Matricula\Enums\ModalidadEstudioEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * @property int $id
 * @property int $estudiante_id
 * @property int $ciclo_id
 * @property int $carrera_id
 * @property int $ciclo_curricular
 * @property ModalidadEstudioEnum $modalidad_estudio
 * @property int|null $siagie_id
 * @property Carbon $fecha_matricula
 * @property Carbon|null $fecha_fin_estudio
 * @property EstadoMatriculaEnum $estado
 * @property-read Estudiante|null $estudiante
 * @property-read Ciclo $ciclo
 * @property-read Carrera $carrera
 * @property-read Periodo|null $periodo
 */
class Matricula extends Model implements HasMedia
{
    /** @use HasFactory<MatriculaFactory> */
    use Auditable, HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'estudiante_id',
        'ciclo_id',
        'carrera_id',
        'ciclo_curricular',
        'modalidad_estudio',
        'siagie_id',
        'fecha_matricula',
        'fecha_fin_estudio',
        'estado',
        'observaciones',
        'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'fecha_matricula' => 'date',
            'fecha_fin_estudio' => 'date',
            'estado' => EstadoMatriculaEnum::class,
            'modalidad_estudio' => ModalidadEstudioEnum::class,
        ];
    }

    protected static function newFactory(): MatriculaFactory
    {
        return MatriculaFactory::new();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('ficha')->singleFile();
        $this->addMediaCollection('constancia')->singleFile();
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class);
    }

    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(Ciclo::class);
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class);
    }

    /**
     * Los horarios específicos (uno por curso, como máximo) que se le
     * asignaron explícitamente a esta matrícula -- solo hace falta usarlo
     * cuando un curso tiene varias secciones/paralelos; ver
     * scopeDelHorario() para cómo se usa esto en la práctica.
     *
     * @return BelongsToMany<Horario, $this>
     */
    public function horarios(): BelongsToMany
    {
        return $this->belongsToMany(Horario::class, 'matricula_horario');
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    /**
     * Los cursos que esta matrícula está repitiendo por haberlos
     * desaprobado en un ciclo anterior -- ver MatriculaRefuerzo.
     *
     * @return HasMany<MatriculaRefuerzo, $this>
     */
    public function refuerzos(): HasMany
    {
        return $this->hasMany(MatriculaRefuerzo::class);
    }

    /**
     * Todos los horarios de esta matrícula: los de la cohorte normal
     * (mismo carrera+ciclo_curricular+ciclo, ver Horario::scopeDeLaMatricula())
     * más los de cualquier curso en recuperación que ya tenga sección
     * asignada. Punto único de integración para los módulos que arman "qué
     * cursos tiene este estudiante" por estudiante individual (Evaluaciones,
     * Aula Virtual, Asistencia, Incidencias, Libreta, Reportes por
     * estudiante) -- sin esto, un curso en recuperación quedaría invisible
     * para esos módulos porque su ciclo_curricular no calza con el de la
     * matrícula.
     *
     * @return EloquentCollection<int, Horario>
     */
    public function todosLosHorarios(): EloquentCollection
    {
        $deRefuerzo = $this->refuerzos()
            ->whereNotNull('horario_id')
            ->with('horario')
            ->get()
            ->pluck('horario');

        return Horario::query()->deLaMatricula($this)->get()->merge($deRefuerzo);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'siagie_id');
    }

    /**
     * Texto para mostrar el periodo SIAGIE de esta matrícula (p. ej.
     * "2026-1", "2026-2", "2026 Anual"). Null si todavía no se registró
     * ningún periodo para esta matrícula.
     */
    public function periodoCompleto(): ?string
    {
        return $this->periodo?->nombreCompleto();
    }

    /**
     * Las matrículas que cuentan para un horario dado: misma carrera, ciclo
     * curricular y ciclo (periodo de matrícula), aprobadas.
     *
     * Cuando el curso de este horario tiene paralelos (otro Horario con el
     * mismo curso_id+carrera_id+ciclo_curricular+ciclo_id), esa coincidencia
     * ya no basta para saber a cuál sección pertenece cada estudiante: ahí
     * además se exige la asignación explícita en matricula_horario. Si el
     * curso no tiene paralelos, nadie necesita asignación (sigue siendo
     * automático, como antes).
     */
    public function scopeDelHorario(Builder $query, Horario $horario): Builder
    {
        $tieneParalelos = Horario::query()
            ->where('curso_id', $horario->curso_id)
            ->where('carrera_id', $horario->carrera_id)
            ->where('ciclo_curricular', $horario->ciclo_curricular)
            ->where('ciclo_id', $horario->ciclo_id)
            ->where('id', '!=', $horario->id)
            ->exists();

        return $query->where('carrera_id', $horario->carrera_id)
            ->where('ciclo_curricular', $horario->ciclo_curricular)
            ->where('ciclo_id', $horario->ciclo_id)
            ->where('estado', 'aprobada')
            ->when(
                $tieneParalelos,
                fn (Builder $q) => $q->whereHas('horarios', fn (Builder $qq) => $qq->where('horarios.id', $horario->id)),
            );
    }
}
