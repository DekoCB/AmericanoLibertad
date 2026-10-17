<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Pagos\Models\Recibo;
use App\Modules\Pagos\Services\ReciboService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/**
 * Genera el PDF del recibo en formato ticket (80mm/58mm) al vuelo, en cada
 * request -- a diferencia del PDF A4, que se genera una sola vez en
 * ReciboService::emitir() y queda guardado en Media Library. Así funciona
 * retroactivamente para cualquier recibo ya emitido, sin necesitar
 * regenerar nada.
 */
class ReciboTicketController extends Controller
{
    public function __invoke(Recibo $recibo, string $ancho, ReciboService $reciboService): Response
    {
        Gate::authorize('view', $recibo->pago);

        $pdf = $reciboService->renderizarTicket($recibo, (int) $ancho);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="ticket-'.$recibo->serie->value.'-'.$recibo->numero_recibo.'-'.$ancho.'mm.pdf"',
        ]);
    }
}
