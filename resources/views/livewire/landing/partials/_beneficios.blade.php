<section class="bg-[#0a0a0a] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <x-landing.section-title subtitle="Más práctica, más oportunidades: esto es lo que te ofrecemos.">
            Propuesta de Valor
        </x-landing.section-title>

        @php
            $beneficios = [
                ['icon' => 'academic-cap', 'color' => 'blue', 'label' => 'Carreras con alta demanda'],
                ['icon' => 'briefcase', 'color' => 'cyan', 'label' => 'Docentes especializados'],
                ['icon' => 'computer-desktop', 'color' => 'green', 'label' => 'Formación práctica'],
                ['icon' => 'clock', 'color' => 'amber', 'label' => 'Horarios flexibles'],
                ['icon' => 'banknotes', 'color' => 'pink', 'label' => 'Costos accesibles'],
                ['icon' => 'shield-check', 'color' => 'blue', 'label' => 'Convenios para prácticas'],
                ['icon' => 'user-group', 'color' => 'cyan', 'label' => 'Acompañamiento académico'],
            ];
        @endphp

        {{--
            Carrusel "magnético" estilo dock de macOS: las tarjetas cercanas
            al cursor se agrandan y se elevan, con una caída suave según la
            distancia. Se desactiva si el usuario prefiere menos movimiento.
        --}}
        <div
            x-data="{
                escalas: @js(array_fill(0, count($beneficios), 1)),
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
        >
            <div class="flex items-end justify-center gap-6 overflow-x-auto px-4 pb-4 pt-10">
                @foreach ($beneficios as $indice => $beneficio)
                    <div
                        data-tarjeta-magnetica
                        :style="`transform: translateY(${(escalas[{{ $indice }}] - 1) * -46}px) scale(${escalas[{{ $indice }}]}); z-index: ${escalas[{{ $indice }}] > 1.02 ? 10 : 1};`"
                        class="flex h-40 w-44 shrink-0 origin-bottom flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-[#1a1a1c] p-5 text-center transition-transform duration-150 ease-out"
                    >
                        <x-landing.icon-circle :icon="$beneficio['icon']" :color="$beneficio['color']" />
                        <p class="text-xs font-semibold leading-snug text-white">{{ $beneficio['label'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</section>
