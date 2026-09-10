<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Modules\Identidad\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * Habilidades transversales que no pertenecen a un modelo concreto
 * (a diferencia de las Policies de módulo). Ver sección 02 del documento
 * de arquitectura: "Gate = habilidades transversales".
 */
class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        Gate::define('access-gerencia-panel', fn (User $user) => $user->hasRole('gerencia'));

        Gate::define('access-tesoreria-panel', fn (User $user) => $user->hasAnyRole(['administrativo', 'gerencia']));

        Gate::define('manage-roles', fn (User $user) => $user->hasPermissionTo('roles.gestionar'));

        Gate::define('bypass-debt-block', fn (User $user) => $user->hasAnyRole(['gerencia', 'administrativo']));
    }
}
