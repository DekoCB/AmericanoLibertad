@props(['iconOnly' => false])

<div {{ $attributes->merge(['class' => 'flex items-center gap-2 font-display text-ink']) }}>
    <img src="{{ asset('images/Logo.png') }}" alt="Americano Libertad" class="h-8 w-8 shrink-0 rounded-md object-contain">
    @unless($iconOnly)
        <span class="sidebar-label sidebar-label-brand text-sm leading-tight">Americano Libertad</span>
    @endunless
</div>
