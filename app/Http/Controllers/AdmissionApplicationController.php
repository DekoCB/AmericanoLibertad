<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AdmissionApplication;
use App\Models\Carrera;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdmissionApplicationController extends Controller
{
    private const DOCUMENT_FIELDS = [
        'documento_dni',
        'documento_certificado',
        'documento_partida',
        'documento_foto',
    ];

    public function create(): Response
    {
        return Inertia::render('Admision/Index', [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['required', 'string', 'max:100'],
            'nombres' => ['required', 'string', 'max:150'],
            'dni' => ['required', 'string', 'max:15'],
            'sexo' => ['required', 'in:masculino,femenino'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'correo' => ['nullable', 'email', 'max:150'],
            'carrera_id' => ['required', 'exists:carreras,id'],
            'turno' => ['required', 'in:mañana,tarde,noche'],
            'colegio_procedencia' => ['nullable', 'string', 'max:200'],
            'lugar_procedencia' => ['nullable', 'string', 'max:200'],
            'apoderado_nombres' => ['nullable', 'string', 'max:200'],
            'apoderado_dni' => ['nullable', 'string', 'max:15'],
            'apoderado_parentesco' => ['nullable', 'string', 'max:50'],
            'apoderado_telefono' => ['nullable', 'string', 'max:20'],
            'apoderado_correo' => ['nullable', 'email', 'max:150'],
            'documento_dni' => ['nullable', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
            'documento_certificado' => ['nullable', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
            'documento_partida' => ['nullable', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
            'documento_foto' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png'],
        ]);

        foreach (self::DOCUMENT_FIELDS as $field) {
            if ($request->hasFile($field)) {
                $data["{$field}_path"] = $request->file($field)->store('admisiones', 'local');
            }
            unset($data[$field]);
        }

        AdmissionApplication::create($data);

        return back()->with(
            'success',
            'Tu solicitud de admisión fue enviada. Nos pondremos en contacto contigo pronto.',
        );
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AdmissionApplication::class);

        $solicitudes = AdmissionApplication::query()
            ->with('carrera')
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%")
                        ->orWhere('dni', 'like', "%{$search}%");
                });
            })
            ->when($request->string('carrera_id')->toString(), function ($query, $carreraId) {
                $query->where('carrera_id', $carreraId);
            })
            ->when($request->string('estado')->toString(), function ($query, $estado) {
                $query->where('estado', $estado);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('AdmisionSolicitudes/Index', [
            'solicitudes' => $solicitudes,
            'carreras' => Carrera::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('search', 'carrera_id', 'estado'),
            'can' => [
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
            ],
        ]);
    }

    public function updateEstado(Request $request, AdmissionApplication $admissionApplication): RedirectResponse
    {
        $this->authorize('update', $admissionApplication);

        $validated = $request->validate([
            'estado' => ['required', Rule::in(['pendiente', 'revisado', 'aceptado', 'rechazado'])],
        ]);

        $admissionApplication->update($validated);

        return back()->with('success', 'Estado de la solicitud actualizado correctamente.');
    }

    public function destroy(AdmissionApplication $admissionApplication): RedirectResponse
    {
        $this->authorize('delete', $admissionApplication);

        foreach (self::DOCUMENT_FIELDS as $field) {
            $path = $admissionApplication->{"{$field}_path"};
            if ($path) {
                Storage::disk('local')->delete($path);
            }
        }

        $admissionApplication->delete();

        return redirect()->route('admisiones.index')->with('success', 'Solicitud eliminada correctamente.');
    }

    public function descargarDocumento(Request $request, AdmissionApplication $admissionApplication, string $campo): StreamedResponse
    {
        $this->authorize('view', $admissionApplication);

        if (! in_array($campo, self::DOCUMENT_FIELDS, true)) {
            abort(404);
        }

        $path = $admissionApplication->{"{$campo}_path"};

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return Storage::disk('local')->download($path);
    }
}
