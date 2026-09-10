<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Academico\Database\Seeders\CurriculaInstitutoSeeder;
use App\Modules\Admision\Database\Seeders\CarrerasSeeder;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\EstadoUsuarioEnum;
use App\Shared\Enums\RolEnum;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeder para el primer despliegue en producción: solo los roles/permisos
 * base y las cuentas reales de Gerencia, sin nada de datos de ejemplo. A
 * diferencia de DatabaseSeeder (pensado para desarrollo local, mezcla lo
 * anterior con estudiantes/pagos/evaluaciones ficticios vía
 * DemoRobustoSeeder y compañía), este es el único seeder que corresponde
 * correr contra la base de datos real del instituto.
 *
 * CUENTAS_GERENCIA está vacío a propósito -- las cuentas reales de CEBA
 * (otro cliente) se quitaron de acá al adaptar este proyecto para
 * Americano Libertad. Completar con los datos reales antes del primer
 * despliegue.
 *
 * Uso (una sola vez, tras el primer `migrate --force` en Hostinger; correrlo
 * de nuevo más adelante es seguro -- cada cuenta ya creada se salta sin
 * duplicarse ni pisar su contraseña):
 *   php artisan db:seed --class=Database\\Seeders\\ProduccionSeeder --force
 *
 * Cada contraseña se genera al azar y se imprime una sola vez en la consola
 * -- no queda guardada en ningún lado más que en el hash de la BD. Cámbiala
 * apenas inicies sesión, o usa "¿Olvidó su contraseña?" en vez de la
 * impresa si el correo saliente ya está configurado.
 */
class ProduccionSeeder extends Seeder
{
    /**
     * @var list<array{name: string, email: string, dni: string}>
     */
    private const CUENTAS_GERENCIA = [
        // ['name' => '...', 'email' => '...', 'dni' => '...'],
    ];

    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(CarrerasSeeder::class);
        $this->call(CurriculaInstitutoSeeder::class);

        foreach (self::CUENTAS_GERENCIA as $cuenta) {
            $this->crearCuentaGerencia($cuenta['name'], $cuenta['email'], $cuenta['dni']);
        }
    }

    private function crearCuentaGerencia(string $name, string $email, string $dni): void
    {
        if (User::query()->where('email', $email)->exists()) {
            $this->command->warn("La cuenta de Gerencia {$email} ya existe -- no se vuelve a crear.");

            return;
        }

        $contrasenaTemporal = Str::password(24);

        $gerencia = User::query()->create([
            'name' => $name,
            'email' => $email,
            'dni' => $dni,
            'password' => Hash::make($contrasenaTemporal),
            'email_verified_at' => now(),
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $this->command->info("Cuenta de Gerencia creada: {$email}");
        $this->command->warn("Contraseña temporal (cámbiala al iniciar sesión): {$contrasenaTemporal}");
    }
}
