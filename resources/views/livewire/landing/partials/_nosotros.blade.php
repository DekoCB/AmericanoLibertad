@php
    $valores = [
        ['icon' => 'check-badge', 'color' => 'blue', 'title' => 'Responsabilidad', 'texto' => 'Cumplimos lo que prometemos, con puntualidad y compromiso en cada tarea.'],
        ['icon' => 'shield-check', 'color' => 'cyan', 'title' => 'Honestidad', 'texto' => 'Actuamos con transparencia y verdad en cada decisión académica y administrativa.'],
        ['icon' => 'scale', 'color' => 'green', 'title' => 'Respeto', 'texto' => 'Valoramos la diversidad y tratamos a cada persona con dignidad.'],
        ['icon' => 'heart', 'color' => 'amber', 'title' => 'Compromiso', 'texto' => 'Nos entregamos por completo a la formación de nuestros estudiantes.'],
        ['icon' => 'light-bulb', 'color' => 'pink', 'title' => 'Innovación', 'texto' => 'Buscamos nuevas formas de enseñar y de resolver los retos del sector salud y empresarial.'],
        ['icon' => 'user-group', 'color' => 'blue', 'title' => 'Trabajo en equipo', 'texto' => 'Logramos más juntos: docentes, estudiantes y personal avanzando en una misma dirección.'],
        ['icon' => 'flag', 'color' => 'cyan', 'title' => 'Liderazgo', 'texto' => 'Formamos personas capaces de guiar equipos y tomar decisiones con seguridad.'],
        ['icon' => 'star', 'color' => 'green', 'title' => 'Excelencia', 'texto' => 'Perseguimos la calidad en cada curso, cada práctica y cada resultado.'],
    ];
@endphp

<section id="nosotros" class="bg-[#0a0a0a] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <x-landing.section-title subtitle="Formamos profesionales técnicos competentes, éticos e innovadores, comprometidos con el desarrollo de la sociedad.">
            Sobre Nosotros
        </x-landing.section-title>

        <div class="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            <div x-data x-reveal class="rounded-2xl border border-white/5 bg-[#1a1a1c] p-8">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                    <x-heroicon-o-flag class="h-6 w-6" />
                </div>
                <h3 class="mt-4 font-sans text-lg font-bold text-white">Nuestra Misión</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-400">
                    Brindar educación superior tecnológica de calidad, formando profesionales competentes, éticos e
                    innovadores, comprometidos con el desarrollo de la sociedad mediante una enseñanza práctica y
                    orientada al mercado laboral.
                </p>
            </div>
            <div x-data x-reveal class="rounded-2xl border border-white/5 bg-[#1a1a1c] p-8">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <x-heroicon-o-sparkles class="h-6 w-6" />
                </div>
                <h3 class="mt-4 font-sans text-lg font-bold text-white">Nuestra Visión</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-400">
                    Ser un instituto reconocido a nivel regional y nacional por la excelencia académica, la
                    innovación educativa y la formación integral de profesionales altamente competitivos.
                </p>
            </div>
        </div>

        <div class="mt-16">
            <h3 class="text-center font-sans text-xl font-bold text-white">Nuestros Valores</h3>
            <div class="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
                @foreach ($valores as $valor)
                    <div x-data x-reveal.{{ ($loop->index % 4) * 60 }}>
                        <x-landing.icon-card :icon="$valor['icon']" :color="$valor['color']" :title="$valor['title']" compact>
                            {{ $valor['texto'] }}
                        </x-landing.icon-card>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</section>
