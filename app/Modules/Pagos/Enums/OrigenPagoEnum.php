<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Enums;

/**
 * Por dónde entró el dinero -- se imprime como "Origen" en la boleta. Las
 * opciones válidas dependen del método de pago (ver disponiblesPara()): un
 * pago en efectivo solo puede venir de ventanilla, uno por Yape/Plin puede
 * ser por QR o enviado al número, etc.
 */
enum OrigenPagoEnum: string
{
    case PAGO_QR = 'pago_qr';
    case TRANSFERENCIA = 'transferencia';
    case DEPOSITO_AGENCIA = 'deposito_agencia';
    case VENTANILLA = 'ventanilla';

    public function label(): string
    {
        return match ($this) {
            self::PAGO_QR => 'Pago QR',
            self::TRANSFERENCIA => 'Transferencia',
            self::DEPOSITO_AGENCIA => 'Depósito en agencia',
            self::VENTANILLA => 'Ventanilla (caja)',
        };
    }

    /**
     * @return list<self>
     */
    public static function paraMetodo(MetodoPagoEnum $metodo): array
    {
        return match ($metodo) {
            MetodoPagoEnum::EFECTIVO => [self::VENTANILLA],
            MetodoPagoEnum::YAPE, MetodoPagoEnum::PLIN => [self::PAGO_QR, self::TRANSFERENCIA],
            MetodoPagoEnum::TRANSFERENCIA => [self::TRANSFERENCIA, self::DEPOSITO_AGENCIA],
            MetodoPagoEnum::OTRO, MetodoPagoEnum::MIXTO => self::cases(),
        };
    }

    /**
     * Orígenes válidos para un pago cubierto con estos métodos. Un pago
     * lleva un solo origen aunque sea mixto: si alguna parte es
     * electrónica, el origen describe esa parte (la de efectivo siempre es
     * ventanilla), así que en un pago mixto solo cuentan los métodos que
     * no son efectivo.
     *
     * @param  list<MetodoPagoEnum>  $metodos
     * @return list<self>
     */
    public static function disponiblesPara(array $metodos): array
    {
        $electronicos = array_values(array_filter($metodos, fn (MetodoPagoEnum $m) => $m !== MetodoPagoEnum::EFECTIVO));

        if ($electronicos === []) {
            return $metodos === [] ? [] : [self::VENTANILLA];
        }

        $origenes = [];

        foreach ($electronicos as $metodo) {
            foreach (self::paraMetodo($metodo) as $origen) {
                $origenes[$origen->value] = $origen;
            }
        }

        return array_values($origenes);
    }

    /**
     * El número de operación es obligatorio si alguna parte del pago no es
     * en efectivo (el efectivo no genera ningún número que anotar).
     *
     * @param  list<MetodoPagoEnum>  $metodos
     */
    public static function requiereNumeroOperacion(array $metodos): bool
    {
        foreach ($metodos as $metodo) {
            if ($metodo !== MetodoPagoEnum::EFECTIVO) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convierte los valores crudos de los selects de método (pueden venir
     * vacíos mientras el usuario todavía no elige) en enums válidos.
     *
     * @param  iterable<mixed>  $valores
     * @return list<MetodoPagoEnum>
     */
    public static function metodosDesde(iterable $valores): array
    {
        $metodos = [];

        foreach ($valores as $valor) {
            $metodo = is_string($valor) ? MetodoPagoEnum::tryFrom($valor) : null;

            if ($metodo !== null && $metodo !== MetodoPagoEnum::MIXTO) {
                $metodos[] = $metodo;
            }
        }

        return $metodos;
    }

    /**
     * Reglas de validación para los campos de origen y N.° de operación de
     * un formulario de pago, según los métodos elegidos.
     *
     * @param  list<MetodoPagoEnum>  $metodos
     * @return array<string, list<string>>
     */
    public static function reglas(array $metodos, string $campoOrigen, string $campoNumero): array
    {
        $valores = array_map(fn (self $o) => $o->value, self::disponiblesPara($metodos));

        return [
            $campoOrigen => ['required', 'string', 'in:'.implode(',', $valores)],
            $campoNumero => self::requiereNumeroOperacion($metodos)
                ? ['required', 'string', 'max:50']
                : ['nullable', 'string', 'max:50'],
        ];
    }
}
