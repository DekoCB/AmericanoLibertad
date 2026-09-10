<?php

declare(strict_types=1);

namespace App\Modules\Academico\Models;

use App\Models\Carrera;
use App\Modules\Academico\Database\Factories\CursoFactory;
use App\Modules\Identidad\Support\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * Un curso "de grado" (grado_id, el modelo EBA heredado de CEBA) y un curso
 * "de carrera" (carrera_id + modulo_numero/nombre + ciclo_curricular, el
 * currículo real del instituto por módulos y ciclos I-VI) son dos formas
 * de uso de esta misma tabla que hoy conviven sin mezclarse -- ningún
 * curso tiene ambos a la vez. Ver la migración
 * 2026_09_11_090000_add_carrera_curricular_a_cursos_table.
 *
 * @property int $id
 * @property int|null $grado_id
 * @property int|null $carrera_id
 * @property int|null $modulo_numero
 * @property string|null $modulo_nombre
 * @property int|null $ciclo_curricular
 * @property string $nombre
 * @property string $codigo
 * @property float|null $creditos
 */
class Curso extends Model implements HasMedia
{
    /** @use HasFactory<CursoFactory> */
    use Auditable, HasFactory, InteractsWithMedia;

    protected $fillable = [
        'nombre',
        'codigo',
        'grado_id',
        'carrera_id',
        'modulo_numero',
        'modulo_nombre',
        'ciclo_curricular',
        'creditos',
        'horas',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'creditos' => 'float',
        ];
    }

    protected static function newFactory(): CursoFactory
    {
        return CursoFactory::new();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('portada')->singleFile();
    }

    public function grado(): BelongsTo
    {
        return $this->belongsTo(Grado::class);
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class);
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class);
    }

    /**
     * "I" a "VI": cómo se muestra ciclo_curricular en la UI, que en la
     * currícula real del instituto siempre se nombra en números romanos.
     */
    public function cicloRomano(): ?string
    {
        if ($this->ciclo_curricular === null) {
            return null;
        }

        $romanos = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        return $romanos[$this->ciclo_curricular] ?? (string) $this->ciclo_curricular;
    }

    /**
     * Ícono Heroicon (sin el prefijo "heroicon-o-") que representa al curso
     * mientras no exista una imagen propia. Ver <x-curso-portada>.
     */
    public function iconoRepresentativo(): string
    {
        $nombre = str_replace(
            ['á', 'é', 'í', 'ó', 'ú'],
            ['a', 'e', 'i', 'o', 'u'],
            mb_strtolower($this->nombre),
        );

        return match (true) {
            str_contains($nombre, 'matemat') => 'calculator',
            str_contains($nombre, 'comunicac') => 'chat-bubble-left-right',
            str_contains($nombre, 'ingles'), str_contains($nombre, 'idioma') => 'language',
            str_contains($nombre, 'ciencias sociales'), str_contains($nombre, 'historia'), str_contains($nombre, 'geografia') => 'globe-americas',
            str_contains($nombre, 'tecnolog'), str_contains($nombre, 'ciencias naturales') => 'beaker',
            str_contains($nombre, 'computo'), str_contains($nombre, 'computacion'), str_contains($nombre, 'informatica') => 'computer-desktop',
            str_contains($nombre, 'arte') => 'paint-brush',
            str_contains($nombre, 'musica') => 'musical-note',
            str_contains($nombre, 'educacion fisica'), str_contains($nombre, 'deporte') => 'trophy',
            str_contains($nombre, 'religio') => 'academic-cap',
            str_contains($nombre, 'desarrollo personal'), str_contains($nombre, 'ciudadano') => 'user-circle',
            str_contains($nombre, 'para el trabajo') => 'briefcase',
            default => 'book-open',
        };
    }
}
