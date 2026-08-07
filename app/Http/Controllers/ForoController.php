<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\ForoRespuesta;
use App\Models\ForoTema;
use App\Models\RecursoAula;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ForoController extends Controller
{
    private const TOTAL_SEMANAS = 20;

    public function store(Request $request, Course $course, int $semana): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        abort_unless($semana >= 1 && $semana <= self::TOTAL_SEMANAS, 404);

        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:150'],
            'pregunta' => ['nullable', 'string', 'max:2000'],
        ]);

        $course->foroTemas()->create([
            ...$validated,
            'semana' => $semana,
            'creado_por' => $request->user()->id,
        ]);

        return redirect()
            ->route('aula-virtual.show', ['course' => $course, 'semana' => $semana])
            ->with('success', 'Tema de foro publicado correctamente.');
    }

    public function destroyTema(Course $course, ForoTema $foroTema): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        $semana = $foroTema->semana;
        $foroTema->delete();

        return redirect()
            ->route('aula-virtual.show', ['course' => $course, 'semana' => $semana])
            ->with('success', 'Tema de foro eliminado.');
    }

    public function storeRespuesta(Request $request, ForoTema $foroTema): RedirectResponse
    {
        $this->authorize('view', [RecursoAula::class, $foroTema->course]);

        $validated = $request->validate([
            'contenido' => ['required', 'string', 'max:2000'],
        ]);

        $foroTema->respuestas()->create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('aula-virtual.show', ['course' => $foroTema->course_id, 'semana' => $foroTema->semana])
            ->with('success', 'Respuesta publicada.');
    }

    public function destroyRespuesta(Request $request, ForoRespuesta $respuesta): RedirectResponse
    {
        $foroTema = $respuesta->foroTema;
        $user = $request->user();
        $canManage = $user->can('manage', [RecursoAula::class, $foroTema->course]);

        abort_unless($canManage || $respuesta->user_id === $user->id, 403);

        $courseId = $foroTema->course_id;
        $semana = $foroTema->semana;
        $respuesta->delete();

        return redirect()
            ->route('aula-virtual.show', ['course' => $courseId, 'semana' => $semana])
            ->with('success', 'Respuesta eliminada.');
    }
}
