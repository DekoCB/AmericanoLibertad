<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if ($status === 419) {
                return back()->with('error', 'Tu sesión expiró. Vuelve a intentarlo.');
            }

            $renderAsInertia = in_array($status, [403, 404, 429], true)
                || ($status >= 500 && ! app()->hasDebugModeEnabled());

            if ($renderAsInertia) {
                return Inertia::render('Error', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
