<?php

declare(strict_types=1);

namespace App\Modules\Asistencia\Services;

use App\Modules\Academico\Models\Horario;
use App\Modules\Asistencia\Models\IngresoInstituto;
use App\Modules\Matricula\Enums\EstadoEstudianteEnum;
use App\Modules\Matricula\Models\Estudiante;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection as SupportCollection;

/**
 * Registro de "llegada física al instituto", independiente del curso --
 * complementa a AsistenciaService (que es por Horario). Se apoya en
 * AsistenciaService::horariosDelEstudiante() para decidir puntualidad, por
 * eso se inyecta en vez de duplicar esa lógica.
 */
class AsistenciaInstitutoService
{
    /**
     * Literal del QR fijo que se proyecta/imprime en la entrada del
     * instituto -- distinto del formato "AULA:{horario_id}" usado para las
     * clases, para que un solo botón de escaneo pueda reconocer cuál de los
     * dos se escaneó.
     */
    public const CODIGO_QR = 'INSTITUTO';

    private const MINUTOS_DE_TOLERANCIA = 15;

    public function __construct(
        private readonly AsistenciaService $asistenciaService,
    ) {}

    /**
     * El estudiante se marca a sí mismo como presente en el instituto hoy.
     * Si ya existe un registro para hoy, se devuelve sin tocar -- mismo
     * criterio de "nunca pisar lo ya decidido" que
     * AsistenciaService::autorregistrar().
     */
    public function registrarIngreso(Estudiante $estudiante): IngresoInstituto
    {
        $fecha = now()->format('Y-m-d');

        $existente = IngresoInstituto::query()
            ->where('estudiante_id', $estudiante->id)
            ->where('fecha', $fecha)
            ->first();

        if ($existente) {
            return $existente;
        }

        return IngresoInstituto::query()->create([
            'estudiante_id' => $estudiante->id,
            'fecha' => $fecha,
            'llego_tarde' => $this->llegoTarde($estudiante),
        ]);
    }

    /**
     * Compara la hora actual contra el inicio de la primera clase de hoy
     * entre todos los horarios del estudiante (incluidos refuerzos). Si no
     * tiene ninguna clase programada hoy -- un sábado, o simplemente no le
     * toca -- no hay base de comparación: se registra puntual en vez de
     * inventar una tardanza sin sustento.
     */
    private function llegoTarde(Estudiante $estudiante): bool
    {
        $ahora = now();

        $horaInicioMasTemprana = $this->asistenciaService->horariosDelEstudiante($estudiante)
            ->map(fn (Horario $horario) => $horario->diaParaFecha($ahora)?->hora_inicio)
            ->filter()
            ->sort()
            ->first();

        if (! $horaInicioMasTemprana) {
            return false;
        }

        return $ahora->greaterThan(
            Carbon::parse($ahora->format('Y-m-d').' '.$horaInicioMasTemprana)
                ->addMinutes(self::MINUTOS_DE_TOLERANCIA)
        );
    }

    /**
     * Ingresos de una fecha, keyed por estudiante_id.
     *
     * @return SupportCollection<int, IngresoInstituto>
     */
    public function deFecha(string $fecha): SupportCollection
    {
        return IngresoInstituto::query()->where('fecha', $fecha)->get()->toBase()->keyBy('estudiante_id');
    }

    /**
     * Roster completo de estudiantes activos para una fecha, cada uno con
     * su ingreso (o null si no se presentó) -- mismo criterio que
     * AsistenciaService::estudiantesDelHorario(): se lista a todos, no solo
     * a quien sí registró algo.
     *
     * @return list<array{estudiante: Estudiante, ingreso: IngresoInstituto|null}>
     */
    public function reporte(string $fecha): array
    {
        $ingresos = $this->deFecha($fecha);

        $estudiantes = Estudiante::query()
            ->where('estado', EstadoEstudianteEnum::ACTIVO)
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get();

        $filas = [];

        foreach ($estudiantes as $estudiante) {
            $filas[] = [
                'estudiante' => $estudiante,
                'ingreso' => $ingresos->get($estudiante->id),
            ];
        }

        return $filas;
    }

    /**
     * Para la línea de estado en la pantalla "Marcar mi asistencia".
     */
    public function deHoyDelEstudiante(Estudiante $estudiante): ?IngresoInstituto
    {
        return IngresoInstituto::query()
            ->where('estudiante_id', $estudiante->id)
            ->where('fecha', now()->format('Y-m-d'))
            ->first();
    }
}
