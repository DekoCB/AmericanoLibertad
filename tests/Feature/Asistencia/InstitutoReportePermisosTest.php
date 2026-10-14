<?php

namespace Tests\Feature\Asistencia;

use App\Models\User;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstitutoReportePermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function usuarioConRol(RolEnum $rol): User
    {
        $usuario = User::factory()->create();
        $usuario->assignRole($rol->value);

        return $usuario;
    }

    public function test_administrativo_puede_ver_el_reporte_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::ADMINISTRATIVO))
            ->get(route('asistencia.instituto.reporte'))
            ->assertOk();
    }

    public function test_coordinador_puede_ver_el_reporte_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::COORDINADOR))
            ->get(route('asistencia.instituto.reporte'))
            ->assertOk();
    }

    public function test_gerencia_puede_ver_el_reporte_de_ingreso_al_instituto_via_comodin(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::GERENCIA))
            ->get(route('asistencia.instituto.reporte'))
            ->assertOk();
    }

    public function test_un_docente_no_puede_ver_el_reporte_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::DOCENTE))
            ->get(route('asistencia.instituto.reporte'))
            ->assertForbidden();
    }

    public function test_un_estudiante_no_puede_ver_el_reporte_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::ESTUDIANTE))
            ->get(route('asistencia.instituto.reporte'))
            ->assertForbidden();
    }

    public function test_administrativo_puede_ver_el_qr_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::ADMINISTRATIVO))
            ->get(route('asistencia.instituto.qr'))
            ->assertOk();
    }

    public function test_coordinador_puede_ver_el_qr_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::COORDINADOR))
            ->get(route('asistencia.instituto.qr'))
            ->assertOk();
    }

    public function test_un_docente_no_puede_ver_el_qr_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::DOCENTE))
            ->get(route('asistencia.instituto.qr'))
            ->assertForbidden();
    }

    public function test_un_estudiante_no_puede_ver_el_qr_de_ingreso_al_instituto(): void
    {
        $this->actingAs($this->usuarioConRol(RolEnum::ESTUDIANTE))
            ->get(route('asistencia.instituto.qr'))
            ->assertForbidden();
    }
}
