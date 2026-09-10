@props(['icon', 'color' => 'blue', 'size' => 'md'])

@php
    $tonos = [
        'blue' => 'bg-blue-500/10 text-blue-400',
        'cyan' => 'bg-cyan-500/10 text-cyan-400',
        'green' => 'bg-emerald-500/10 text-emerald-400',
        'amber' => 'bg-amber-500/10 text-amber-400',
        'pink' => 'bg-fuchsia-500/10 text-fuchsia-400',
    ];
    $tono = $tonos[$color] ?? $tonos['blue'];
    $tamano = $size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
    $tamanoIcono = $size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
@endphp

<div {{ $attributes->merge(['class' => "flex shrink-0 items-center justify-center rounded-full {$tamano} {$tono}"]) }}>
    <x-dynamic-component :component="'heroicon-o-'.$icon" @class([$tamanoIcono]) />
</div>
