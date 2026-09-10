@php
    $carreraInfo = [
        'Enfermería' => ['icon' => 'heart', 'descripcion' => 'Formamos profesionales en el cuidado integral del paciente, con práctica clínica real desde los primeros ciclos.'],
        'Farmacia' => ['icon' => 'beaker', 'descripcion' => 'Aprende el manejo, dispensación y control de medicamentos en farmacias y establecimientos de salud.'],
        'Administración' => ['icon' => 'briefcase', 'descripcion' => 'Desarrolla habilidades en gestión, finanzas y liderazgo para dirigir equipos y negocios.'],
        'Contabilidad' => ['icon' => 'calculator', 'descripcion' => 'Domina los procesos contables, tributarios y financieros que exige toda organización pública o privada.'],
    ];

    $coloresDock = ['blue', 'cyan', 'green', 'amber', 'pink'];
@endphp

<section id="programas" class="bg-[#0a0a0a] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <x-landing.section-title subtitle="Formación técnica superior con base práctica, para carreras con alta demanda laboral.">
            Programas Educativos
        </x-landing.section-title>

        @if ($carreras->isEmpty())
            <div x-data x-reveal class="mx-auto max-w-2xl rounded-2xl border border-white/5 bg-[#1a1a1c] p-8 text-center text-sm text-gray-400">
                Muy pronto publicaremos aquí el detalle de nuestra oferta académica.
            </div>
        @else
            <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
                @foreach ($carreras as $carrera)
                    @php $info = $carreraInfo[$carrera->name] ?? null; @endphp
                    <div x-data x-reveal.{{ ($loop->index % 4) * 60 }}>
                        <x-landing.icon-card :icon="$info['icon'] ?? 'academic-cap'" color="blue" :title="$carrera->name">
                            {{ $info['descripcion'] ?? 'Programa técnico superior de la carrera de '.$carrera->name.'.' }}
                            <span class="mt-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">{{ $carrera->total_ciclos }} ciclos</span>
                        </x-landing.icon-card>
                    </div>
                @endforeach
            </div>
        @endif

        <div class="mx-auto mt-20 grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div x-data x-reveal>
                <h3 class="font-sans text-2xl font-extrabold text-white">Metodología de Enseñanza</h3>
                <p class="mt-3 text-sm text-gray-400">
                    Formamos con base práctica desde el primer ciclo, con talleres y laboratorios orientados a la
                    realidad del mercado laboral.
                </p>
                <div class="mt-6 space-y-3">
                    @foreach ([
                        'Aprende haciendo: talleres y prácticas desde el primer ciclo',
                        'Turnos mañana, tarde y noche para quienes estudian y trabajan',
                        'Docentes con experiencia práctica en cada área de formación',
                        'Seguimiento cercano del desempeño de cada estudiante',
                    ] as $punto)
                        <p class="flex items-start gap-2 text-sm text-gray-300">
                            <x-heroicon-o-check class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            {{ $punto }}
                        </p>
                    @endforeach
                </div>
            </div>

            <div x-data x-reveal class="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a1c] to-[#0f1b3d] p-8">
                <x-heroicon-o-puzzle-piece class="h-12 w-12 text-blue-500" />
                <p class="mt-4 font-sans text-xl font-bold text-white">Aprende haciendo, con la mirada puesta en tu primer empleo.</p>
                <p class="mt-3 text-sm text-gray-400">
                    Combinamos flexibilidad de horarios con acompañamiento constante, para que estudiar sea
                    compatible con tu trabajo y tu familia.
                </p>
            </div>
        </div>

        @if ($carreras->isNotEmpty())
            <div
                x-data="{
                    escalas: @js(array_fill(0, $carreras->count(), 1)),
                    actualizar(evento) {
                        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

                        const radio = 320;
                        const escalaMaxima = 0.2;
                        this.escalas = [...this.$el.querySelectorAll('[data-tarjeta-magnetica]')].map((el) => {
                            const caja = el.getBoundingClientRect();
                            const centro = caja.left + caja.width / 2;
                            const distancia = Math.abs(evento.clientX - centro);
                            const influencia = Math.max(0, 1 - distancia / radio);
                            return 1 + escalaMaxima * influencia;
                        });
                    },
                    reiniciar() {
                        this.escalas = this.escalas.map(() => 1);
                    },
                }"
                @mousemove="actualizar($event)"
                @mouseleave="reiniciar()"
                x-reveal
                class="mt-20"
            >
                <h3 class="text-center font-sans text-xl font-bold text-white">Nuestras Carreras</h3>
                <div class="mt-10 flex items-end justify-center gap-6 overflow-x-auto px-4 pb-4 pt-10">
                    @foreach ($carreras as $indice => $carrera)
                        @php $info = $carreraInfo[$carrera->name] ?? null; @endphp
                        <div
                            data-tarjeta-magnetica
                            :style="`transform: translateY(${(escalas[{{ $indice }}] - 1) * -46}px) scale(${escalas[{{ $indice }}]}); z-index: ${escalas[{{ $indice }}] > 1.02 ? 10 : 1};`"
                            class="flex h-40 w-40 shrink-0 origin-bottom flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-[#1a1a1c] p-5 text-center transition-transform duration-150 ease-out"
                        >
                            <x-landing.icon-circle :icon="$info['icon'] ?? 'academic-cap'" :color="$coloresDock[$indice % count($coloresDock)]" size="sm" />
                            <p class="text-xs font-semibold text-white">{{ $carrera->name }}</p>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    </div>
</section>
