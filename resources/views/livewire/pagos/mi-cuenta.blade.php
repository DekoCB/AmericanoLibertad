<?php

use App\Modules\Matricula\Models\Matricula;
use App\Modules\Pagos\Enums\MetodoPagoEnum;
use App\Modules\Pagos\Enums\OrigenPagoEnum;
use App\Modules\Pagos\Models\CargoAdicional;
use App\Modules\Pagos\Models\ConceptoPago;
use App\Modules\Pagos\Models\Cuota;
use App\Modules\Pagos\Services\BloqueoAccesoService;
use App\Modules\Pagos\Services\CuentaBancariaService;
use App\Modules\Pagos\Services\PagoService;
use App\Modules\Pagos\Services\PlanPagoService;
use App\Shared\Enums\RolEnum;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;
use Livewire\WithFileUploads;

new #[Layout('layouts.app')] class extends Component
{
    use WithFileUploads;

    /** @var array<int, string> */
    public array $metodoPorCuota = [];

    /** @var array<int, mixed> */
    public array $comprobantePorCuota = [];

    /** @var array<int, string> */
    public array $montoPorCuota = [];

    /** @var array<int, string> */
    public array $metodoPorCargo = [];

    /** @var array<int, mixed> */
    public array $comprobantePorCargo = [];

    /** @var array<int, string> */
    public array $montoPorCargo = [];

    // Origen y N.° de operación de cada pago enviado (se imprimen en la
    // boleta). Las opciones de origen dependen del método elegido en la
    // misma fila -- ver OrigenPagoEnum::reglas().
    /** @var array<int, string> */
    public array $origenPorCuota = [];

    /** @var array<int, string> */
    public array $operacionPorCuota = [];

    /** @var array<int, string> */
    public array $origenPorCargo = [];

    /** @var array<int, string> */
    public array $operacionPorCargo = [];

    public function mount(): void
    {
        $user = Auth::user();

        abort_unless(
            $user->hasRole(RolEnum::ESTUDIANTE->value) && $user->hasPermissionTo('pagos.ver_propio') && $user->estudiante,
            403,
        );
    }

    /**
     * Al cambiar el método de una fila se ajusta su origen: si el elegido
     * deja de ser válido se limpia, y si solo hay una opción (efectivo →
     * ventanilla) se selecciona sola.
     */
    public function updatedMetodoPorCuota(mixed $valor, int|string $cuotaId): void
    {
        $this->origenPorCuota[(int) $cuotaId] = $this->origenAjustado($valor, $this->origenPorCuota[(int) $cuotaId] ?? '');
    }

    public function updatedMetodoPorCargo(mixed $valor, int|string $cargoId): void
    {
        $this->origenPorCargo[(int) $cargoId] = $this->origenAjustado($valor, $this->origenPorCargo[(int) $cargoId] ?? '');
    }

    private function origenAjustado(mixed $metodo, string $origenActual): string
    {
        $valores = array_map(
            fn (OrigenPagoEnum $o) => $o->value,
            OrigenPagoEnum::disponiblesPara(OrigenPagoEnum::metodosDesde([$metodo])),
        );

        if (in_array($origenActual, $valores, true)) {
            return $origenActual;
        }

        return count($valores) === 1 ? $valores[0] : '';
    }

    public function subirComprobante(int $cuotaId, PagoService $service): void
    {
        $estudiante = Auth::user()->estudiante;
        abort_unless($estudiante !== null, 403);

        $cuota = Cuota::query()->with('planPago.matricula')->findOrFail($cuotaId);
        abort_unless($cuota->planPago->matricula?->estudiante_id === $estudiante->id, 403);

        $this->updatedMetodoPorCuota($this->metodoPorCuota[$cuotaId] ?? null, (string) $cuotaId);

        $this->validate([
            "metodoPorCuota.{$cuotaId}" => 'required|string|in:'.implode(',', array_column(MetodoPagoEnum::seleccionables(), 'value')),
            "comprobantePorCuota.{$cuotaId}" => 'required|file|max:5120',
            // El tope es el saldo pendiente real (no el monto nominal de la
            // cuota): este es el único punto donde el propio estudiante
            // declara cuánto pagó, sin cruce contra el comprobante, así que
            // no debe poder registrar más de lo que efectivamente debe.
            "montoPorCuota.{$cuotaId}" => "required|numeric|min:0.01|max:{$cuota->saldoPendiente()}",
        ] + OrigenPagoEnum::reglas(
            OrigenPagoEnum::metodosDesde([$this->metodoPorCuota[$cuotaId] ?? null]),
            "origenPorCuota.{$cuotaId}",
            "operacionPorCuota.{$cuotaId}",
        ), [], [
            "origenPorCuota.{$cuotaId}" => 'origen',
            "operacionPorCuota.{$cuotaId}" => 'N.° de operación',
        ]);

        $concepto = ConceptoPago::query()->where('tipo', 'mensualidad')->first()
            ?? ConceptoPago::query()->firstOrFail();

        $service->registrar(
            $estudiante,
            $concepto,
            [['monto' => (float) $this->montoPorCuota[$cuotaId], 'metodo' => $this->metodoPorCuota[$cuotaId]]],
            $cuota,
            $this->comprobantePorCuota[$cuotaId],
            null,
            origen: OrigenPagoEnum::from($this->origenPorCuota[$cuotaId]),
            numeroOperacion: $this->operacionPorCuota[$cuotaId] ?? null,
        );

        unset($this->metodoPorCuota[$cuotaId], $this->comprobantePorCuota[$cuotaId], $this->montoPorCuota[$cuotaId], $this->origenPorCuota[$cuotaId], $this->operacionPorCuota[$cuotaId]);
        session()->flash('status', 'Comprobante enviado. Quedará pendiente de aprobación de Tesorería.');
    }

    public function subirComprobanteCargo(int $cargoAdicionalId, PagoService $service): void
    {
        $estudiante = Auth::user()->estudiante;
        abort_unless($estudiante !== null, 403);

        $cargo = CargoAdicional::query()->findOrFail($cargoAdicionalId);
        abort_unless($cargo->estudiante_id === $estudiante->id, 403);

        $this->updatedMetodoPorCargo($this->metodoPorCargo[$cargoAdicionalId] ?? null, (string) $cargoAdicionalId);

        $this->validate([
            "metodoPorCargo.{$cargoAdicionalId}" => 'required|string|in:'.implode(',', array_column(MetodoPagoEnum::seleccionables(), 'value')),
            "comprobantePorCargo.{$cargoAdicionalId}" => 'required|file|max:5120',
            "montoPorCargo.{$cargoAdicionalId}" => "required|numeric|min:0.01|max:{$cargo->saldoPendiente()}",
        ] + OrigenPagoEnum::reglas(
            OrigenPagoEnum::metodosDesde([$this->metodoPorCargo[$cargoAdicionalId] ?? null]),
            "origenPorCargo.{$cargoAdicionalId}",
            "operacionPorCargo.{$cargoAdicionalId}",
        ), [], [
            "origenPorCargo.{$cargoAdicionalId}" => 'origen',
            "operacionPorCargo.{$cargoAdicionalId}" => 'N.° de operación',
        ]);

        $concepto = ConceptoPago::query()->where('tipo', 'otro')->first()
            ?? ConceptoPago::query()->firstOrFail();

        $service->registrar(
            $estudiante,
            $concepto,
            [['monto' => (float) $this->montoPorCargo[$cargoAdicionalId], 'metodo' => $this->metodoPorCargo[$cargoAdicionalId]]],
            null,
            $this->comprobantePorCargo[$cargoAdicionalId],
            null,
            cargoAdicional: $cargo,
            origen: OrigenPagoEnum::from($this->origenPorCargo[$cargoAdicionalId]),
            numeroOperacion: $this->operacionPorCargo[$cargoAdicionalId] ?? null,
        );

        unset($this->metodoPorCargo[$cargoAdicionalId], $this->comprobantePorCargo[$cargoAdicionalId], $this->montoPorCargo[$cargoAdicionalId], $this->origenPorCargo[$cargoAdicionalId], $this->operacionPorCargo[$cargoAdicionalId]);
        session()->flash('status', 'Comprobante enviado. Quedará pendiente de aprobación de Tesorería.');
    }

    public function with(PagoService $pagos, PlanPagoService $planes, CuentaBancariaService $cuentas, BloqueoAccesoService $bloqueos): array
    {
        $estudiante = Auth::user()->estudiante;

        $matriculas = Matricula::query()
            ->where('estudiante_id', $estudiante->id)
            ->where('estado', 'aprobada')
            ->with(['ciclo', 'carrera'])
            ->latest('fecha_matricula')
            ->get()
            ->map(fn (Matricula $matricula) => [
                'matricula' => $matricula,
                'plan' => $planes->planDe($matricula),
            ]);

        // Prellena el monto sugerido al saldo pendiente real de cada cuota
        // (así el caso común -- pagar todo -- sigue siendo casi un clic),
        // pero queda editable para que el estudiante pueda declarar un
        // pago parcial. Solo se inicializa una vez por cuota (??=), para no
        // pisar lo que el estudiante ya haya escrito en un re-render.
        foreach ($matriculas as $item) {
            if (! $item['plan']) {
                continue;
            }

            foreach ($item['plan']->cuotas as $cuota) {
                if ($cuota->estado->value === 'pendiente') {
                    $this->montoPorCuota[$cuota->id] ??= (string) $cuota->saldoPendiente();
                }
            }
        }

        $cargosAdicionalesPendientes = CargoAdicional::query()
            ->where('estudiante_id', $estudiante->id)
            ->where('estado', 'pendiente')
            ->get();

        foreach ($cargosAdicionalesPendientes as $cargo) {
            $this->montoPorCargo[$cargo->id] ??= (string) $cargo->saldoPendiente();
        }

        return [
            'matriculas' => $matriculas,
            'cargosAdicionalesPendientes' => $cargosAdicionalesPendientes,
            'misPagos' => $pagos->misPagos($estudiante),
            'cuentasBancarias' => $cuentas->activas(),
            'estaBloqueado' => $bloqueos->estaBloqueado($estudiante),
        ];
    }
}; ?>

