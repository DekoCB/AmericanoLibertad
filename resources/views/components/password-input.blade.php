@props(['disabled' => false])

{{--
    Envuelve x-text-input agregando el botón de ojito para mostrar/ocultar
    la contraseña -- el propio componente controla el atributo "type", así
    que quien lo use no debe pasarlo.
--}}
<div x-data="{ mostrar: false }" class="relative">
    <input
        @disabled($disabled)
        :type="mostrar ? 'text' : 'password'"
        {{ $attributes->merge(['class' => 'rounded-md border-border bg-surface text-ink shadow-sm focus:border-accent focus:ring-accent disabled:opacity-60 pr-10 w-full']) }}
    >
    <button
        type="button"
        x-on:click="mostrar = ! mostrar"
        x-bind:aria-label="mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        tabindex="-1"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-faint transition hover:text-ink"
    >
        <x-heroicon-o-eye-slash x-cloak x-show="mostrar" class="h-5 w-5" />
        <x-heroicon-o-eye x-cloak x-show="! mostrar" class="h-5 w-5" />
    </button>
</div>
