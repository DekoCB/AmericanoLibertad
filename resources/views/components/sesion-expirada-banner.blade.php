{{--
    Aviso único para toda la app (ver resources/js/app.js, store
    'sesionExpirada'): cuando una petición de Livewire falla por sesión
    vencida o sin conexión, sin esto el usuario solo ve que "nada responde"
    al hacer clic en cualquier selector o botón, sin ninguna pista de por
    qué. Se monta una sola vez en el layout, igual que x-confirm-dialog.
--}}
<div
    x-data
    x-show="$store.sesionExpirada.open"
    x-cloak
    class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4"
    x-transition:enter="ease-out duration-200"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
>
    <div class="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
        <p class="font-display text-base text-ink">Tu sesión se interrumpió</p>
        <p class="mt-2 text-sm text-ink-dim">Puede ser que haya pasado mucho rato sin actividad, o que se haya cortado la conexión. Recarga la página para seguir — lo que ya hayas guardado no se pierde.</p>

        <div class="mt-5 flex justify-end">
            <button
                type="button"
                onclick="location.reload()"
                class="inline-flex items-center rounded-md bg-accent px-4 py-2 font-display text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >Recargar página</button>
        </div>
    </div>
</div>
