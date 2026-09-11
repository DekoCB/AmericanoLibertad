<?php

declare(strict_types=1);

namespace App\Modules\Academico\Enums;

/**
 * Las 4 ventanas de admisión rotativas del año (Ciclo 1 a 4, cada una
 * ~2 meses después de la anterior): tanto mayores como menores entran por
 * cualquiera de ellas, la que caiga más cerca de su fecha real de
 * matrícula. La duración de estudio de cada estudiante ya no depende del
 * ciclo (antes 2 ciclos de mayores vs. 3 duraciones distintas de
 * menores) sino que se calcula por estudiante desde su propia fecha de
 * matrícula -- ver Matricula::fecha_fin_estudio.
 *
 * No confundir con el ciclo_curricular (I-VI) de Curso/Horario/Matricula:
 * este "Ciclo" es un periodo académico/de admisión (p. ej. "Ciclo 3
 * (Julio - Diciembre)"), no el nivel de una carrera. La UI usa "Ciclo
 * académico" en textos largos para distinguirlos cuando aparecen juntos.
 */
enum TipoCicloEnum: string
{
    case CICLO_1 = 'ciclo_1';
    case CICLO_2 = 'ciclo_2';
    case CICLO_3 = 'ciclo_3';
    case CICLO_4 = 'ciclo_4';

    public function label(): string
    {
        return match ($this) {
            self::CICLO_1 => 'Ciclo 1 (Enero - Junio)',
            self::CICLO_2 => 'Ciclo 2 (Mayo - Octubre)',
            self::CICLO_3 => 'Ciclo 3 (Julio - Diciembre)',
            self::CICLO_4 => 'Ciclo 4 (Noviembre - Abril)',
        };
    }

    public function numero(): int
    {
        return match ($this) {
            self::CICLO_1 => 1,
            self::CICLO_2 => 2,
            self::CICLO_3 => 3,
            self::CICLO_4 => 4,
        };
    }

    /**
     * Duración nominal de la ventana administrativa (todas duran 6 meses
     * calendario): solo se usa para validar que fecha_inicio/fecha_fin del
     * Ciclo cuadren entre sí, no la duración de estudio de un estudiante
     * en particular.
     */
    public function duracionEnMeses(): int
    {
        return 6;
    }

    /**
     * El mes calendario en que debe iniciar este ciclo (los 4 tienen uno
     * fijo, a diferencia del esquema anterior donde solo los ciclos de
     * mayores lo tenían).
     */
    public function mesInicioFijo(): int
    {
        return match ($this) {
            self::CICLO_1 => 1,
            self::CICLO_2 => 5,
            self::CICLO_3 => 7,
            self::CICLO_4 => 11,
        };
    }

    /**
     * A qué ciclo pasa un estudiante de este ciclo al culminar su grado:
     * avanza 2 posiciones dentro de las 4 ventanas rotativas (1→3, 2→4,
     * 3→1, 4→2), reflejando que un grado dura ~6 meses. Ver
     * avanzaAlSiguienteAnio() para saber si ese siguiente ciclo cae en el
     * año calendario siguiente.
     */
    public function siguiente(): self
    {
        return match ($this) {
            self::CICLO_1 => self::CICLO_3,
            self::CICLO_2 => self::CICLO_4,
            self::CICLO_3 => self::CICLO_1,
            self::CICLO_4 => self::CICLO_2,
        };
    }

    /**
     * True si siguiente() cae en el año calendario siguiente (Ciclo 3 y
     * Ciclo 4 cruzan a enero/mayo del año que viene; Ciclo 1 y Ciclo 2
     * siguen dentro del mismo año).
     */
    public function avanzaAlSiguienteAnio(): bool
    {
        return match ($this) {
            self::CICLO_1, self::CICLO_2 => false,
            self::CICLO_3, self::CICLO_4 => true,
        };
    }
}
