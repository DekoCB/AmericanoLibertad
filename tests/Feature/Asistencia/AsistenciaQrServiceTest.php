<?php

namespace Tests\Feature\Asistencia;

use App\Modules\Academico\Models\Horario;
use App\Modules\Asistencia\Services\AsistenciaQrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AsistenciaQrServiceTest extends TestCase
{
    use RefreshDatabase;

    private function svgDecodificado(string $dataUrl): string
    {
        $base64 = substr($dataUrl, strlen('data:image/svg+xml;base64,'));

        return base64_decode($base64);
    }

    public function test_data_url_del_horario_devuelve_un_svg_valido_en_base64(): void
    {
        $horario = Horario::factory()->create();

        $dataUrl = app(AsistenciaQrService::class)->dataUrlDelHorario($horario);

        $this->assertStringStartsWith('data:image/svg+xml;base64,', $dataUrl);
        $this->assertStringContainsString('<svg', $this->svgDecodificado($dataUrl));
    }

    public function test_dos_horarios_distintos_generan_codigos_qr_distintos(): void
    {
        $horarioA = Horario::factory()->create();
        $horarioB = Horario::factory()->create();

        $service = app(AsistenciaQrService::class);

        $this->assertNotSame(
            $service->dataUrlDelHorario($horarioA),
            $service->dataUrlDelHorario($horarioB),
        );
    }

    public function test_data_url_del_instituto_es_estable_entre_llamadas(): void
    {
        $service = app(AsistenciaQrService::class);

        $this->assertSame($service->dataUrlDelInstituto(), $service->dataUrlDelInstituto());
    }
}
