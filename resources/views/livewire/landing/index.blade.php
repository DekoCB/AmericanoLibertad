<?php

use App\Models\Carrera;
use App\Modules\Academico\Models\Curso;
use App\Modules\Docentes\Models\Docente;
use App\Modules\Landing\Models\SolicitudContacto;
use App\Modules\Matricula\Models\Estudiante;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.landing')] class extends Component
{
    private const NOMBRE_INSTITUCION = 'Instituto Americano Libertad';

    private const NOMBRE_LARGO = 'Instituto Superior Tecnológico Privado Americano Libertad';

    private const WHATSAPP_NUMERO = '51900512553';

    private const WHATSAPP_NUMERO_VISIBLE = '+51 900 512 553';

    private const EMAIL_CONTACTO = 'ieslibertadtuman@gmail.com';

    private const DIRECCION = 'Sector, Tumán 14601';

    private const HORARIO_ATENCION = 'Lunes a viernes · 8:00 a.m. – 5:00 p.m.';

    public string $nombre = '';

    public string $correo = '';

    public string $asunto = '';

    public string $mensaje = '';

    public bool $enviado = false;

    public function enviarMensaje(): void
    {
        $validado = $this->validate([
            'nombre' => 'required|string|max:150',
            'correo' => 'required|email|max:150',
            'asunto' => 'nullable|string|max:150',
            'mensaje' => 'required|string|max:2000',
        ]);

        SolicitudContacto::create([
            'nombre' => $validado['nombre'],
            'email' => $validado['correo'],
            // El formulario público no pide teléfono; la columna es
            // obligatoria en solicitudes_contacto (heredada de CEBA).
            'telefono' => '',
            'programa_interes' => $validado['asunto'] ?: null,
            'mensaje' => $validado['mensaje'],
        ]);

        $this->reset(['nombre', 'correo', 'asunto', 'mensaje']);
        $this->enviado = true;
    }

    public function with(): array
    {
        return [
            'nombreInstitucion' => self::NOMBRE_INSTITUCION,
            'nombreLargo' => self::NOMBRE_LARGO,
            'whatsappNumero' => self::WHATSAPP_NUMERO,
            'whatsappNumeroVisible' => self::WHATSAPP_NUMERO_VISIBLE,
            'emailContacto' => self::EMAIL_CONTACTO,
            'direccion' => self::DIRECCION,
            'horarioAtencion' => self::HORARIO_ATENCION,
            'whatsappHref' => fn (string $mensaje) => 'https://wa.me/'.self::WHATSAPP_NUMERO.'?text='.rawurlencode($mensaje),
            'carreras' => Carrera::orderBy('name')->get(),
            'docentes' => Docente::with('usuario')->get()->sortBy(fn (Docente $d) => $d->usuario->name)->values(),
            'stats' => [
                'students' => Estudiante::where('estado', 'activo')->count(),
                'teachers' => Docente::count(),
                'subjects' => Curso::count(),
            ],
        ];
    }
}; ?>

<div class="min-h-screen">
    @include('livewire.landing.partials._header')
    @include('livewire.landing.partials._hero')
    @include('livewire.landing.partials._nosotros')
    @include('livewire.landing.partials._programas')
    @include('livewire.landing.partials._admision')
    @include('livewire.landing.partials._beneficios')
    @include('livewire.landing.partials._docentes')
    @include('livewire.landing.partials._contacto')
    @include('livewire.landing.partials._footer')

    <x-landing.whatsapp-float-button :href="$whatsappHref('Hola, quiero información sobre el '.$nombreInstitucion.'.')" />
</div>
