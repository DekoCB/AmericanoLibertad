<?php

namespace App\Http\Controllers;

use App\Models\AdmissionApplication;
use App\Models\Carrera;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
}
