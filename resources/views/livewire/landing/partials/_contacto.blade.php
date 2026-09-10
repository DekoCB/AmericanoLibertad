<section id="contacto" class="bg-[#0a0a0a] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <x-landing.section-title subtitle="Estamos para orientarte. Escríbenos y te respondemos a la brevedad.">
            Contáctanos
        </x-landing.section-title>

        <div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-5">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
                <div x-data x-reveal class="rounded-2xl border border-white/5 bg-[#1a1a1c] p-6">
                    <x-landing.icon-circle icon="chat-bubble-left-right" color="green" />
                    <h3 class="mt-4 font-sans text-base font-bold text-white">WhatsApp / Teléfono</h3>
                    <p class="mt-1 text-sm text-gray-400">{{ $whatsappNumeroVisible }}</p>
                    <x-landing.cta-button
                        :href="$whatsappHref('Hola, quiero información sobre el '.$nombreInstitucion.'.')"
                        target="_blank"
                        variant="whatsapp"
                        icon="chat-bubble-left-right"
                        class="mt-4 w-full"
                    >
                        Enviar Mensaje
                    </x-landing.cta-button>
                </div>

                <div x-data x-reveal class="rounded-2xl border border-white/5 bg-[#1a1a1c] p-6">
                    <x-landing.icon-circle icon="envelope" color="blue" />
                    <h3 class="mt-4 font-sans text-base font-bold text-white">Correo Electrónico</h3>
                    <a href="mailto:{{ $emailContacto }}" class="mt-1 block break-all text-sm text-gray-400 hover:text-white">
                        {{ $emailContacto }}
                    </a>
                </div>

                <div x-data x-reveal class="rounded-2xl border border-white/5 bg-[#1a1a1c] p-6">
                    <x-landing.icon-circle icon="map-pin" color="cyan" />
                    <h3 class="mt-4 font-sans text-base font-bold text-white">¿Dónde estamos?</h3>
                    <p class="mt-1 text-sm text-gray-400">{{ $direccion }}</p>
                </div>

                <div x-data x-reveal class="rounded-2xl border border-white/5 bg-[#1a1a1c] p-6">
                    <x-landing.icon-circle icon="clock" color="amber" />
                    <h3 class="mt-4 font-sans text-base font-bold text-white">Horario de Atención</h3>
                    <p class="mt-1 text-sm text-gray-400">{{ $horarioAtencion }}</p>
                </div>
            </div>

            <div x-data x-reveal class="flex flex-col justify-center rounded-2xl border border-white/5 bg-[#1a1a1c] p-6 sm:p-8 lg:col-span-3">
                <h3 class="font-sans text-lg font-bold text-white">Envíanos un Mensaje</h3>

                @if ($enviado)
                    <div class="mt-6 flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4">
                        <x-heroicon-o-check-circle class="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                        <div>
                            <p class="text-sm font-semibold text-emerald-400">¡Mensaje enviado!</p>
                            <p class="mt-1 text-sm text-gray-300">Gracias por escribirnos. Te contactaremos muy pronto por correo o WhatsApp.</p>
                        </div>
                    </div>
                @endif

                <form wire:submit="enviarMensaje" class="mt-6 space-y-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label for="nombre" class="text-xs font-semibold uppercase tracking-wide text-gray-400">Nombre Completo</label>
                            <input
                                type="text"
                                id="nombre"
                                wire:model="nombre"
                                class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Tu nombre y apellido"
                            >
                            @error('nombre') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                        </div>
                        <div>
                            <label for="correo" class="text-xs font-semibold uppercase tracking-wide text-gray-400">Correo Electrónico</label>
                            <input
                                type="email"
                                id="correo"
                                wire:model="correo"
                                class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="tu@correo.com"
                            >
                            @error('correo') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                        </div>
                    </div>

                    <div>
                        <label for="asunto" class="text-xs font-semibold uppercase tracking-wide text-gray-400">Carrera de interés</label>
                        <select
                            id="asunto"
                            wire:model="asunto"
                            class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Selecciona una opción</option>
                            @foreach ($carreras as $carrera)
                                <option value="{{ $carrera->name }}">{{ $carrera->name }}</option>
                            @endforeach
                            <option value="Aún no estoy seguro">Aún no estoy seguro</option>
                        </select>
                        @error('asunto') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label for="mensaje" class="text-xs font-semibold uppercase tracking-wide text-gray-400">Mensaje</label>
                        <textarea
                            id="mensaje"
                            wire:model="mensaje"
                            rows="4"
                            class="mt-1.5 block w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Cuéntanos en qué podemos ayudarte…"
                        ></textarea>
                        @error('mensaje') <p class="mt-1 text-xs text-red-400">{{ $message }}</p> @enderror
                    </div>

                    <button
                        type="submit"
                        wire:loading.attr="disabled"
                        wire:target="enviarMensaje"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                    >
                        <span wire:loading.remove wire:target="enviarMensaje">Enviar Mensaje</span>
                        <span wire:loading wire:target="enviarMensaje">Enviando…</span>
                    </button>
                </form>

                <div class="mt-8 overflow-hidden rounded-xl border border-white/10">
                    <iframe
                        title="Ubicación del {{ $nombreInstitucion }}"
                        src="https://www.google.com/maps?q=Sector+Tum%C3%A1n+14601&output=embed"
                        class="h-56 w-full"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
        </div>
    </div>
</section>
