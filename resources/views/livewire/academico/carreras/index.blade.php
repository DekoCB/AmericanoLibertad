<?php

use App\Models\Carrera;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public bool $mostrarModal = false;

    public ?int $editandoId = null;

    public string $name = '';

    public string $code = '';

    public string $totalCiclos = '6';

    public function mount(): void
    {
        Gate::authorize('academico.ver');
    }

    public function abrirModal(?int $carreraId = null): void
    {
        Gate::authorize('academico.gestionar');

        $this->resetValidation();
        $this->editandoId = $carreraId;

        if ($carreraId) {
            $carrera = Carrera::query()->findOrFail($carreraId);
            $this->name = $carrera->name;
            $this->code = $carrera->code;
            $this->totalCiclos = (string) $carrera->total_ciclos;
        } else {
            $this->reset(['name', 'code']);
            $this->totalCiclos = '6';
        }

        $this->mostrarModal = true;
    }

    public function guardar(): void
    {
        Gate::authorize('academico.gestionar');

        $this->validate([
            'name' => 'required|string|max:100',
            'code' => ['required', 'string', 'max:10', Rule::unique('carreras', 'code')->ignore($this->editandoId)],
            'totalCiclos' => 'required|integer|min:1|max:10',
        ]);

        $datos = [
            'name' => $this->name,
            'code' => mb_strtoupper($this->code),
            'total_ciclos' => (int) $this->totalCiclos,
        ];

        if ($this->editandoId) {
            Carrera::query()->findOrFail($this->editandoId)->update($datos);
        } else {
            Carrera::query()->create($datos);
        }

        $this->mostrarModal = false;
        session()->flash('status', 'Carrera guardada correctamente.');
    }

    public function with(): array
    {
        return [
            'carreras' => Carrera::query()->withCount('cursos')->orderBy('name')->get(),
        ];
    }
}; ?>

<div>
    <x-slot name="header">
        <h1 class="font-display text-2xl text-ink">Carreras</h1>
        <p class="mt-1 text-sm text-ink-dim">Programas técnicos que ofrece el instituto.</p>
    </x-slot>

    {{-- Ver academico/grados/index.blade.php: el botón no puede vivir en x-slot="header". --}}
    @can('academico.gestionar')
        <div class="mb-4 flex justify-end">
            <x-primary-button type="button" wire:click="abrirModal" class="gap-2">
                <x-heroicon-o-plus class="h-4 w-4" />
                Nueva carrera
            </x-primary-button>
        </div>
    @endcan

    @if (session('status'))
        <x-alert class="mb-4">{{ session('status') }}</x-alert>
    @endif

    <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <table class="min-w-full divide-y divide-border text-sm">
            <thead class="bg-surface-2">
                <tr>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Nombre</th>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Código</th>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Ciclos</th>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Cursos</th>
                    <th class="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border">
                @forelse ($carreras as $carrera)
                    <tr wire:key="carrera-{{ $carrera->id }}">
                        <td class="px-4 py-3 font-medium text-ink">{{ $carrera->name }}</td>
                        <td class="px-4 py-3 font-mono text-ink-dim">{{ $carrera->code }}</td>
                        <td class="px-4 py-3 text-ink-dim">{{ $carrera->total_ciclos }}</td>
                        <td class="px-4 py-3 text-ink-dim">{{ $carrera->cursos_count }}</td>
                        <td class="px-4 py-3 text-right">
                            @can('academico.gestionar')
                                <button wire:click="abrirModal({{ $carrera->id }})" class="text-sm font-medium text-accent hover:underline">Editar</button>
                            @endcan
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="px-4 py-8 text-center text-sm text-ink-faint">No hay carreras registradas.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div
        x-show="$wire.mostrarModal"
        x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
        wire:click.self="$set('mostrarModal', false)"
        x-transition:enter="ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
    >
        <div
            x-show="$wire.mostrarModal"
            class="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg"
            x-transition:enter="ease-out duration-300"
            x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave="ease-in duration-200"
            x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
                <h2 class="font-display text-lg text-ink">{{ $editandoId ? 'Editar carrera' : 'Nueva carrera' }}</h2>

                <form wire:submit="guardar" class="mt-4 space-y-4">
                    <div>
                        <x-input-label for="name" value="Nombre" />
                        <x-text-input wire:model="name" id="name" class="mt-1 block w-full" />
                        <x-input-error :messages="$errors->get('name')" class="mt-1" />
                    </div>

                    <div>
                        <x-input-label for="code" value="Código" />
                        <x-text-input wire:model="code" id="code" class="mt-1 block w-full uppercase" placeholder="Ej. ENF" />
                        <x-input-error :messages="$errors->get('code')" class="mt-1" />
                    </div>

                    <div>
                        <x-input-label for="totalCiclos" value="Total de ciclos" />
                        <x-text-input wire:model="totalCiclos" id="totalCiclos" type="number" min="1" max="10" class="mt-1 block w-full" />
                        <x-input-error :messages="$errors->get('totalCiclos')" class="mt-1" />
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                        <x-secondary-button type="button" wire:click="$set('mostrarModal', false)">Cancelar</x-secondary-button>
                        <x-primary-button type="submit">Guardar</x-primary-button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
