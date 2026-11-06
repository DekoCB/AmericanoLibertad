<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Services;

use App\Modules\Pagos\Enums\SerieReciboEnum;
use App\Modules\Pagos\Models\Pago;
use App\Modules\Pagos\Models\Recibo;
use App\Modules\Pagos\Support\DetalleRecibo;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\UniqueConstraintViolationException;

class ReciboService
{
    /**
     * Cada recibo se emite en UNA sola serie, elegida a mano por quien
     * aprueba el pago -- como si hubiera dos talonarios físicos en
     * circulación (001 y 002) y se decidiera de cuál sacar el número esta
     * vez. Por eso cada serie lleva su propio correlativo independiente,
     * no uno compartido.
     */
    public function emitir(Pago $pago, SerieReciboEnum $serie): Recibo
    {
        $recibo = $this->crearConNumeroUnico($pago, $serie);

        $pdf = Pdf::loadView('pdf.recibo', ['pago' => $pago, 'recibo' => $recibo, 'serie' => $serie]);

        $recibo->addMediaFromString($pdf->output())
            ->usingFileName("{$serie->value}-{$recibo->numero_recibo}.pdf")
            ->toMediaCollection('pdf');

        return $recibo;
    }

    /**
     * Renderiza el recibo en formato ticket (80mm o 58mm) a partir de los
     * mismos datos ya guardados en $recibo->pago -- sin crear ni modificar
     * ningún registro ni adjunto. A diferencia de emitir(), se llama en
     * cada request (ver ReciboTicketController) y nunca se persiste: así
     * funciona retroactivamente para cualquier recibo ya emitido, y si se
     * ajusta la plantilla de ticket más adelante, todos los recibos
     * reflejan el cambio sin regenerar nada.
     *
     * dompdf no soporta un alto de página que se ajuste solo al contenido
     * (ni "auto" junto a un ancho explícito en @page, ni ningún "shrink to
     * fit" real) -- así que el alto se estima aquí mismo a partir del
     * contenido real del pago (cuántas líneas va a ocupar cada sección,
     * incluido el ajuste de línea de la observación) y se pasa como un
     * valor fijo. Mejor pecar de un poco de margen de más que cortar texto.
     */
    public function renderizarTicket(Recibo $recibo, int $anchoMm): string
    {
        $pago = $recibo->pago;
        $detalle = DetalleRecibo::desde($pago, $recibo);
        $altoMm = $this->alturaTicketMm($pago, $anchoMm, $detalle);

        $pdf = Pdf::loadView('pdf.recibo-ticket', [
            'pago' => $pago,
            'recibo' => $recibo,
            'serie' => $recibo->serie,
            'detalle' => $detalle,
            'anchoMm' => $anchoMm,
            'altoMm' => $altoMm,
        ]);

        return $pdf->output();
    }

