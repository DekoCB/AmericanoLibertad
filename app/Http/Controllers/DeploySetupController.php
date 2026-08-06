<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ruta de instalación para hosting compartido sin acceso a SSH (p.ej. Hostinger).
 *
 * Permite correr una sola vez, desde el navegador, los comandos que
 * normalmente se ejecutarían por terminal al desplegar: generar el enlace
 * de storage y (opcionalmente) correr las migraciones pendientes.
 *
 * Uso:
 *  1. En el .env del servidor, define DEPLOY_SETUP_TOKEN con un valor largo
 *     y aleatorio (nunca lo subas al repositorio).
 *  2. Visita /deploy-setup/{ese-token} una vez.
 *  3. Borra DEPLOY_SETUP_TOKEN del .env (o déjalo vacío) para desactivar
 *     la ruta de nuevo; sin el token configurado, esta ruta responde 404.
 */
class DeploySetupController extends Controller
{
    public function run(Request $request, string $token): Response
    {
        $expected = config('app.deploy_setup_token');

        if (! $expected || ! hash_equals((string) $expected, $token)) {
            abort(404);
        }

        $pasos = [];

        Artisan::call('migrate', ['--force' => true]);
        $pasos['migrate'] = trim(Artisan::output());

        Artisan::call('storage:link');
        $pasos['storage:link'] = trim(Artisan::output());

        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('view:clear');

        $resumen = "Listo. Recuerda quitar DEPLOY_SETUP_TOKEN del .env ahora que terminaste.\n\n";
        foreach ($pasos as $comando => $salida) {
            $resumen .= "== {$comando} ==\n{$salida}\n\n";
        }

        return response($resumen, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
