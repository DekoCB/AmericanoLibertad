<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Services;

use App\Modules\Pagos\Enums\SerieReciboEnum;
use App\Modules\Pagos\Models\Pago;
use App\Modules\Pagos\Models\Recibo;
use Barryvdh\DomPDF\Facade\Pdf;

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
        $numeroRecibo = $this->siguienteNumero($serie);

        /** @var Recibo $recibo */
        $recibo = Recibo::query()->create([
            'pago_id' => $pago->id,
            'serie' => $serie,
            'numero_recibo' => $numeroRecibo,
            'emitido_en' => now(),
        ]);

        $pdf = Pdf::loadView('pdf.recibo', ['pago' => $pago, 'recibo' => $recibo, 'serie' => $serie]);

        $recibo->addMediaFromString($pdf->output())
            ->usingFileName("{$serie->value}-{$numeroRecibo}.pdf")
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
        $altoMm = $this->alturaTicketMm($pago, $anchoMm);

        $pdf = Pdf::loadView('pdf.recibo-ticket', [
            'pago' => $pago,
            'recibo' => $recibo,
            'serie' => $recibo->serie,
            'anchoMm' => $anchoMm,
            'altoMm' => $altoMm,
        ]);

        return $pdf->output();
    }

    /**
     * Estima cuántos milímetros de alto necesita el ticket, contando líneas
     * de texto por sección (las fijas de la plantilla + las que se ajustan
     * según el ancho para el nombre del alumno, el concepto y la
     * observación, que son los únicos campos de largo variable).
     */
    public function alturaTicketMm(Pago $pago, int $anchoMm): float
    {
        // Generoso a propósito: una primera versión más ajustada subestimó
        // el alto real (los márgenes/padding de cada ".seccion" y cada
        // "hr" pesan más de lo que parece a simple vista) y el contenido
        // se desbordó a una segunda página -- mucho peor para imprimir en
        // una ticketera que dejar de más un poco de espacio en blanco.
        $altoLineaMm = $anchoMm <= 58 ? 3.6 : 4.0;
        $anchoUtilMm = $anchoMm - 6; // 3mm de margen a cada lado
        $caracteresPorLinea = max(10, (int) floor($anchoUtilMm / ($anchoMm <= 58 ? 1.15 : 1.25)));

        $lineasDeTexto = fn (string $texto): int => max(1, (int) ceil(mb_strlen($texto) / $caracteresPorLinea));

        $lineas = 0;
        $secciones = 0; // cada <div class="seccion"> suma su propio margen arriba/abajo

        $lineas += 2; // nombre del instituto + subtítulo
        $lineas += 2; // título del recibo + N.°
        $lineas += 3; // fecha emisión, fecha de pago, DNI
        $lineas += $lineasDeTexto($pago->estudiante?->nombreCompleto() ?? '—');

        $secciones++; // "Concepto" siempre está
        $lineas += 1; // título "Concepto"
        $lineas += $lineasDeTexto($pago->concepto->nombre.($pago->detalle ? ' — '.$pago->detalle : ''));

        if ($pago->partes->count() > 1) {
            $secciones++;
            $lineas += 1 + $pago->partes->count(); // título "Partes del pago" + una línea por parte
        }

        $lineas += 1; // total
        $lineas += 3; // cuota, ciclo, medio de pago

        if ($pago->observacion) {
            $secciones++;
            $lineas += 1; // título "Observación"
            $lineas += $lineasDeTexto($pago->observacion);
        }

        $lineas += 2; // pie (serie/N.° + emitido el)

        $altoLogoMm = $anchoMm <= 58 ? 28.0 : 38.0;
        $altoReglasMm = 3 * 4.5; // 3 separadores punteados (margen 2mm arriba/abajo + borde)
        $altoSeccionesMm = $secciones * 5.0; // margen + borde del título de cada ".seccion"

        $altoContenidoMm = $altoLogoMm + $altoReglasMm + $altoSeccionesMm + ($lineas * $altoLineaMm);

        return $altoContenidoMm + 8 + 20; // márgenes de página (4mm arriba/abajo) + margen de seguridad
    }

    /**
     * Correlativo continuo por serie (nunca se reinicia por año): si se
     * reiniciara cada año se repetiría el número y rompería el unique()
     * de (serie, numero_recibo).
     */
    private function siguienteNumero(SerieReciboEnum $serie): string
    {
        return sprintf('%06d', Recibo::query()->where('serie', $serie)->count() + 1);
    }
}