    /**
     * Estima cuántos milímetros de alto necesita el ticket, contando líneas
     * de texto por bloque (las fijas de la plantilla + las que se ajustan
     * según el ancho para los campos de largo variable: razón social,
     * cliente, aula, descripción del concepto, monto en letras y
     * observación).
     */
    public function alturaTicketMm(Pago $pago, int $anchoMm, ?DetalleRecibo $detalle = null): float
    {
        // Generoso a propósito: una primera versión más ajustada subestimó
        // el alto real y el contenido se desbordó a una segunda página --
        // mucho peor para imprimir en una ticketera que dejar de más un poco
        // de espacio en blanco.
        $angosto = $anchoMm <= 58;
        $detalle ??= DetalleRecibo::desde($pago, $pago->recibo ?? new Recibo(['emitido_en' => now()]));

        $altoLineaMm = $angosto ? 3.0 : 3.4;
        $caracteresPorLinea = $angosto ? 34 : 42;
        $caracteresValor = (int) floor($caracteresPorLinea * 0.64); // columna de valor en CLIENTE/AULA/...
        $caracteresDescripcion = $angosto ? 13 : 18;                 // columna DESCRIPCIÓN de la tabla

        $lineasDe = fn (string $texto, int $porLinea): int => max(1, (int) ceil(mb_strlen($texto) / $porLinea));

        $lineas = 0;

        // Encabezado institucional
        $lineas += $lineasDe($detalle->razonSocial, $caracteresPorLinea);
        $lineas += $detalle->ruc !== '' ? 1 : 0;
        $lineas += $lineasDe($detalle->direccionInstitucion, $caracteresPorLinea);
        $lineas += $detalle->telefonoInstitucion !== '' ? 1 : 0;

        $lineas += 3; // título + número del comprobante (fuente más grande)

        // Fechas
        $lineas += 3 + ($detalle->fechaVencimiento ? 1 : 0);

        // Cliente
        $lineas += $lineasDe($detalle->cliente, $caracteresValor);
        $lineas += 1; // DNI
        $lineas += $lineasDe($detalle->direccionCliente, $caracteresValor);
        $lineas += $lineasDe($detalle->aula, $caracteresValor);

        // Tabla de ítems
        $lineas += 1; // encabezado
        $lineas += $lineasDe($detalle->descripcion, $caracteresDescripcion);

        // Totales + monto en letras
        $lineas += 5;
        $lineas += $lineasDe('SON: '.$detalle->montoEnLetras, $caracteresPorLinea);

        // Información adicional
        $lineas += 1; // título
        $lineas += $detalle->cuota ? 1 : 0;
        $lineas += $detalle->origen ? 1 : 0;
        $lineas += 1 + count($detalle->partes); // método de pago (+ una línea por parte)
        $lineas += $detalle->numeroOperacion ? 1 : 0;
        $lineas += $detalle->observacion ? $lineasDe('Observación: '.$detalle->observacion, $caracteresPorLinea) : 0;
        $lineas += $lineasDe('Atendido por: '.$detalle->atendidoPor, $caracteresPorLinea);

        $lineas += 1; // "Gracias por su pago"

        $altoLogoMm = $angosto ? 22.0 : 28.0;
        $altoReglasMm = 5 * 3.5;  // 5 separadores (margen 1.5mm arriba/abajo + borde)
        $altoBloquesMm = 10.0;    // márgenes de tablas, "SON", info adicional y "Gracias"

        $altoContenidoMm = $altoLogoMm + $altoReglasMm + $altoBloquesMm + ($lineas * $altoLineaMm);

        return $altoContenidoMm + 8 + 12; // márgenes de página (4mm arriba/abajo) + margen de seguridad
    }

    /**
     * Crea el Recibo reintentando si choca con el índice único
     * (serie, numero_recibo) -- dos aprobaciones de pago casi simultáneas
     * pueden calcular el mismo "siguiente número" antes de que la primera
     * llegue a insertarlo. Mismo patrón que
     * CertificadoService::crearConNumeroUnico().
     */
    private function crearConNumeroUnico(Pago $pago, SerieReciboEnum $serie): Recibo
    {
        $intentosRestantes = 5;

        while (true) {
            try {
                /** @var Recibo $recibo */
                $recibo = Recibo::query()->create([
                    'pago_id' => $pago->id,
                    'serie' => $serie,
                    'numero_recibo' => $this->siguienteNumero($serie),
                    'emitido_en' => now(),
                ]);

                return $recibo;
            } catch (UniqueConstraintViolationException $e) {
                if (--$intentosRestantes <= 0) {
                    throw $e;
                }
            }
        }
    }

    /**
     * Correlativo continuo por serie (nunca se reinicia por año): si se
     * reiniciara cada año se repetiría el número y rompería el unique()
     * de (serie, numero_recibo).
     *
     * A partir del máximo ya emitido en esta serie, no de un conteo: un
     * conteo recalcula el mismo número ya tomado si alguna vez queda un
     * hueco en la secuencia, y crearConNumeroUnico() agotaría sus
     * reintentos contra la misma colisión una y otra vez sin poder avanzar.
     */
    private function siguienteNumero(SerieReciboEnum $serie): string
    {
        $ultimoNumero = Recibo::query()
            ->where('serie', $serie)
            ->get(['numero_recibo'])
            ->max(fn (Recibo $recibo) => (int) $recibo->numero_recibo);

        return sprintf('%06d', ($ultimoNumero ?? 0) + 1);
    }
}
