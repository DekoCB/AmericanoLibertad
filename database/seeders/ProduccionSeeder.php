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
 * base y las cuentas reales de Gerencia/Administrativo, sin nada de datos
 * de ejemplo. A diferencia de DatabaseSeeder (pensado para desarrollo
 * local, mezcla lo anterior con estudiantes/pagos/evaluaciones ficticios
 * vía DemoRobustoSeeder y compañía), este es el único seeder que
 * corresponde correr contra la base de datos real del instituto.
 *
 * Uso (una sola vez, tras el primer `migrate --force` en Hostinger; correrlo
 * de nuevo más adelante es seguro -- cada cuenta ya creada se salta sin
 * duplicarse ni pisar su contraseña):
 *   php artisan db:seed --class=Database\\Seeders\\ProduccionSeeder --force
 *
 * Si una cuenta no trae 'password', se genera una al azar y se imprime una
 * sola vez en la consola -- no queda guardada en ningún lado más que en el
 * hash de la BD. Si trae una fija (como la cuenta admin de abajo), cámbiala
 * apenas inicies sesión: quedó en texto plano en este archivo del repo.
 */
class ProduccionSeeder extends Seeder
{
    /**
     * @var list<array{name: string, email: string, dni: ?string, password?: string, roles?: list<string>}>
     */
    private const CUENTAS_GERENCIA = [
        ['name' => 'Admin', 'email' => 'admin@gmail.com', 'dni' => '71586559', 'password' => 'admin123', 'roles' => [RolEnum::ADMINISTRATIVO->value, RolEnum::GERENCIA->value]],
        ['name' => 'Donald James Yovera', 'email' => 'donaldyovera@gmail.com', 'dni' => null, 'password' => 'AmericaLib123', 'roles' => [RolEnum::GERENCIA->value]],
    ];

    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(CarrerasSeeder::class);
        $this->call(CurriculaInstitutoSeeder::class);

        foreach (self::cuentasGerencia() as $cuenta) {
            $this->crearCuentaGerencia(
                $cuenta['name'],
                $cuenta['email'],
                $cuenta['dni'],
                $cuenta['password'] ?? null,
                $cuenta['roles'] ?? [RolEnum::GERENCIA->value],
            );
        }
    }

    /**
     * Envoltorio que ensancha el tipo de CUENTAS_GERENCIA: con una sola
     * cuenta declarada, PHPStan infiere 'password'/'roles' como siempre
     * presentes y marca el `??` de run() como redundante. El @return de
     * este método fija el tipo real (claves opcionales) para el resto de
     * cuentas que se agreguen sin esos campos.
     *
     * @return list<array{name: string, email: string, dni: ?string, password?: string, roles?: list<string>}>
     */
    private static function cuentasGerencia(): array
    {
        return self::CUENTAS_GERENCIA;
    }

    /**
     * @param  list<string>  $roles
     */
    private function crearCuentaGerencia(string $name, string $email, ?string $dni, ?string $password, array $roles): void
    {
        if (User::query()->where('email', $email)->exists()) {
            $this->command->warn("La cuenta {$email} ya existe -- no se vuelve a crear.");

            return;
        }

        $esTemporal = $password === null;
        $contrasena = $password ?? Str::password(24);

        $usuario = User::query()->create([
            'name' => $name,
            'email' => $email,
            'dni' => $dni,
            'password' => Hash::make($contrasena),
            'email_verified_at' => now(),
            'estado' => EstadoUsuarioEnum::ACTIVO,
        ]);
        $usuario->assignRole($roles);

        $this->command->info("Cuenta creada: {$email} (roles: ".implode(', ', $roles).')');

        if ($esTemporal) {
            $this->command->warn("Contraseña temporal (cámbiala al iniciar sesión): {$contrasena}");
        } else {
            $this->command->warn('Contraseña fija tomada del seeder -- cámbiala apenas inicies sesión.');
        }
    }
}