<div class="max-w-3xl space-y-6">
    <x-slot name="header">
        <h1 class="font-display text-2xl text-ink">Mi estado de cuenta</h1>
        <p class="mt-1 text-sm text-ink-dim">Cuotas, pagos y cuentas para pagar tu mensualidad.</p>
    </x-slot>

    @if (session('status'))
        <x-alert>{{ session('status') }}</x-alert>
    @endif

    @if ($estaBloqueado)
        <div class="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Tienes cuotas vencidas sin pagar. Mientras la deuda siga activa, tu libreta de notas no estará disponible.
            Regulariza tus pagos o comunícate con Cobranza para un compromiso de pago.
        </div>
    @endif

    @foreach ($matriculas as $item)
        <div class="rounded-2xl border border-border bg-surface shadow-sm p-6">
            <h2 class="text-sm font-semibold text-ink">{{ $item['matricula']->carrera->name }} · {{ $item['matricula']->ciclo->nombre }}</h2>

            @if (! $item['plan'])
                <p class="mt-3 text-sm text-ink-faint">Todavía no se te ha asignado un plan de pago para este ciclo.</p>
            @else
                <div class="mt-4 divide-y divide-border">
                    @foreach ($item['plan']->cuotas as $cuota)
                        <div class="py-3 text-sm">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <p class="text-ink">Cuota {{ $cuota->numero }} de {{ $item['plan']->numero_cuotas }}</p>
                                    <p class="text-xs text-ink-faint">Vence {{ $cuota->fecha_vencimiento->format('d/m/Y') }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-display text-ink">S/ {{ number_format((float) $cuota->monto, 2) }}</p>
                                    <span @class([
                                        'rounded-full px-2 py-0.5 text-xs',
                                        'bg-ok/10 text-ok' => $cuota->estado->value === 'pagado',
                                        'bg-warn/10 text-warn' => $cuota->estado->value === 'pendiente' && ! $cuota->estaVencida(),
                                        'bg-danger/10 text-danger' => $cuota->estaVencida(),
                                        'bg-surface-2 text-ink-faint' => $cuota->estado->value === 'exonerado',
                                    ])>
                                        {{ $cuota->estaVencida() ? 'Vencida' : $cuota->estado->label() }}
                                    </span>
                                </div>
                            </div>

                            @if ($cuota->estado->value === 'pendiente')
                                <form wire:submit="subirComprobante({{ $cuota->id }})" class="mt-2 flex flex-wrap items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs text-ink-faint">S/</span>
                                        <input
                                            wire:model="montoPorCuota.{{ $cuota->id }}"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            class="w-20 rounded-md border-border text-xs"
                                            placeholder="Monto"
                                        >
                                    </div>
                                    <x-select-input
                                        wire:model.live="metodoPorCuota.{{ $cuota->id }}"
                                        placeholder="Método…"
                                        class="text-xs"
                                        :options="collect(\App\Modules\Pagos\Enums\MetodoPagoEnum::seleccionables())->mapWithKeys(fn ($metodoOpcion) => [$metodoOpcion->value => $metodoOpcion->label()])"
                                    />
                                    @php
                                        $origenesCuota = \App\Modules\Pagos\Enums\OrigenPagoEnum::disponiblesPara(\App\Modules\Pagos\Enums\OrigenPagoEnum::metodosDesde([$metodoPorCuota[$cuota->id] ?? null]));
                                    @endphp
                                    @if ($origenesCuota !== [])
                                        <x-select-input
                                            wire:model="origenPorCuota.{{ $cuota->id }}"
                                            wire:key="origen-cuota-{{ $cuota->id }}-{{ $metodoPorCuota[$cuota->id] ?? '' }}"
                                            placeholder="Origen…"
                                            class="text-xs"
                                            :options="collect($origenesCuota)->mapWithKeys(fn ($origenOpcion) => [$origenOpcion->value => $origenOpcion->label()])"
                                        />
                                    @endif
                                    @if (\App\Modules\Pagos\Enums\OrigenPagoEnum::requiereNumeroOperacion(\App\Modules\Pagos\Enums\OrigenPagoEnum::metodosDesde([$metodoPorCuota[$cuota->id] ?? null])))
                                        <input
                                            wire:model="operacionPorCuota.{{ $cuota->id }}"
                                            type="text"
                                            maxlength="50"
                                            class="w-32 rounded-md border-border text-xs"
                                            placeholder="N.° de operación"
                                        >
                                    @endif
                                    <input wire:model="comprobantePorCuota.{{ $cuota->id }}" type="file" class="text-xs text-ink-dim file:mr-2 file:rounded-md file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-xs file:text-ink">
                                    <button type="submit" class="text-xs font-medium text-accent hover:underline">Enviar comprobante</button>
                                </form>
                                <p class="mt-1 text-xs text-ink-faint">Si pagaste menos de la cuota completa, cambia el monto por lo que realmente pagaste.</p>
                                <x-input-error :messages="$errors->get('montoPorCuota.'.$cuota->id)" class="mt-1" />
                                <x-input-error :messages="$errors->get('metodoPorCuota.'.$cuota->id)" class="mt-1" />
                                <x-input-error :messages="$errors->get('origenPorCuota.'.$cuota->id)" class="mt-1" />
                                <x-input-error :messages="$errors->get('operacionPorCuota.'.$cuota->id)" class="mt-1" />
                                <x-input-error :messages="$errors->get('comprobantePorCuota.'.$cuota->id)" class="mt-1" />
                            @endif
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    @endforeach

    @if ($cargosAdicionalesPendientes->isNotEmpty())
        <div class="rounded-2xl border border-border bg-surface shadow-sm p-6">
            <h2 class="text-sm font-semibold text-ink">Cargos pendientes</h2>
            <p class="mt-1 text-xs text-ink-faint">Otros cobros puntuales — Convalidación, Exoneración, Recuperación, Visación, etc.</p>

            <div class="mt-4 divide-y divide-border">
                @foreach ($cargosAdicionalesPendientes as $cargo)
                    <div class="py-3 text-sm">
                        <div class="flex items-center justify-between gap-4">
                            <p class="text-ink">{{ $cargo->concepto }}</p>
                            <p class="font-display text-ink">S/ {{ number_format($cargo->saldoPendiente(), 2) }}</p>
                        </div>

                        <form wire:submit="subirComprobanteCargo({{ $cargo->id }})" class="mt-2 flex flex-wrap items-center gap-2">
                            <div class="flex items-center gap-1">
                                <span class="text-xs text-ink-faint">S/</span>
                                <input
                                    wire:model="montoPorCargo.{{ $cargo->id }}"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    class="w-20 rounded-md border-border text-xs"
                                    placeholder="Monto"
                                >
                            </div>
                            <x-select-input
                                wire:model.live="metodoPorCargo.{{ $cargo->id }}"
                                placeholder="Método…"
                                class="text-xs"
                                :options="collect(\App\Modules\Pagos\Enums\MetodoPagoEnum::seleccionables())->mapWithKeys(fn ($metodoOpcion) => [$metodoOpcion->value => $metodoOpcion->label()])"
                            />
                            @php
                                $origenesCargo = \App\Modules\Pagos\Enums\OrigenPagoEnum::disponiblesPara(\App\Modules\Pagos\Enums\OrigenPagoEnum::metodosDesde([$metodoPorCargo[$cargo->id] ?? null]));
                            @endphp
                            @if ($origenesCargo !== [])
                                <x-select-input
                                    wire:model="origenPorCargo.{{ $cargo->id }}"
                                    wire:key="origen-cargo-{{ $cargo->id }}-{{ $metodoPorCargo[$cargo->id] ?? '' }}"
                                    placeholder="Origen…"
                                    class="text-xs"
                                    :options="collect($origenesCargo)->mapWithKeys(fn ($origenOpcion) => [$origenOpcion->value => $origenOpcion->label()])"
                                />
                            @endif
                            @if (\App\Modules\Pagos\Enums\OrigenPagoEnum::requiereNumeroOperacion(\App\Modules\Pagos\Enums\OrigenPagoEnum::metodosDesde([$metodoPorCargo[$cargo->id] ?? null])))
                                <input
                                    wire:model="operacionPorCargo.{{ $cargo->id }}"
                                    type="text"
                                    maxlength="50"
                                    class="w-32 rounded-md border-border text-xs"
                                    placeholder="N.° de operación"
                                >
                            @endif
                            <input wire:model="comprobantePorCargo.{{ $cargo->id }}" type="file" class="text-xs text-ink-dim file:mr-2 file:rounded-md file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-xs file:text-ink">
                            <button type="submit" class="text-xs font-medium text-accent hover:underline">Enviar comprobante</button>
                        </form>
                        <p class="mt-1 text-xs text-ink-faint">Si pagaste menos del monto completo, cambia el monto por lo que realmente pagaste.</p>
                        <x-input-error :messages="$errors->get('montoPorCargo.'.$cargo->id)" class="mt-1" />
                        <x-input-error :messages="$errors->get('metodoPorCargo.'.$cargo->id)" class="mt-1" />
                        <x-input-error :messages="$errors->get('origenPorCargo.'.$cargo->id)" class="mt-1" />
                        <x-input-error :messages="$errors->get('operacionPorCargo.'.$cargo->id)" class="mt-1" />
                        <x-input-error :messages="$errors->get('comprobantePorCargo.'.$cargo->id)" class="mt-1" />
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    <div class="rounded-2xl border border-border bg-surface shadow-sm p-6">
        <h2 class="text-sm font-semibold text-ink">Historial de pagos</h2>
        <div class="mt-4 divide-y divide-border">
            @forelse ($misPagos as $pago)
                <div class="flex items-center justify-between py-3 text-sm">
                    <div>
                        <p class="text-ink">{{ $pago->nombreConcepto() }}</p>
                        <p class="text-xs text-ink-faint">{{ $pago->fecha_pago->format('d/m/Y') }} · {{ $pago->metodo->label() }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-ink">S/ {{ number_format((float) $pago->monto, 2) }}</p>
                        <span @class([
                            'rounded-full px-2 py-0.5 text-xs',
                            'bg-ok/10 text-ok' => $pago->estado->value === 'aprobado',
                            'bg-warn/10 text-warn' => $pago->estado->value === 'pendiente',
                            'bg-danger/10 text-danger' => $pago->estado->value === 'rechazado',
                        ])>{{ $pago->estado->label() }}</span>
                        @if ($pago->recibo && $pago->recibo->getFirstMedia('pdf'))
                            <a href="{{ $pago->recibo->getFirstMediaUrl('pdf') }}" target="_blank" class="block text-xs font-medium text-accent hover:underline">Recibo (A4)</a>
                            <a href="{{ route('pagos.recibos.ticket', [$pago->recibo, 80]) }}" target="_blank" class="block text-xs font-medium text-accent hover:underline">Ticket 80mm</a>
                            <a href="{{ route('pagos.recibos.ticket', [$pago->recibo, 58]) }}" target="_blank" class="block text-xs font-medium text-accent hover:underline">Ticket 58mm</a>
                        @endif
                    </div>
                </div>
            @empty
                <p class="py-4 text-sm text-ink-faint">Todavía no registras pagos.</p>
            @endforelse
        </div>
    </div>

    <div class="rounded-2xl border border-border bg-surface shadow-sm p-6">
        <h2 class="text-sm font-semibold text-ink">Cuentas para pagar</h2>
        <div class="mt-4 space-y-3">
            @forelse ($cuentasBancarias as $cuenta)
                <div class="flex items-center justify-between text-sm">
                    <div>
                        @if ($cuenta->medio === \App\Modules\Pagos\Enums\MedioCuentaEnum::BANCO)
                            <p class="text-ink">{{ $cuenta->banco }} — {{ $cuenta->numero_cuenta }}</p>
                            <p class="text-xs text-ink-faint">{{ $cuenta->titular }}@if ($cuenta->cci) · CCI {{ $cuenta->cci }} @endif</p>
                        @else
                            <p class="text-ink">{{ $cuenta->tipo_billetera?->label() }} — {{ $cuenta->celular }}</p>
                            <p class="text-xs text-ink-faint">{{ $cuenta->titular }}</p>
                        @endif
                    </div>
                    @if ($cuenta->getFirstMedia('qr'))
                        <a href="{{ $cuenta->getFirstMediaUrl('qr') }}" target="_blank" class="text-xs font-medium text-accent hover:underline">Ver QR</a>
                    @endif
                </div>
            @empty
                <p class="text-sm text-ink-faint">No hay cuentas registradas todavía.</p>
            @endforelse
        </div>
    </div>
</div>
