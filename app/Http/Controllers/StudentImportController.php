<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;

class StudentImportController extends Controller
{
    private const ROMANOS = [
        'I' => 1, 'II' => 2, 'III' => 3, 'IV' => 4, 'V' => 5,
        'VI' => 6, 'VII' => 7, 'VIII' => 8, 'IX' => 9, 'X' => 10,
    ];

    private const SECCIONES = [
        'LV' => 'Sección LV',
        'SD' => 'Sección SD',
    ];

    public function create(): Response
    {
        $this->authorize('create', Student::class);

        return Inertia::render('Students/Import', [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(Request $request): Response
    {
        $this->authorize('create', Student::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());

        $carreras = Carrera::all(['id', 'name']);
        $nextDoc = (int) (Student::query()->whereRaw("document_number REGEXP '^[0-9]+$'")
            ->max(DB::raw('CAST(document_number AS UNSIGNED)')) ?? 70000000) + 1;

        $summary = [
            'studentsCreated' => 0,
            'studentsReused' => 0,
            'enrollmentsCreated' => 0,
            'enrollmentsExisting' => 0,
            'warnings' => [],
        ];

        DB::transaction(function () use ($spreadsheet, $carreras, &$nextDoc, &$summary) {
            foreach ($spreadsheet->getAllSheets() as $sheet) {
                $seccion = $this->detectarSeccion($sheet->getTitle());

                if (! $seccion) {
                    $summary['warnings'][] = "Hoja \"{$sheet->getTitle()}\" no se reconoce como L-V o S-D; se omitió.";
                    continue;
                }

                $bloques = $this->detectarBloques($sheet);

                if (empty($bloques)) {
                    $summary['warnings'][] = "Hoja \"{$sheet->getTitle()}\": no se encontró la columna \"Alumnos\"; se omitió.";
                    continue;
                }

                foreach ($bloques as $bloque) {
                    $this->procesarBloque($sheet, $bloque, $seccion, $carreras, $nextDoc, $summary);
                }
            }
        });

        return Inertia::render('Students/Import', [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'code']),
            'summary' => $summary,
        ]);
    }

    private function detectarSeccion(string $tituloHoja): ?string
    {
        $t = strtoupper(preg_replace('/[^A-Z]/i', '', $tituloHoja));

        if (Str::startsWith($t, 'LV')) {
            return 'LV';
        }

        if (Str::startsWith($t, 'SD')) {
            return 'SD';
        }

        return null;
    }

    /**
     * Busca en la primera fila todas las columnas cuyo encabezado sea "ALUMNOS"
     * (o similar) y asume que CICLO y CARRERA están en las dos columnas siguientes.
     * Esto permite leer hojas con varios bloques de tabla uno al lado del otro.
     *
     * @return array<int, array{nameCol: int, cicloCol: int, carreraCol: int}>
     */
    private function detectarBloques($sheet): array
    {
        $bloques = [];
        $highestColumn = $sheet->getHighestColumn();
        $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        for ($col = 1; $col <= $highestColumnIndex; $col++) {
            $valor = trim((string) $sheet->getCell([$col, 1])->getValue());
            $normalizado = strtoupper(preg_replace('/[^A-Z]/i', '', $valor));

            if ($normalizado === 'ALUMNOS' || $normalizado === 'ALUMNO') {
                $bloques[] = [
                    'nameCol' => $col,
                    'cicloCol' => $col + 1,
                    'carreraCol' => $col + 2,
                ];
            }
        }

        return $bloques;
    }

    /**
     * @param  array{nameCol: int, cicloCol: int, carreraCol: int}  $bloque
     * @param  \Illuminate\Support\Collection<int, Carrera>  $carreras
     */
    private function procesarBloque($sheet, array $bloque, string $seccion, $carreras, int &$nextDoc, array &$summary): void
    {
        $highestRow = $sheet->getHighestRow();

        for ($row = 2; $row <= $highestRow; $row++) {
            $nombreRaw = trim((string) $sheet->getCell([$bloque['nameCol'], $row])->getValue());

            if ($nombreRaw === '') {
                continue;
            }

            $cicloRaw = trim((string) $sheet->getCell([$bloque['cicloCol'], $row])->getValue());
            $carreraRaw = trim((string) $sheet->getCell([$bloque['carreraCol'], $row])->getValue());

            $ciclo = self::ROMANOS[strtoupper($cicloRaw)] ?? null;
            $carrera = $this->matchCarrera($carreraRaw, $carreras);

            if (! $ciclo || ! $carrera) {
                $summary['warnings'][] = "\"{$nombreRaw}\": ciclo (\"{$cicloRaw}\") o carrera (\"{$carreraRaw}\") no reconocidos; no se creó.";
                continue;
            }

            [$lastName, $firstName] = $this->splitName($nombreRaw);

            $student = Student::where('carrera_id', $carrera->id)
                ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)])
                ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)])
                ->first();

            if ($student) {
                $student->update(['ciclo' => $ciclo]);
                $summary['studentsReused']++;
            } else {
                $email = $this->generarEmail($firstName, $lastName);
                $student = Student::create([
                    'document_number' => (string) $nextDoc++,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'status' => 'active',
                    'carrera_id' => $carrera->id,
                    'ciclo' => $ciclo,
                ]);
                $summary['studentsCreated']++;
            }

            $courseName = self::SECCIONES[$seccion];
            $courseIds = Course::whereHas('subject', function ($q) use ($carrera, $ciclo) {
                $q->where('carrera_id', $carrera->id)->where('ciclo', $ciclo);
            })
                ->where('name', $courseName)
                ->pluck('id');

            if ($courseIds->isEmpty()) {
                $summary['warnings'][] = "\"{$nombreRaw}\" ({$carrera->name}, ciclo {$ciclo}, {$courseName}): no hay cursos creados todavía; quedó sin matricular.";
            }

            foreach ($courseIds as $courseId) {
                $enrollment = Enrollment::firstOrCreate(
                    ['student_id' => $student->id, 'course_id' => $courseId],
                    ['enrolled_at' => now(), 'status' => 'active'],
                );

                if ($enrollment->wasRecentlyCreated) {
                    $summary['enrollmentsCreated']++;
                } else {
                    $summary['enrollmentsExisting']++;
                }
            }
        }
    }

    private function matchCarrera(string $raw, $carreras): ?Carrera
    {
        if ($raw === '') {
            return null;
        }

        $normalizado = $this->normalizar($raw);

        foreach ($carreras as $carrera) {
            $normCarrera = $this->normalizar($carrera->name);

            if (Str::startsWith($normCarrera, $normalizado) || Str::startsWith($normalizado, $normCarrera)) {
                return $carrera;
            }
        }

        return null;
    }

    private function normalizar(string $s): string
    {
        $s = mb_strtoupper(trim($s), 'UTF-8');
        $map = ['Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N', 'Ü' => 'U'];

        return strtr($s, $map);
    }

    /**
     * @return array{0: string, 1: string} [apellidos, nombres]
     */
    private function splitName(string $raw): array
    {
        $words = array_values(array_filter(preg_split('/\s+/', trim($raw)), fn ($w) => $w !== ''));
        $n = count($words);

        if ($n >= 3) {
            $lastName = $words[0].' '.$words[1];
            $firstName = implode(' ', array_slice($words, 2));
        } elseif ($n === 2) {
            $lastName = $words[0];
            $firstName = $words[1];
        } elseif ($n === 1) {
            $lastName = $words[0];
            $firstName = $words[0];
        } else {
            $lastName = 'Sin nombre';
            $firstName = 'Sin nombre';
        }

        $titleCase = fn ($s) => mb_convert_case(mb_strtolower($s, 'UTF-8'), MB_CASE_TITLE, 'UTF-8');

        return [$titleCase($lastName), $titleCase($firstName)];
    }

    private function generarEmail(string $firstName, string $lastName): string
    {
        $slug = fn ($s) => trim(preg_replace('/[^a-z0-9]+/', '.', strtr(mb_strtolower($s, 'UTF-8'), [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n', 'ü' => 'u',
        ])), '.');

        $base = $slug($firstName).'.'.$slug($lastName);
        $email = $base.'@iestplibertad.edu.pe';
        $i = 2;

        while (Student::where('email', $email)->exists()) {
            $email = $base.$i.'@iestplibertad.edu.pe';
            $i++;
        }

        return $email;
    }
}
