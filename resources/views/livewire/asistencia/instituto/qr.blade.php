<?php

use App\Modules\Asistencia\Services\AsistenciaQrService;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public function mount(): void
    {
        abort_unless(Auth::user()->hasPermissionTo('asistencia.ingreso_ver'), 403);
    }

    public function with(AsistenciaQrService $service): array
    {
        return ['qr' => $service->dataUrlDelInstituto()];
    }
}; ?>

<div>
    <x-slot name="header">
        <a href="{{ route('asistencia.index') }}" wire:navigate class="text-sm text-ink-faint hover:text-ink">← Asistencia</a>
        <h1 class="mt-1 font-display text-2xl text-ink">Ingreso al instituto</h1>
        <p class="mt-1 text-sm text-ink-dim">Proyecta o imprime este código en la entrada.</p>
    </x-slot>

    <div class="mx-auto max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <img src="{{ $qr }}" alt="Código QR de ingreso al instituto" class="mx-auto h-72 w-72 rounded-lg border border-border bg-white p-4">
        <p class="mt-4 text-sm text-ink-dim">Los estudiantes lo escanean desde "Marcar mi asistencia" al llegar al instituto.</p>
    </div>
</div>
