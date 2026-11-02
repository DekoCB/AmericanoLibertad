<?php

declare(strict_types=1);

namespace App\Modules\Identidad\Services;

use App\Models\User;
use App\Modules\Identidad\DTOs\ActualizarUsuarioData;
use App\Modules\Identidad\DTOs\CrearUsuarioData;
use App\Modules\Identidad\Repositories\Contracts\UserRepositoryInterface;
use App\Shared\Enums\EstadoUsuarioEnum;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserManagementService
{
    public function __construct(
        private readonly UserRepositoryInterface $usuarios,
        private readonly SessionControlService $sesiones,
    ) {}

    public function listar(?string $termino, ?string $rol, int $perPage = 15): LengthAwarePaginator
    {
        return $this->usuarios->buscar($termino, $rol, $perPage);
    }

    public function crear(CrearUsuarioData $data): User
    {
        return DB::transaction(function () use ($data) {
            /** @var User $usuario */
            $usuario = $this->usuarios->create([
                'name' => $data->name,
                'email' => $data->email,
                'dni' => $data->dni->valor(),
                'phone' => $data->phone?->numero(),
                'password' => Hash::make($data->password),
                'estado' => EstadoUsuarioEnum::ACTIVO,
                'email_verified_at' => now(),
            ]);

            $usuario->assignRole($data->rol->value);

            return $usuario;
        });
    }

    public function actualizar(User $usuario, ActualizarUsuarioData $data): User
    {
        return DB::transaction(function () use ($usuario, $data) {
            $usuario = $this->usuarios->update($usuario, [
                'name' => $data->name,
                'email' => $data->email,
                'dni' => $data->dni->valor(),
                'phone' => $data->phone?->numero(),
                'estado' => $data->estado,
            ]);

            // Si la cuenta deja de estar activa, se le corta el acceso ya
            // mismo en vez de esperar a que su sesión expire sola -- ver
            // también VerificarCuentaActiva, que cierra la petición ya en
            // vuelo de esa misma sesión en cuanto llegue la próxima.
            if ($data->estado !== EstadoUsuarioEnum::ACTIVO) {
                $this->sesiones->revocarTodas($usuario);
            }

            return $usuario;
        });
    }

    public function cambiarRol(User $usuario, string $rol): void
    {
        $usuario->syncRoles([$rol]);
    }

    /**
     * Restablece la contraseña de una cuenta a su propio DNI -- la misma
     * convención que la contraseña inicial que ya se asigna al registrar
     * (ver MatriculaService::registrarEstudiante(), DocenteService), para
     * no introducir una segunda forma de generar contraseñas. Cierra todas
     * las sesiones activas de la cuenta: quien tenía la sesión abierta con
     * la contraseña anterior queda fuera y debe volver a entrar con la
     * nueva. El cambio queda registrado en Historial de Contraseñas como
     * cualquier otro (ver Auditable en el modelo User).
     */
    public function restablecerContrasenaAlDni(User $usuario): void
    {
        $usuario->update(['password' => Hash::make($usuario->dni)]);

        $this->sesiones->revocarTodas($usuario);
    }

    public function emailDisponible(string $email, ?int $exceptoId = null): bool
    {
        return ! $this->usuarios->existeEmail($email, $exceptoId);
    }

    public function dniDisponible(string $dni, ?int $exceptoId = null): bool
    {
        return ! $this->usuarios->existeDni($dni, $exceptoId);
    }
}
