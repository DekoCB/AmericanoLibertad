<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    private const STOPWORDS = ['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'con', 'para', 'al'];

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Subject::class);

        $subjects = Subject::query()
            ->when($request->string('name')->toString(), function ($query, $name) {
                $query->where('name', $name);
            })
            ->with('carrera')
            ->withCount('courses')
            ->orderBy('name')
            ->orderBy('ciclo')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Subjects/Index', [
            'subjects' => $subjects,
            'nombresMaterias' => Subject::orderBy('name')->distinct()->pluck('name'),
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'code', 'total_ciclos']),
            'filters' => $request->only('name'),
            'can' => [
                'create' => $request->user()->can('create', Subject::class),
                'update' => $request->user()->can('update', new Subject()),
                'delete' => $request->user()->can('delete', new Subject()),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Subject::class);

        return Inertia::render('Subjects/Create', [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'code', 'total_ciclos']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Subject::class);

        $validated = $this->validateSubject($request, forCreate: true);

        $carrera = Carrera::findOrFail($validated['carrera_id']);
        $validated['code'] = $this->generateSubjectCode($carrera, (int) $validated['ciclo'], $validated['name']);

        Subject::create($validated);

        return redirect()->route('subjects.index')->with('success', "Curso creado correctamente con el código {$validated['code']}.");
    }

    public function edit(Subject $subject): Response
    {
        $this->authorize('update', $subject);

        return Inertia::render('Subjects/Edit', [
            'subject' => $subject,
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'code', 'total_ciclos']),
        ]);
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $this->authorize('update', $subject);

        $subject->update($this->validateSubject($request, $subject));

        return redirect()->route('subjects.index')->with('success', 'Curso actualizado correctamente.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $this->authorize('delete', $subject);

        $subject->delete();

        return redirect()->route('subjects.index')->with('success', 'Curso eliminado correctamente.');
    }

    public function updateImagen(Request $request, Subject $subject): RedirectResponse
    {
        $this->authorize('manageImagen', Subject::class);

        $validated = $request->validate([
            'imagen' => ['required', 'image', 'max:4096'],
        ]);

        if ($subject->imagen_path) {
            Storage::disk('public')->delete($subject->imagen_path);
        }

        $subject->update([
            'imagen_path' => $validated['imagen']->store('cursos-imagenes', 'public'),
        ]);

        return back()->with('success', 'Imagen del curso actualizada correctamente.');
    }

    private function validateSubject(Request $request, ?Subject $subject = null, bool $forCreate = false): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => $forCreate
                ? ['nullable']
                : ['required', 'string', 'max:20', Rule::unique('subjects')->ignore($subject)],
            'description' => ['nullable', 'string', 'max:1000'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:20'],
            'carrera_id' => ['required', 'exists:carreras,id'],
            'ciclo' => ['required', 'integer', 'min:1', 'max:12'],
        ]);
    }

    /**
     * Genera un código único con el mismo estilo usado en el resto del
     * currículo: PREFIJO-ABREVIATURA (p.ej. ADM-LOG), o PREFIJO-CICLO-ABREVIATURA
     * (p.ej. ENF-1-AE) cuando el mismo nombre de curso ya existe en otro
     * ciclo de la misma carrera y hace falta distinguirlos.
     */
    private function generateSubjectCode(Carrera $carrera, int $ciclo, string $name): string
    {
        $words = array_values(array_filter(
            preg_split('/\s+/u', trim($name)) ?: [],
            fn (string $word) => $word !== '' && ! in_array(mb_strtolower($word), self::STOPWORDS, true),
        ));

        if (empty($words)) {
            $words = [$name];
        }

        $prefix = mb_strtoupper($carrera->code);

        $hasSiblingCiclo = Subject::where('carrera_id', $carrera->id)
            ->where('name', $name)
            ->exists();

        $base = $hasSiblingCiclo ? "{$prefix}-{$ciclo}-" : "{$prefix}-";

        $lastIndex = array_key_last($words);
        $lastWordLength = mb_strlen(preg_replace('/[^\p{L}]/u', '', $words[$lastIndex]));

        // Si la abreviatura normal ya está en uso, alarga la última palabra
        // (p.ej. "ASM" vs "ASME") antes de recurrir a un sufijo numérico.
        for ($lastLen = 1; $lastLen <= max($lastWordLength, 1); $lastLen++) {
            $letters = [];

            foreach ($words as $index => $word) {
                $clean = preg_replace('/[^\p{L}]/u', '', $word);
                if ($clean === '') {
                    continue;
                }

                $len = $index === $lastIndex ? $lastLen : 1;
                $letters[] = mb_strtoupper(mb_substr($clean, 0, $len));
            }

            $candidate = $base.implode('', $letters);

            if (! Subject::where('code', $candidate)->exists()) {
                return $candidate;
            }
        }

        $shortLetters = [];
        foreach ($words as $word) {
            $clean = preg_replace('/[^\p{L}]/u', '', $word);
            if ($clean === '') {
                continue;
            }
            $shortLetters[] = mb_strtoupper(mb_substr($clean, 0, 1));
        }

        $suffix = 2;
        do {
            $candidate = $base.implode('', $shortLetters).$suffix;
            $suffix++;
        } while (Subject::where('code', $candidate)->exists());

        return $candidate;
    }
}
