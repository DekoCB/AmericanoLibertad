<?php

declare(strict_types=1);

namespace App\Modules\Asistencia\Services;

use App\Modules\Academico\Models\Horario;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

/**
 * Genera los QR fijos de asistencia (por horario o del instituto) como data
 * URL SVG inline -- mismo criterio que
 * TwoFactorAuthenticationService::qrCodeDataUrl(), pero con
 * bacon/bacon-qr-code directo: aquí no hay un secreto TOTP de por medio,
 * solo un string corto y estable, así que no hace falta pasar por google2fa
 * (específico de TOTP). Se fuerza SvgImageBackEnd en vez de dejar que se
 * autodetecte Imagick, para no depender de una extensión de PHP para un QR
 * estático.
 */
class AsistenciaQrService
{
    private const TAMANO_PX = 280;

    public function dataUrlDelHorario(Horario $horario): string
    {
        return $this->dataUrl('AULA:'.$horario->id);
    }

    public function dataUrlDelInstituto(): string
    {
        return $this->dataUrl(AsistenciaInstitutoService::CODIGO_QR);
    }

    private function dataUrl(string $contenido): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(self::TAMANO_PX),
            new SvgImageBackEnd,
        );

        $svg = (new Writer($renderer))->writeString($contenido);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
