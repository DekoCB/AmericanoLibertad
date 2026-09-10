@php
    $coloresDock = ['blue', 'cyan', 'green', 'amber', 'pink'];
@endphp

<section id="docentes" class="bg-[#0a0a0a] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <x-landing.section-title subtitle="Un equipo formado para acompañar, no solo para enseñar.">
            Nuestros Docentes
        </x-landing.section-title>

        @if ($docentes->isEmpty())
            <div x-data x-reveal class="mx-auto flex max-w-4xl flex-col items-start gap-6 rounded-3xl border border-white/5 bg-[#1a1a1c] p-8 text-center sm:flex-row sm:p-10">
                <x-landing.icon-circle icon="user-group" color="blue" />
                <p class="text-sm leading-relaxed text-gray-300">
                    Nuestro equipo docente está conformado por profesionales titulados, comprometidos con la
                    formación técnica de nuestros estudiantes. Muy pronto presentaremos aquí a cada uno de ellos.
                </p>
            </div>
        @else
            <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($docentes as $docente)
                    <div x-data x-reveal.{{ ($loop->index % 3) * 60 }}>
                        <x-landing.icon-card icon="user" :color="$coloresDock[$loop->index % count($coloresDock)]" :title="$docente->usuario->name">
                            @if (filled($docente->especialidad))
                                {{ $docente->especialidad }}
                            @else
                                Docente del instituto
                            @endif
                        </x-landing.icon-card>
                    </div>
                @endforeach
            </div>
        @endif
    </div>
</section>
