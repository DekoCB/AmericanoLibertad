<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Academico\Database\Seeders\AcademicoDemoSeeder;
use App\Modules\Academico\Database\Seeders\CurriculaInstitutoSeeder;
use App\Modules\Admision\Database\Seeders\CarrerasSeeder;
use App\Modules\AulaVirtual\Database\Seeders\AulaVirtualDemoSeeder;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Database\Seeders\MatriculaDemoSeeder;
use App\Shared\Enums\EstadoUsuarioEnum;
use App\Shared\Enums\RolEnum;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Este seeder crea cuentas @ceba.test y datos ficticios (estudiantes,
        // pagos, evaluaciones...) pensados solo para desarrollo local. Correrlo
        // contra producción mezclaría eso con la base de datos real del
        // colegio -- ahí corresponde ProduccionSeeder en su lugar, que solo
        // siembra roles/permisos y la cuenta real de Gerencia.
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException(
                'DatabaseSeeder es solo para desarrollo local. En producción usa: php artisan db:seed --class=Database\\Seeders\\ProduccionSeeder'
            );
        }

        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(CarrerasSeeder::class);
        $this->call(CurriculaInstitutoSeeder::class);

        $gerencia = User::factory()->create([
            'name' => 'Gerencia Demo',
            'email' => 'gerencia@ceba.test',
            'dni' => '00000001',
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $docente = User::factory()->create([
            'name' => 'Docente Demo',
            'email' => 'docente@ceba.test',
            'dni' => '00000002',
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $docente->assignRole(RolEnum::DOCENTE->value);

        $estudiante = User::factory()->create([
            'name' => 'Estudiante Demo',
            'email' => 'estudiante@ceba.test',
            'dni' => '00000003',
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $estudiante->assignRole(RolEnum::ESTUDIANTE->value);

        $coordinador = User::factory()->create([
            'name' => 'Coordinador Demo',
            'email' => 'coordinador@ceba.test',
            'dni' => '00000004',
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $academico = User::factory()->create([
            'name' => 'Académico Demo',
            'email' => 'academico@ceba.test',
            'dni' => '00000005',
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $academico->assignRole(RolEnum::ACADEMICO->value);

        $administrativo = User::factory()->create([
            'name' => 'Administrativo Demo',
            'email' => 'administrativo@ceba.test',
            'dni' => '00000006',
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $administrativo->assignRole(RolEnum::ADMINISTRATIVO->value);

        // Usuario de prueba pedido por el cliente para entrar rápido con
        // permisos completos -- se recrea en cada `migrate:fresh --seed`
        // en vez de a mano, dado lo seguido que se corre durante esta
        // migración Grado->Carrera+Ciclo.
        $admin = User::factory()->create([
            'name' => 'Admin Prueba',
            'email' => 'admin@americanolibertad.test',
            'dni' => '00000099',
            'password' => bcrypt('admin123'),
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $admin->assignRole(RolEnum::GERENCIA->value);

        $this->call(AcademicoDemoSeeder::class);
        $this->call(MatriculaDemoSeeder::class);
        $this->call(AulaVirtualDemoSeeder::class);
        $this->call(DemoRobustoSeeder::class);
    }
}
