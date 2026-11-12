<?php

declare(strict_types=1);

namespace App\Shared\ValueObjects;

use InvalidArgumentException;
use Stringable;

/**
 * Documento de identidad (DNI peruano de 8 dígitos, o carné de extranjería
 * alfanumérico de hasta 12 caracteres). Se valida una única vez al construirse.
 */
final readonly class Dni implements Stringable
{
    private string $valor;

    public function __construct(string $valor)
    {
        $normalizado = strtoupper(trim($valor));

        if ($normalizado === '') {
            throw new InvalidArgumentException('El documento de identidad no puede estar vacío.');
        }

        if (! preg_match('/^[0-9A-Z]{8,12}$/', $normalizado)) {
            throw new InvalidArgumentException(
                "El documento de identidad «{$valor}» no es válido: debe tener entre 8 y 12 caracteres alfanuméricos."
            );
        }

        $this->valor = $normalizado;
    }

    public function esDniPeruano(): bool
    {
        return preg_match('/^[0-9]{8}$/', $this->valor) === 1;
    }

    public function equals(self $otro): bool
    {
        return $this->valor === $otro->valor;
    }

    public function valor(): string
    {
        return $this->valor;
    }

    /**
     * Correo institucional autoasignado: siempre {dni}@iesamericalibertad.com,
     * en vez de requerir que se ingrese uno manualmente al crear un usuario
     * o matricular un estudiante.
     */
    public function correoInstitucional(): string
    {
        return strtolower($this->valor).'@iesamericalibertad.com';
    }

    /**
     * Contraseña inicial autoasignada al crear o restablecer una cuenta:
     * el DNI en minúsculas, igual que correoInstitucional() -- así el
     * usuario y la contraseña se escriben con la misma letra, en vez de
     * que la contraseña real quede en MAYÚSCULAS (como normaliza valor())
     * mientras el estudiante intuitivamente escribe lo mismo que ve en su
     * usuario. Solo importa para un DNI alfanumérico (carné de
     * extranjería, código provisional); un DNI peruano de 8 dígitos no
     * tiene mayúsculas que normalizar.
     */
    public function contrasenaInicial(): string
    {
        return strtolower($this->valor);
    }

    public function __toString(): string
    {
        return $this->valor;
    }
}
