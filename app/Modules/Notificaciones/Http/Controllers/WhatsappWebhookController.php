<?php

declare(strict_types=1);

namespace App\Modules\Notificaciones\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Notificaciones\Enums\EstadoMensajeWhatsappEnum;
use App\Modules\Notificaciones\Enums\TipoMensajeWhatsappEnum;
use App\Modules\Notificaciones\Models\MensajeWhatsapp;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Webhook de la WhatsApp Cloud API. No lleva el middleware "web" (ver
 * Routes/webhook.php): es un endpoint sin sesión, llamado por Meta, no por
 * un navegador con cookies/CSRF.
 */
class WhatsappWebhookController extends Controller
{
    /**
     * Verificación inicial que Meta hace al configurar el webhook.
     */
    public function verificar(Request $request): Response
    {
        $modo = $request->query('hub_mode', $request->query('hub.mode'));
        $token = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));

        if ($modo === 'subscribe' && $token === config('services.whatsapp.verify_token') && $challenge) {
            return response((string) $challenge, 200);
        }

        return response('Token de verificación inválido.', 403);
    }

    /**
     * Recibe mensajes entrantes de usuarios y actualizaciones de estado
     * (enviado/entregado/leído) de mensajes salientes.
     */
    public function recibir(Request $request): Response
    {
        if (! $this->firmaValida($request)) {
            Log::warning('[WhatsApp:webhook] Firma inválida o ausente; payload descartado.');

            return response('Firma inválida.', 403);
        }

        $payload = $request->all();

        foreach ($payload['entry'] ?? [] as $entrada) {
            foreach ($entrada['changes'] ?? [] as $cambio) {
                $valor = $cambio['value'] ?? [];

                foreach ($valor['statuses'] ?? [] as $estadoEvento) {
                    $this->actualizarEstado($estadoEvento);
                }

                foreach ($valor['messages'] ?? [] as $mensajeEntrante) {
                    $this->registrarMensajeEntrante($mensajeEntrante);
                }
            }
        }

        return response('EVENT_RECEIVED', 200);
    }

    /**
     * Verifica la firma HMAC-SHA256 que Meta envía en la cabecera
     * X-Hub-Signature-256 (firmada con el app secret de la app de
     * WhatsApp), para que no cualquiera que encuentre esta URL pública
     * pueda forjar mensajes entrantes o cambiar el estado de uno
     * saliente. Si no hay app_secret configurado se rechaza todo (no
     * hay forma de verificar nada), salvo en el entorno local, para
     * pruebas sin credenciales reales -- a diferencia de "no producción",
     * esto no deja staging/demo desprotegidos solo por tener APP_ENV
     * distinto de "production".
     */
    private function firmaValida(Request $request): bool
    {
        $secreto = config('services.whatsapp.app_secret');

        if (! $secreto) {
            return app()->environment('local');
        }

        $cabecera = $request->header('X-Hub-Signature-256', '');

        if (! Str::startsWith($cabecera, 'sha256=')) {
            return false;
        }

        $firmaRecibida = Str::after($cabecera, 'sha256=');
        $firmaEsperada = hash_hmac('sha256', $request->getContent(), $secreto);

        return hash_equals($firmaEsperada, $firmaRecibida);
    }

    /**
     * @param  array{id?: string, status?: string}  $evento
     */
    private function actualizarEstado(array $evento): void
    {
        $externalId = $evento['id'] ?? null;
        $estadoWhatsapp = $evento['status'] ?? null;

        $estado = match ($estadoWhatsapp) {
            'delivered' => EstadoMensajeWhatsappEnum::ENTREGADO,
            'read' => EstadoMensajeWhatsappEnum::LEIDO,
            'failed' => EstadoMensajeWhatsappEnum::FALLIDO,
            default => null,
        };

        if (! $externalId || ! $estado) {
            return;
        }

        MensajeWhatsapp::query()
            ->where('external_id', $externalId)
            ->update(['estado' => $estado]);
    }

    /**
     * @param  array{from?: string, id?: string, text?: array{body?: string}}  $mensaje
     */
    private function registrarMensajeEntrante(array $mensaje): void
    {
        $telefono = $mensaje['from'] ?? null;

        if (! $telefono) {
            Log::warning('[WhatsApp:webhook] Mensaje entrante sin remitente.', $mensaje);

            return;
        }

        MensajeWhatsapp::query()->create([
            'telefono' => '+'.ltrim($telefono, '+'),
            'contenido' => $mensaje['text']['body'] ?? '(mensaje sin texto)',
            'tipo' => TipoMensajeWhatsappEnum::ENTRANTE,
            'estado' => EstadoMensajeWhatsappEnum::RECIBIDO,
            'external_id' => $mensaje['id'] ?? null,
            'enviado_en' => now(),
        ]);
    }
}
