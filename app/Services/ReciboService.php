<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Recibo;
use App\Support\NumeroALetras;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReciboService
{
    public function emitir(Pago $pago): Recibo
    {
        $pago->loadMissing(['cuota.matricula.student', 'cuota.matricula.carrera', 'registradoPor', 'medios']);

        $numeroRecibo = $this->siguienteNumero();

        $pdf = Pdf::loadView('comprobantes.pago-matricula', [
            'pago' => $pago,
            'cuota' => $pago->cuota,
            'matricula' => $pago->cuota->matricula,
            'student' => $pago->cuota->matricula->student,
            'numeroBoleta' => $numeroRecibo,
            'montoEnLetras' => NumeroALetras::convertir((float) $pago->monto),
            'paraPdf' => true,
            'logoSrc' => public_path('images/Logo.png'),
        ]);

        $pdfPath = 'recibos/'.$numeroRecibo.'.pdf';
        Storage::disk('local')->put($pdfPath, $pdf->output());

        return Recibo::create([
            'pago_id' => $pago->id,
            'numero_recibo' => $numeroRecibo,
            'pdf_path' => $pdfPath,
            'emitido_en' => now(),
        ]);
    }

    private function siguienteNumero(): string
    {
        $anio = now()->format('Y');
        $emitidosEsteAnio = Recibo::where('numero_recibo', 'like', "B001-{$anio}-%")->count();

        return sprintf('B001-%s-%06d', $anio, $emitidosEsteAnio + 1);
    }
}
