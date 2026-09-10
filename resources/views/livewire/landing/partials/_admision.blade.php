@php
    $pasos = [
        ['icon' => 'pencil-square', 'color' => 'blue', 'titulo' => 'Completa el formulario', 'descripcion' => 'Llena tus datos personales, los de tu apoderado y adjunta tus documentos en un solo formulario en línea.', 'x' => 0, 'y' => -190],
        ['icon' => 'paper-airplane', 'color' => 'cyan', 'titulo' => 'Enviamos tu solicitud', 'descripcion' => 'Tu solicitud queda registrada y pasa a revisión por Secretaría.', 'x' => 181, 'y' => -59],
        ['icon' => 'document-magnifying-glass', 'color' => 'amber', 'titulo' => 'Revisión de documentos', 'descripcion' => 'Verificamos tus datos y los documentos presentados.', 'x' => 111, 'y' => 154],
        ['icon' => 'chat-bubble-left-right', 'color' => 'green', 'titulo' => 'Confirmación', 'descripcion' => 'Te contactamos para confirmar tu admisión y coordinar tu matrícula.', 'x' => -111, 'y' => 154],
        ['icon' => 'academic-cap', 'color' => 'pink', 'titulo' => 'Matrícula e inicio de clases', 'descripcion' => 'Formalizas tu matrícula y comienzas tus clases.', 'x' => -181, 'y' => -59],
    ];

    $coloresActivo = [
        'blue' => 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30',
        'cyan' => 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/30',
        'amber' => 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30',
        'green' => 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30',
        'pink' => 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30',
    ];
@endphp

