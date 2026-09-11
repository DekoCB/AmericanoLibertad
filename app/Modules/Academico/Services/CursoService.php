<?php

declare(strict_types=1);

namespace App\Modules\Academico\Services;

use App\Models\Carrera;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Repositories\Contracts\CursoRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CursoService
{
    public function __construct(
        private readonly CursoRepositoryInterface $cursos,
    ) {}

    public function listar(int $perPage = 15): LengthAwarePaginator
    {
        return $this->cursos->paginate($perPage);
    }

    /**
     * @param  array{nombre: string, codigo: string, carrera_id: int, ciclo_curricular: int, horas: int}  $datos
     */
    public function crear(array $datos): Curso
    {
        return $this->cursos->create($datos);
    }

    /**
     * @param  array{nombre: string, codigo: string, carrera_id: int, ciclo_curricular: int, horas: int, activo: bool}  $datos
     */
    public function actualizar(Curso $curso, array $datos): Curso
    {
        return $this->cursos->update($curso, $datos);
    }

    public function codigoDisponible(string $codigo, ?int $exceptoId = null): bool
    {
        return ! $this->cursos->existeCodigo($codigo, $exceptoId);
    }

    /**
     * Código sugerido para un curso nuevo, con la misma convención que ya
     * usa la currícula real del instituto (ver CurriculaInstitutoSeeder):
     * código de la carrera + ciclo en números romanos + secuencia dentro
     * de ese ciclo, p. ej. "ENF-I-01". Si ya existe (un registro manual
     * puede dejar huecos en la secuencia), avanza hasta encontrar uno
     * libre.
     */
    public function generarCodigo(Carrera $carrera, int $cicloCurricular): string
    {
        $romano = $this->cicloRomano($cicloCurricular);
        $secuencia = 1;

        while (! $this->codigoDisponible($codigo = sprintf('%s-%s-%02d', $carrera->code, $romano, $secuencia))) {
            $secuencia++;
        }

        return $codigo;
    }

    private function cicloRomano(int $cicloCurricular): string
    {
        $romanos = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        return $romanos[$cicloCurricular] ?? (string) $cicloCurricular;
    }
}
