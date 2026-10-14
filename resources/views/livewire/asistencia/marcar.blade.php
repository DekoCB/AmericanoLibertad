<?php

use App\Modules\Asistencia\Services\AsistenciaInstitutoService;
use App\Modules\Asistencia\Services\AsistenciaService;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    /** @var array{curso: string, estado: string}|null */
    public ?array $resultado = null;

    public function mount(): void
    {
        $user = Auth::user();

        abort_unless($user->hasPermissionTo('asistencia.ver_propio') && $user->estudiante, 403);
    }

    /**
     * Único punto de entrada del escaneo: la cámara decodifica el código y
     * lo manda tal cual, sin más lógica en el cliente -- un código "AULA:"
     * marca la clase en curso, el código fijo del instituto marca el
     * ingreso al edificio. Así queda 100% testeable llamando a este método
     * directamente, sin necesitar una cámara real.
     */
    public function confirmarPorQr(string $codigo, AsistenciaService $service, AsistenciaInstitutoService $institutoService): void
    {
        $estudiante = Auth::user()->estudiante;
        $codigo = trim($codigo);

        if ($codigo === AsistenciaInstitutoService::CODIGO_QR) {
            $institutoService->registrarIngreso($estudiante);

            return;
        }

        if (! str_starts_with($codigo, 'AULA:')) {
            $this->addError('qr', 'Ese código no es válido.');

            return;
        }

        $horarioId = (int) substr($codigo, 5);

        $horarioDelEstudiante = $service->horariosDelEstudiante($estudiante)->firstWhere('id', $horarioId);

        if (! $horarioDelEstudiante) {
            $this->addError('qr', 'Ese código no corresponde a un curso tuyo.');

            return;
        }

        $horarioEnCurso = $service->horarioEnCursoDelEstudiante($estudiante);

        if (! $horarioEnCurso) {
            $this->addError('qr', 'No tienes ninguna clase en curso en este momento.');

            return;
        }

        if ($horarioEnCurso->id !== $horarioDelEstudiante->id) {
            $this->addError('qr', 'Ese código no corresponde a una clase tuya en curso ahora mismo.');

            return;
        }

        $asistencia = $service->autorregistrar($horarioEnCurso, $estudiante);

        $this->resultado = [
            'curso' => $horarioEnCurso->curso->nombre,
            'estado' => $asistencia->estado->label(),
        ];
    }

    public function with(AsistenciaService $service, AsistenciaInstitutoService $institutoService): array
    {
        $estudiante = Auth::user()->estudiante;

        return [
            'horarioEnCurso' => $service->horarioEnCursoDelEstudiante($estudiante),
            'ingresoInstitutoHoy' => $institutoService->deHoyDelEstudiante($estudiante),
        ];
    }
}; ?>

<div>
    <x-slot name="header">
        <a href="{{ route('asistencia.index') }}" wire:navigate class="text-sm text-ink-faint hover:text-ink">← Asistencia</a>
        <h1 class="mt-1 font-display text-2xl text-ink">Marcar mi asistencia</h1>
        <p class="mt-1 text-sm text-ink-dim">Escanea el código QR de tu clase o del ingreso al instituto.</p>
    </x-slot>

    <div class="mx-auto max-w-md space-y-4">
        <div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <span class="text-ink-dim">Tu ingreso al instituto hoy</span>
            @if ($ingresoInstitutoHoy)
                <span @class([
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    'bg-ok/10 text-ok' => ! $ingresoInstitutoHoy->llego_tarde,
                    'bg-warn/10 text-warn' => $ingresoInstitutoHoy->llego_tarde,
                ])>
                    {{ $ingresoInstitutoHoy->llego_tarde ? 'Tardanza' : 'Presente' }}
                </span>
            @else
                <span class="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-faint">Sin registrar</span>
            @endif
        </div>

        <div class="rounded-2xl border border-border bg-surface shadow-sm p-6" x-data="qrScanner()" x-on:livewire:navigating.window="detener()">
            <p class="text-xs uppercase tracking-wide text-ink-faint">Escanear código</p>

            <div class="mt-3">
                {{--
                    x-show en vez de template x-if: el <video> debe existir
                    en el DOM desde el montaje del componente para que
                    x-ref="video" esté disponible de inmediato -- con x-if el
                    elemento recién se crea cuando scanning pasa a true, y
                    $nextTick() no siempre alcanza a esperar esa inserción
                    antes de que iniciar() intente usar la referencia
                    (confirmado: fallaba con "video no disponible").
                --}}
                <div x-show="!scanning">
                    <x-primary-button type="button" x-on:click="iniciar()" class="w-full justify-center gap-2">
                        <x-heroicon-o-qr-code class="h-5 w-5" />
                        Escanear código QR
                    </x-primary-button>
                </div>

                <div x-show="scanning" x-cloak>
                    <div class="relative overflow-hidden rounded-xl border border-border">
                        <video x-ref="video" class="aspect-square w-full object-cover" playsinline muted></video>
                        <button type="button" x-on:click="detener()" class="absolute right-2 top-2 rounded-full bg-ink/60 px-3 py-1 text-xs text-white">
                            Cancelar
                        </button>
                    </div>
                </div>

                <p x-show="error" x-text="error" x-cloak class="mt-2 text-sm text-danger"></p>
                <x-input-error :messages="$errors->get('qr')" class="mt-2" />

                @if ($errors->has('qr'))
                    <button type="button" x-on:click="iniciar()" class="mt-2 text-sm font-medium text-accent hover:underline">
                        Escanear de nuevo
                    </button>
                @endif
            </div>
        </div>

        @if ($resultado)
            <div class="rounded-lg border border-ok/30 bg-ok/10 p-6 text-center">
                <x-heroicon-o-check-circle class="mx-auto h-10 w-10 text-ok" />
                <p class="mt-3 font-display text-lg text-ink">Quedaste marcado como {{ $resultado['estado'] }}</p>
                <p class="mt-1 text-sm text-ink-dim">{{ $resultado['curso'] }}</p>
            </div>
        @elseif ($horarioEnCurso)
            <div class="rounded-2xl border border-border bg-surface shadow-sm p-6">
                <p class="text-xs uppercase tracking-wide text-ink-faint">Clase en curso</p>
                <p class="mt-1 font-display text-xl text-ink">{{ $horarioEnCurso->curso->nombre }}</p>
                @php $diaDeHoy = $horarioEnCurso->diaParaFecha(now()); @endphp
                <p class="mt-1 text-sm text-ink-dim">
                    {{ $horarioEnCurso->carrera->name }}
                    @if ($diaDeHoy)
                        · {{ $diaDeHoy->dia_semana->label() }}
                        {{ substr($diaDeHoy->hora_inicio, 0, 5) }}–{{ substr($diaDeHoy->hora_fin, 0, 5) }}
                    @endif
                </p>
                <p class="mt-3 text-sm text-ink-dim">Escanea el código QR que proyecta tu docente para marcar tu asistencia.</p>
            </div>
        @else
            <div class="rounded-2xl border border-border bg-surface shadow-sm p-6 text-center">
                <x-heroicon-o-clock class="mx-auto h-10 w-10 text-ink-faint" />
                <p class="mt-3 font-display text-lg text-ink">No tienes ninguna clase en este momento</p>
                <p class="mt-1 text-sm text-ink-dim">Podrás marcar tu asistencia desde que empiece tu sesión y hasta que termine.</p>
                <a href="{{ route('asistencia.index') }}" wire:navigate class="mt-4 inline-block text-sm font-medium text-accent hover:underline">Ver mis horarios</a>
            </div>
        @endif
    </div>
</div>