<section id="admision" class="bg-[#0a0a0a] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <x-landing.section-title subtitle="¡Es muy fácil! Completa tu solicitud en línea y te acompañamos en todo el proceso.">
            Proceso de Admisión
        </x-landing.section-title>

        <div class="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            <div x-data x-reveal class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 transition duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl hover:shadow-black/30">
                <x-landing.icon-circle icon="document-check" color="amber" />
                <h3 class="mt-4 font-sans text-lg font-bold text-white">Requisitos de Matrícula</h3>
                <div class="mt-4 space-y-2.5">
                    @foreach ([
                        'DNI original y copia',
                        'Certificado de estudios de secundaria completa',
                        'Partida de nacimiento',
                        '1 foto tamaño carnet',
                    ] as $requisito)
                        <p class="flex items-start gap-2 text-sm text-gray-300">
                            <x-heroicon-o-check class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            {{ $requisito }}
                        </p>
                    @endforeach
                </div>
            </div>

            <div x-data x-reveal class="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-black/30">
                <x-landing.icon-circle icon="banknotes" color="blue" />
                <h3 class="mt-4 font-sans text-lg font-bold text-white">Costos de Admisión</h3>
                <div class="mt-4 space-y-2.5">
                    @foreach ([
                        'Matrículas abiertas todo el año',
                        'Matrícula: S/ 50 (primer ciclo) o S/ 150 (siguientes ciclos)',
                        'Pensión mensual desde S/ 150',
                        'Modalidad presencial, turnos mañana, tarde y noche',
                    ] as $costo)
                        <p class="flex items-start gap-2 text-sm text-gray-300">
                            <x-heroicon-o-check class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            {{ $costo }}
                        </p>
                    @endforeach
                </div>
            </div>
        </div>

        <div class="mt-20">
            <h3 class="text-center font-sans text-xl font-bold text-white">Proceso de Inscripción</h3>

            {{-- Menos de lg: la misma lista de pasos que antes, en columnas. --}}
            <div class="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:hidden">
                @foreach ($pasos as $indice => $paso)
                    <div x-data x-reveal>
                        <x-landing.step-number :number="$indice + 1" :icon="$paso['icon']" :color="$paso['color']" :title="$paso['titulo']">
                            {{ $paso['descripcion'] }}
                        </x-landing.step-number>
                    </div>
                @endforeach
            </div>

            {{--
                Desde lg: rueda circular -- el círculo central muestra el paso
                activo, y los otros 4 quedan como píldoras alrededor. En móvil
                sigue la lista de arriba.
            --}}
            <div x-data x-reveal class="hidden lg:block">
                <div
                    x-data="{
                        activo: 0,
                        temporizador: null,
                        ir(indice) {
                            this.activo = indice;
                            this.reiniciarAutoplay();
                        },
                        siguiente() { this.activo = (this.activo + 1) % 5 },
                        anterior() { this.activo = (this.activo + 4) % 5 },
                        avanzarYReiniciar() { this.siguiente(); this.reiniciarAutoplay(); },
                        retrocederYReiniciar() { this.anterior(); this.reiniciarAutoplay(); },
                        iniciarAutoplay() {
                            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                            this.temporizador = setInterval(() => this.siguiente(), 5000);
                        },
                        reiniciarAutoplay() {
                            clearInterval(this.temporizador);
                            this.iniciarAutoplay();
                        },
                    }"
                    x-init="iniciarAutoplay()"
                    @mouseenter="clearInterval(temporizador)"
                    @mouseleave="iniciarAutoplay()"
                    class="relative mx-auto mt-10 h-[480px] max-w-2xl"
                >
                    <div class="pointer-events-none absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10"></div>

                    <div class="pointer-events-none absolute left-1/2 top-[8px] h-0 w-0 -translate-x-1/2 border-x-8 border-t-[12px] border-x-transparent border-t-white/60"></div>

                    <button
                        type="button"
                        @click="retrocederYReiniciar()"
                        class="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-[#1a1a1c] p-2 text-gray-400 transition hover:scale-110 hover:border-white/20 hover:text-white active:scale-95"
                        aria-label="Paso anterior"
                    >
                        <x-heroicon-o-chevron-left class="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        @click="avanzarYReiniciar()"
                        class="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-[#1a1a1c] p-2 text-gray-400 transition hover:scale-110 hover:border-white/20 hover:text-white active:scale-95"
                        aria-label="Paso siguiente"
                    >
                        <x-heroicon-o-chevron-right class="h-5 w-5" />
                    </button>

                    <div
                        class="absolute inset-0 transition-transform duration-700 ease-out"
                        :style="`transform: rotate(${activo * -72}deg)`"
                    >
                        @foreach ($pasos as $indice => $paso)
                            <button
                                type="button"
                                @click="ir({{ $indice }})"
                                :class="activo === {{ $indice }} ? '{{ $coloresActivo[$paso['color']] }} scale-105' : 'border-white/10 bg-[#1a1a1c] text-gray-300 hover:[--tw-translate-y:calc(-50%-4px)] hover:border-white/20 hover:text-white'"
                                :style="{ '--tw-rotate': (activo * 72) + 'deg' }"
                                class="absolute left-1/2 top-1/2 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-4 py-2.5 text-center text-xs font-semibold leading-tight transition duration-700 ease-out"
                                style="margin-left: {{ $paso['x'] }}px; margin-top: {{ $paso['y'] }}px;"
                            >
                                {{ $indice + 1 }}. {{ $paso['titulo'] }}
                            </button>
                        @endforeach
                    </div>

                    <div class="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#121214] shadow-2xl shadow-black/50">
                        @foreach ($pasos as $indice => $paso)
                            <div
                                x-show="activo === {{ $indice }}"
                                x-cloak
                                x-transition:enter="transition ease-out duration-300"
                                x-transition:enter-start="opacity-0 scale-90"
                                x-transition:enter-end="opacity-100 scale-100"
                                x-transition:leave="transition ease-in duration-150"
                                x-transition:leave-start="opacity-100 scale-100"
                                x-transition:leave-end="opacity-0 scale-90"
                                class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                            >
                                <x-landing.icon-circle :icon="$paso['icon']" :color="$paso['color']" size="sm" />
                                <p class="mt-3 font-sans text-sm font-bold text-white">{{ $indice + 1 }}. {{ $paso['titulo'] }}</p>
                                <p class="mt-1.5 text-xs leading-relaxed text-gray-400">{{ $paso['descripcion'] }}</p>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>

        {{--
            Fondo "pixel drift": motas de luz que derivan lentamente hacia
            arriba sobre el banner, como polvo ambiental. Se dibuja en canvas
            por rendimiento, y no arranca si el usuario prefiere menos
            movimiento.
        --}}
        <div
            x-data="{
                iniciarParticulas() {
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

                    const canvas = this.$refs.lienzo;
                    const ctx = canvas.getContext('2d');
                    const contenedor = this.$el;
                    const dpr = window.devicePixelRatio || 1;
                    let particulas = [];

                    const crearParticulas = (ancho, alto) => {
                        const cantidad = Math.round((ancho * alto) / 9000);
                        particulas = Array.from({ length: cantidad }, () => ({
                            x: Math.random() * ancho,
                            y: Math.random() * alto,
                            tamano: 1.5 + Math.random() * 2.5,
                            velocidadX: (Math.random() - 0.5) * 0.15,
                            velocidadY: -0.1 - Math.random() * 0.25,
                            opacidadBase: 0.25 + Math.random() * 0.5,
                            fase: Math.random() * Math.PI * 2,
                        }));
                    };

                    const dimensionar = () => {
                        const caja = contenedor.getBoundingClientRect();
                        canvas.width = caja.width * dpr;
                        canvas.height = caja.height * dpr;
                        canvas.style.width = `${caja.width}px`;
                        canvas.style.height = `${caja.height}px`;
                        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                        crearParticulas(caja.width, caja.height);
                    };

                    const dibujar = () => {
                        const caja = contenedor.getBoundingClientRect();
                        ctx.clearRect(0, 0, caja.width, caja.height);

                        for (const p of particulas) {
                            p.x += p.velocidadX;
                            p.y += p.velocidadY;
                            p.fase += 0.02;

                            if (p.y < -4) p.y = caja.height + 4;
                            if (p.x < -4) p.x = caja.width + 4;
                            if (p.x > caja.width + 4) p.x = -4;

                            const opacidad = p.opacidadBase * (0.6 + 0.4 * Math.sin(p.fase));
                            ctx.fillStyle = `rgba(255, 255, 255, ${opacidad})`;
                            ctx.fillRect(p.x, p.y, p.tamano, p.tamano);
                        }

                        requestAnimationFrame(dibujar);
                    };

                    dimensionar();
                    window.addEventListener('resize', dimensionar);
                    dibujar();
                },
            }"
            x-init="iniciarParticulas()"
            x-reveal
            class="relative mt-20 overflow-hidden rounded-3xl bg-blue-600"
        >
            <canvas x-ref="lienzo" class="pointer-events-none absolute inset-0"></canvas>

            <div class="relative z-[1] flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
                <h3 class="font-sans text-3xl font-extrabold text-white">¡Inicia tu admisión hoy!</h3>
                <p class="max-w-xl text-blue-100">
                    Matrícula desde S/ 50 y pensión mensual desde S/ 150. Completa el formulario y asegura tu vacante.
                </p>
                <x-landing.cta-button :href="route('admision.create')" navigate variant="dark" icon="pencil-square">
                    Solicitar Admisión
                </x-landing.cta-button>
            </div>
        </div>
    </div>
</section>
