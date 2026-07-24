<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Aula;
use App\Models\Course;
use App\Models\Horario;
use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HorarioController extends Controller
{
    private const DIAS = [
        'lunes' => 'LUNES',
        'martes' => 'MARTES',
        'miercoles' => 'MIÉRCOLES',
        'jueves' => 'JUEVES',
        'viernes' => 'VIERNES',
        'sabado' => 'SÁBADO',
        'domingo' => 'DOMINGO',
    ];

    private const HORA_MIN = 7;

    private const HORA_MAX = 21;

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole(UserRole::Estudiante)) {
            return $this->miHorario($request);
        }

        $this->authorize('viewAny', Course::class);

        $esDocente = $user->hasRole(UserRole::Docente);

        $totalesPorAula = Horario::query()
            ->whereNotNull('aula')
            ->where('aula', '!=', '')
            ->when($esDocente, fn ($q) => $q->whereHas('course', fn ($q2) => $q2->where('teacher_id', $user->teacher_id)))
            ->selectRaw('aula, count(*) as total')
            ->groupBy('aula')
            ->pluck('total', 'aula');

        if ($esDocente) {
            $aulas = $totalesPorAula->keys()->sort()->values()
                ->map(fn (string $nombre) => [
                    'aula' => $nombre,
                    'total' => $totalesPorAula->get($nombre),
                ]);
        } else {
            $aulas = Aula::orderBy('nombre')->pluck('nombre')
                ->merge($totalesPorAula->keys())
                ->unique()
                ->sort()
                ->values()
                ->map(fn (string $nombre) => [
                    'aula' => $nombre,
                    'total' => $totalesPorAula->get($nombre, 0),
                ]);
        }

        return Inertia::render('Horarios/Index', [
            'aulas' => $aulas,
            'can' => [
                'manage' => $user->can('manage', Horario::class),
            ],
        ]);
    }

    private function miHorario(Request $request): Response
    {
        $this->authorize('viewOwn', Horario::class);

        $studentId = $request->user()->student_id;

        $horarios = Horario::query()
            ->whereHas('course.enrollments', fn ($q) => $q->where('student_id', $studentId)->where('status', 'active'))
            ->with('course.subject', 'course.teacher')
            ->orderByRaw("FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')")
            ->orderBy('hora_inicio')
            ->get();

        return Inertia::render('Horarios/Estudiante', [
            'horarios' => $horarios,
        ]);
    }

    public function exportarPropio(Request $request): StreamedResponse
    {
        $this->authorize('viewOwn', Horario::class);

        $student = Student::findOrFail($request->user()->student_id);

        $horarios = Horario::query()
            ->whereHas('course.enrollments', fn ($q) => $q->where('student_id', $student->id)->where('status', 'active'))
            ->with('course.subject')
            ->get();

        $nombreCompleto = "{$student->first_name} {$student->last_name}";

        $spreadsheet = $this->generarSpreadsheet(
            $horarios,
            'MI HORARIO — '.mb_strtoupper($nombreCompleto),
            incluirAula: true,
        );

        $writer = new Xlsx($spreadsheet);
        $filename = 'mi-horario-'.Str::slug($nombreCompleto).'.xlsx';

        return new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function registrarAula(Request $request): RedirectResponse
    {
        $this->authorize('manage', Horario::class);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('aulas', 'nombre')],
        ]);

        Aula::create($validated);

        return redirect()->route('horarios.index')->with('success', "Aula \"{$validated['nombre']}\" registrada correctamente.");
    }

    public function exportarAula(Request $request, string $aula): StreamedResponse
    {
        $this->authorize('viewAny', Course::class);

        $horarios = Horario::query()
            ->where('aula', $aula)
            ->with('course.subject')
            ->get();

        $spreadsheet = $this->generarSpreadsheet($horarios, 'HORARIO SEMANAL — '.mb_strtoupper($aula));

        $writer = new Xlsx($spreadsheet);
        $filename = 'horario-'.Str::slug($aula).'.xlsx';

        return new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * @param  Collection<int, Horario>  $horarios
     */
    private function generarSpreadsheet(Collection $horarios, string $titulo, bool $incluirAula = false): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Horario');

        $lastCol = chr(ord('A') + count(self::DIAS));

        $sheet->setCellValue('A1', $titulo);
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->getStyle('A1')->getFont()->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A3', 'HORA');
        $col = 'B';
        foreach (self::DIAS as $label) {
            $sheet->setCellValue("{$col}3", $label);
            $col++;
        }
        $sheet->getStyle("A3:{$lastCol}3")->getFont()->setBold(true);

        $row = 4;
        for ($hour = self::HORA_MIN; $hour <= self::HORA_MAX; $hour++) {
            $sheet->setCellValue("A{$row}", sprintf('%02d:00', $hour));

            $col = 'B';
            foreach (array_keys(self::DIAS) as $dia) {
                $texto = $horarios
                    ->filter(fn (Horario $h) => $h->dia_semana === $dia && (int) substr($h->hora_inicio, 0, 2) === $hour)
                    ->map(fn (Horario $h) => sprintf(
                        '%s · %s · %s-%s%s',
                        $h->course?->subject?->name ?? 'Sin materia',
                        $h->course?->name ?? 'Sin sección',
                        substr($h->hora_inicio, 0, 5),
                        substr($h->hora_fin, 0, 5),
                        $incluirAula && $h->aula ? " · {$h->aula}" : '',
                    ))
                    ->implode("\n");

                $sheet->setCellValue("{$col}{$row}", $texto);
                $sheet->getStyle("{$col}{$row}")->getAlignment()->setWrapText(true);
                $col++;
            }
            $row++;
        }

        $lastRow = $row - 1;
        $sheet->getStyle("A3:{$lastCol}{$lastRow}")
            ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("A3:{$lastCol}3")
            ->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E5E7EB');

        $sheet->getColumnDimension('A')->setWidth(12);
        foreach (range('B', $lastCol) as $columnLetter) {
            $sheet->getColumnDimension($columnLetter)->setWidth(28);
        }
        for ($r = 4; $r <= $lastRow; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(45);
        }

        return $spreadsheet;
    }

    public function importarAula(Request $request, string $aula): RedirectResponse
    {
        $user = $request->user();
        $this->authorize('manage', Horario::class);

        $esDocente = $user->hasRole(UserRole::Docente);

        $request->validate([
            'archivo' => ['required', 'file', 'mimes:xlsx'],
        ]);

        $spreadsheet = IOFactory::load($request->file('archivo')->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();

        $columnasPorDia = array_combine(
            range('B', chr(ord('A') + count(self::DIAS))),
            array_keys(self::DIAS),
        );

        $nuevos = [];
        $sinCoincidencia = [];

        foreach ($sheet->getRowIterator(4) as $fila) {
            $numeroFila = $fila->getRowIndex();

            foreach ($columnasPorDia as $columna => $dia) {
                $valor = trim((string) $sheet->getCell("{$columna}{$numeroFila}")->getValue());

                if ($valor === '') {
                    continue;
                }

                foreach (preg_split('/\r\n|\r|\n/', $valor) as $linea) {
                    $linea = trim($linea);

                    if ($linea === '') {
                        continue;
                    }

                    if (! preg_match('/^(.+?)\s·\s(.+?)\s·\s(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/u', $linea, $m)) {
                        $sinCoincidencia[] = $linea;

                        continue;
                    }

                    [, $materia, $seccion, $horaInicio, $horaFin] = $m;

                    $course = Course::whereHas('subject', fn ($q) => $q->where('name', $materia))
                        ->where('name', $seccion)
                        ->first();

                    if (! $course) {
                        $sinCoincidencia[] = $linea;

                        continue;
                    }

                    if ($esDocente && $course->teacher_id !== $user->teacher_id) {
                        // Pertenece a otro docente: se deja intacto, no se reporta como error.
                        continue;
                    }

                    $nuevos[] = [
                        'course_id' => $course->id,
                        'dia_semana' => $dia,
                        'hora_inicio' => $horaInicio,
                        'hora_fin' => $horaFin,
                        'aula' => $aula,
                    ];
                }
            }
        }

        DB::transaction(function () use ($aula, $nuevos, $esDocente, $user) {
            Aula::firstOrCreate(['nombre' => $aula]);

            $borrar = Horario::where('aula', $aula);

            if ($esDocente) {
                $borrar->whereHas('course', fn ($q) => $q->where('teacher_id', $user->teacher_id));
            }

            $borrar->delete();

            foreach ($nuevos as $data) {
                Horario::create($data);
            }
        });

        if (! empty($sinCoincidencia)) {
            $ejemplos = implode('; ', array_slice($sinCoincidencia, 0, 5));

            return redirect()->route('horarios.index')->with(
                'error',
                'Se importaron '.count($nuevos)." clases, pero algunas filas no coincidieron con ningún curso y fueron omitidas: {$ejemplos}",
            );
        }

        return redirect()->route('horarios.index')->with('success', "Horario de \"{$aula}\" actualizado correctamente.");
    }
}
