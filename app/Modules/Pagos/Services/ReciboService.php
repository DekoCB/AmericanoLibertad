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
     */
    public function renderizarTicket(Recibo $recibo, int $anchoMm): string
    {
        $pdf = Pdf::loadView('pdf.recibo-ticket', [
            'pago' => $recibo->pago,
            'recibo' => $recibo,
            'serie' => $recibo->serie,
            'anchoMm' => $anchoMm,
        ]);

        return $pdf->output();
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
