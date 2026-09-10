<?php

use App\Models\AdmissionApplication;
use App\Models\Carrera;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;
use Livewire\WithFileUploads;

new #[Layout('layouts.landing')] class extends Component
{
    use WithFileUploads;

    public int $step = 1;

    public bool $enviado = false;

    public string $apellido_paterno = '';

    public string $apellido_materno = '';

    public string $nombres = '';

    public string $dni = '';

    public string $sexo = 'masculino';

    public string $fecha_nacimiento = '';

    public string $telefono = '';

    public string $correo = '';

    public string $carrera_id = '';

    public string $turno = 'mañana';

    public string $colegio_procedencia = '';

    public string $lugar_procedencia = '';

    public string $apoderado_nombres = '';

    public string $apoderado_dni = '';

    public string $apoderado_parentesco = '';

    public string $apoderado_telefono = '';

    public string $apoderado_correo = '';

    public $documentoDni;

    public $documentoCertificado;

    public $documentoPartida;

    public $documentoFoto;

    private function rules(): array
    {
        return [
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
            'documentoDni' => ['nullable', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
            'documentoCertificado' => ['nullable', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
            'documentoPartida' => ['nullable', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
            'documentoFoto' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png'],
        ];
    }

    private function stepRules(int $step): array
    {
        $rules = $this->rules();

        return match ($step) {
            1 => array_intersect_key($rules, array_flip([
                'apellido_paterno', 'apellido_materno', 'nombres', 'dni', 'sexo',
                'fecha_nacimiento', 'telefono', 'correo', 'carrera_id', 'turno',
                'colegio_procedencia', 'lugar_procedencia',
            ])),
            2 => array_intersect_key($rules, array_flip([
                'apoderado_nombres', 'apoderado_dni', 'apoderado_parentesco',
                'apoderado_telefono', 'apoderado_correo',
            ])),
            default => $rules,
        };
    }

    public function siguiente(): void
    {
        $this->validate($this->stepRules($this->step));
        $this->step = min($this->step + 1, 3);
    }

    public function anterior(): void
    {
        $this->step = max($this->step - 1, 1);
    }

    public function enviar(): void
    {
        $validado = $this->validate($this->rules());

        // A diferencia de una petición HTTP normal, las propiedades de Livewire no pasan por el
        // middleware ConvertEmptyStringsToNull: sin esto, un input de fecha vacío llega como ''
        // y MySQL rechaza la fila con "Incorrect date value" en vez de guardar NULL.
        $validado['fecha_nacimiento'] = $validado['fecha_nacimiento'] !== '' ? $validado['fecha_nacimiento'] : null;

        $documentos = [
            'documentoDni' => 'documento_dni_path',
            'documentoCertificado' => 'documento_certificado_path',
            'documentoPartida' => 'documento_partida_path',
            'documentoFoto' => 'documento_foto_path',
        ];

        $data = collect($validado)->except(array_keys($documentos))->toArray();

        foreach ($documentos as $propiedad => $columna) {
            if ($this->{$propiedad}) {
                $data[$columna] = $this->{$propiedad}->store('admisiones', 'local');
            }
        }

        AdmissionApplication::create($data);

        $this->enviado = true;
    }

    public function with(): array
    {
        return [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name']),
        ];
    }
}; ?>

<div class="min-h-screen bg-[#0a0a0a] pb-20 pt-8 text-white">
    <div class="mx-auto max-w-3xl px-4 sm:px-6">
        <a href="{{ route('landing') }}" wire:navigate class="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white">
            <x-heroicon-o-chevron-left class="h-4 w-4" />
            Volver a inicio
        </a>

        <p class="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-400">Admisión {{ now()->year }}</p>
        <h1 class="mt-2 font-sans text-3xl font-extrabold text-white">Solicita tu admisión</h1>
        <p class="mt-2 max-w-xl text-sm text-gray-400">
            Completa el formulario y nuestro equipo de admisión se pondrá en contacto contigo para continuar con tu
            proceso de matrícula.
        </p>

        <div class="mt-10 rounded-2xl border border-white/5 bg-[#1a1a1c] p-6 sm:p-10">
            @if ($enviado)
                <div class="flex flex-col items-center py-12 text-center">
                    <x-landing.icon-circle icon="check" color="green" />
                    <p class="mt-6 text-xl font-semibold text-white">¡Tu solicitud fue enviada!</p>
                    <p class="mt-2 max-w-sm text-sm text-gray-400">
                        Nos pondremos en contacto contigo al teléfono o correo que registraste para continuar con tu
                        proceso de admisión.
                    </p>
                    <a href="{{ route('landing') }}" wire:navigate class="mt-8">
                        <x-landing.cta-button href="{{ route('landing') }}" navigate variant="primary">Volver al inicio</x-landing.cta-button>
                    </a>
                </div>
            @else
                {{-- Indicador de pasos --}}
                <div class="mb-10 flex items-center">
                    @foreach (['Estudiante', 'Apoderado', 'Documentos'] as $indice => $etiqueta)
                        <div class="flex flex-1 items-center last:flex-none">
                            <div class="flex flex-col items-center gap-2">
                                <div @class([
                                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition',
                                    'bg-blue-600 text-white' => ($indice + 1) <= $step,
                                    'bg-white/10 text-gray-400' => ($indice + 1) > $step,
                                ])>
                                    {{ $indice + 1 }}
                                </div>
                                <span @class([
                                    'text-xs font-medium',
                                    'text-blue-400' => ($indice + 1) === $step,
                                    'text-gray-500' => ($indice + 1) !== $step,
                                ])>{{ $etiqueta }}</span>
                            </div>
                            @if (! $loop->last)
                                <div @class([
                                    'mx-2 mt-[-20px] h-px flex-1',
                                    'bg-blue-600' => ($indice + 1) < $step,
                                    'bg-white/10' => ($indice + 1) >= $step,
                                ])></div>
                            @endif
                        </div>
                    @endforeach
                </div>

                @if ($step === 1)
                    <div class="space-y-5">
                        <div class="grid gap-5 sm:grid-cols-3">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Apellido paterno *</label>
                                <input type="text" wire:model="apellido_paterno" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('apellido_paterno') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Apellido materno *</label>
                                <input type="text" wire:model="apellido_materno" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('apellido_materno') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Nombres *</label>
                                <input type="text" wire:model="nombres" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('nombres') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                        </div>

                        <div class="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">DNI *</label>
                                <input type="text" maxlength="15" wire:model="dni" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('dni') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Fecha de nacimiento</label>
                                <input type="date" wire:model="fecha_nacimiento" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('fecha_nacimiento') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                        </div>

                        <div>
                            <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Sexo *</label>
                            <div class="mt-1.5 flex gap-3">
                                @foreach (['masculino' => 'Masculino', 'femenino' => 'Femenino'] as $valor => $etiqueta)
                                    <button
                                        type="button"
                                        wire:click="$set('sexo', '{{ $valor }}')"
                                        @class([
                                            'flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition',
                                            'border-blue-600 bg-blue-600 text-white' => $sexo === $valor,
                                            'border-white/10 bg-[#0a0a0a] text-gray-300' => $sexo !== $valor,
                                        ])
                                    >
                                        {{ $etiqueta }}
                                    </button>
                                @endforeach
                            </div>
                        </div>

                        <div class="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono</label>
                                <input type="tel" wire:model="telefono" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('telefono') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Correo</label>
                                <input type="email" wire:model="correo" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                @error('correo') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                        </div>

                        <div class="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Carrera de interés *</label>
                                <select wire:model="carrera_id" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">Selecciona una carrera</option>
                                    @foreach ($carreras as $carrera)
                                        <option value="{{ $carrera->id }}">{{ $carrera->name }}</option>
                                    @endforeach
                                </select>
                                @error('carrera_id') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Turno preferido *</label>
                                <select wire:model="turno" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                    <option value="mañana">Mañana</option>
                                    <option value="tarde">Tarde</option>
                                    <option value="noche">Noche</option>
                                </select>
                                @error('turno') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                            </div>
                        </div>

                        <div class="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Colegio de procedencia</label>
                                <input type="text" wire:model="colegio_procedencia" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Lugar de procedencia</label>
                                <input type="text" wire:model="lugar_procedencia" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                @endif

                @if ($step === 2)
                    <div class="space-y-5">
                        <p class="text-sm text-gray-400">Datos de tu padre, madre o apoderado. Este paso es opcional.</p>

                        <div class="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Nombres completos</label>
                                <input type="text" wire:model="apoderado_nombres" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">DNI</label>
                                <input type="text" maxlength="15" wire:model="apoderado_dni" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                            </div>
                        </div>

                        <div class="grid gap-5 sm:grid-cols-3">
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Parentesco</label>
                                <select wire:model="apoderado_parentesco" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">Selecciona</option>
                                    <option value="Padre">Padre</option>
                                    <option value="Madre">Madre</option>
                                    <option value="Hermano(a)">Hermano(a)</option>
                                    <option value="Tutor">Tutor</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono</label>
                                <input type="tel" wire:model="apoderado_telefono" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">Correo</label>
                                <input type="email" wire:model="apoderado_correo" class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                @endif

                @if ($step === 3)
                    <div class="space-y-5">
                        <p class="text-sm text-gray-400">
                            Adjunta tus documentos en PDF o imagen (máx. 5 MB cada uno). Puedes completarlos más
                            adelante si aún no los tienes.
                        </p>

                        <div class="grid gap-5 sm:grid-cols-2">
                            @foreach ([
                                ['prop' => 'documentoDni', 'label' => 'Copia de DNI', 'accept' => '.pdf,.jpg,.jpeg,.png'],
                                ['prop' => 'documentoCertificado', 'label' => 'Certificado de estudios', 'accept' => '.pdf,.jpg,.jpeg,.png'],
                                ['prop' => 'documentoPartida', 'label' => 'Partida de nacimiento', 'accept' => '.pdf,.jpg,.jpeg,.png'],
                                ['prop' => 'documentoFoto', 'label' => 'Foto tamaño carnet', 'accept' => '.jpg,.jpeg,.png'],
                            ] as $documento)
                                <div>
                                    <label class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ $documento['label'] }}</label>
                                    <input
                                        type="file"
                                        wire:model="{{ $documento['prop'] }}"
                                        accept="{{ $documento['accept'] }}"
                                        class="mt-1.5 block w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                    >
                                    <div wire:loading wire:target="{{ $documento['prop'] }}" class="mt-1 text-xs text-blue-400">Subiendo…</div>
                                    @error($documento['prop']) <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <div class="mt-10 flex items-center justify-between">
                    <button
                        type="button"
                        wire:click="anterior"
                        @if ($step === 1) disabled @endif
                        class="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Anterior
                    </button>

                    @if ($step < 3)
                        <button
                            type="button"
                            wire:click="siguiente"
                            class="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            Siguiente
                        </button>
                    @else
                        <button
                            type="button"
                            wire:click="enviar"
                            wire:loading.attr="disabled"
                            wire:target="enviar"
                            class="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            <span wire:loading.remove wire:target="enviar">Enviar solicitud</span>
                            <span wire:loading wire:target="enviar">Enviando…</span>
                        </button>
                    @endif
                </div>
            @endif
        </div>
    </div>
</div>
