<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Services;

use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Pagos\Enums\EstadoCuotaEnum;
use App\Modules\Pagos\Models\CargoAdicional;
use Illuminate\Validation\ValidationException;

/**
 * Cargos adicionales: cobros puntuales de un estudiante que no forman parte
 * de un plan de cuotas (Convalidación, Exoneración, Recuperación, Visación,
 * etc.). A diferencia de CEBA (que repite esta lógica directo en 3
 * componentes Livewire), se concentra aquí -- misma separación que ya usa
 * este proyecto con PlanPagoService::editarMontoTotal().
 */
class CargoAdicionalService
{
    public function crear(Estudiante $estudiante, string $concepto, float $monto, ?int $registradoPor): CargoAdicional
    {
        if ($monto <= 0) {
            throw ValidationException::withMessages([
                'cargoMontoNuevo' => 'El monto debe ser mayor a cero.',
            ]);
        }

        return CargoAdicional::query()->create([
            'estudiante_id' => $estudiante->id,
            'concepto' => $concepto,
            'monto' => $monto,
            'estado' => EstadoCuotaEnum::PENDIENTE,
            'registrado_por' => $registradoPor,
        ]);
    }

    /**
     * Corrige el monto nominal de un cargo (ej. se anotó mal el precio al
     * registrarlo). No puede bajar del monto ya cobrado -- mismo criterio
     * que PlanPagoService::editarMontoTotal() para cuotas. Si el cargo ya
     * estaba "pagado" y el nuevo monto deja saldo pendiente, vuelve a
     * "pendiente": el estado siempre refleja el saldo real.
     */
    public function editarMonto(CargoAdicional $cargoAdicional, float $nuevoMonto): CargoAdicional
    {
        if ($nuevoMonto <= 0) {
            throw ValidationException::withMessages([
                'montoCargoNuevo' => 'El monto debe ser mayor a cero.',
            ]);
        }

        $montoPagado = $cargoAdicional->montoPagado();

        if ($nuevoMonto < $montoPagado) {
            throw ValidationException::withMessages([
                'montoCargoNuevo' => 'El nuevo monto no puede ser menor a lo ya pagado (S/ '.number_format($montoPagado, 2).').',
            ]);
        }

        $cargoAdicional->update([
            'monto' => $nuevoMonto,
            'estado' => $cargoAdicional->estado === EstadoCuotaEnum::PAGADO && $nuevoMonto > $montoPagado
                ? EstadoCuotaEnum::PENDIENTE
                : $cargoAdicional->estado,
        ]);

        return $cargoAdicional->fresh();
    }
}
