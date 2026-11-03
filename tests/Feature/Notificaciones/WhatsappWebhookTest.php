<?php

namespace Tests\Feature\Notificaciones;

use App\Modules\Notificaciones\Enums\EstadoMensajeWhatsappEnum;
use App\Modules\Notificaciones\Enums\TipoMensajeWhatsappEnum;
use App\Modules\Notificaciones\Models\MensajeWhatsapp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WhatsappWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const APP_SECRET = 'secreto-de-prueba';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.whatsapp.verify_token' => 'token-de-prueba',
            'services.whatsapp.app_secret' => self::APP_SECRET,
        ]);
    }

    /**
     * Firma el payload igual que Meta lo haría (HMAC-SHA256 del cuerpo con
     * el app secret, en la cabecera X-Hub-Signature-256) -- ver
     * WhatsappWebhookController::firmaValida(). postJson() vuelve a
     * codificar el mismo array con json_encode($data, 0), igual que aquí,
     * así que el contenido firmado coincide con el que realmente se envía.
     */
    private function postWebhookFirmado(array $payload)
    {
        $contenido = json_encode($payload);
        $firma = hash_hmac('sha256', $contenido, self::APP_SECRET);

        return $this->postJson('/webhooks/whatsapp', $payload, [
            'X-Hub-Signature-256' => "sha256={$firma}",
        ]);
    }

    public function test_la_verificacion_responde_el_challenge_con_el_token_correcto(): void
    {
        $this->get('/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token-de-prueba&hub.challenge=12345')
            ->assertOk()
            ->assertSee('12345');
    }

    public function test_la_verificacion_rechaza_un_token_incorrecto(): void
    {
        $this->get('/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token-equivocado&hub.challenge=12345')
            ->assertForbidden();
    }

    public function test_una_actualizacion_de_estado_marca_el_mensaje_como_entregado(): void
    {
        $mensaje = MensajeWhatsapp::factory()->create([
            'external_id' => 'wamid.ABC123',
            'estado' => EstadoMensajeWhatsappEnum::ENVIADO,
        ]);

        $payload = [
            'entry' => [[
                'changes' => [[
                    'value' => [
                        'statuses' => [[
                            'id' => 'wamid.ABC123',
                            'status' => 'delivered',
                        ]],
                    ],
                ]],
            ]],
        ];

        $this->postWebhookFirmado($payload)->assertOk();

        $this->assertSame(EstadoMensajeWhatsappEnum::ENTREGADO, $mensaje->refresh()->estado);
    }

    public function test_un_mensaje_entrante_se_registra_como_recibido(): void
    {
        $payload = [
            'entry' => [[
                'changes' => [[
                    'value' => [
                        'messages' => [[
                            'from' => '51987654321',
                            'id' => 'wamid.XYZ789',
                            'text' => ['body' => 'Hola, tengo una consulta'],
                        ]],
                    ],
                ]],
            ]],
        ];

        $this->postWebhookFirmado($payload)->assertOk();

        $this->assertDatabaseHas('mensajes_whatsapp', [
            'telefono' => '+51987654321',
            'contenido' => 'Hola, tengo una consulta',
            'tipo' => TipoMensajeWhatsappEnum::ENTRANTE->value,
            'estado' => EstadoMensajeWhatsappEnum::RECIBIDO->value,
        ]);
    }

    public function test_un_payload_sin_firma_valida_se_rechaza_con_403(): void
    {
        $payload = [
            'entry' => [[
                'changes' => [[
                    'value' => [
                        'messages' => [[
                            'from' => '51987654321',
                            'id' => 'wamid.XYZ789',
                            'text' => ['body' => 'Mensaje forjado'],
                        ]],
                    ],
                ]],
            ]],
        ];

        $this->postJson('/webhooks/whatsapp', $payload)->assertForbidden();

        $this->assertDatabaseMissing('mensajes_whatsapp', ['contenido' => 'Mensaje forjado']);
    }
}
