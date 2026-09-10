<?php

declare(strict_types=1);

namespace App\Modules\Academico\Database\Seeders;

use App\Models\Carrera;
use App\Modules\Academico\Models\Curso;
use Illuminate\Database\Seeder;

/**
 * Currícula real del instituto (documento "Currículas completas del
 * instituto", elaborado a partir del Excel oficial de la institución,
 * según D.S. Nº 004-2010-ED y R.D. Nº 0411-2010-ED), transcrita curso por
 * curso: módulo, ciclo (I-VI), horas semanales y créditos. Cada fila fue
 * verificada contra el resumen por ciclo del propio documento (cantidad de
 * cursos, horas/semana y créditos totales de cada ciclo coinciden
 * exactamente); los subtotales "por módulo"/"por ciclo" que traía el Excel
 * NO se guardan acá porque el documento los arrastra con errores de celdas
 * combinadas -- se recalculan siempre sumando estos cursos.
 */
class CurriculaInstitutoSeeder extends Seeder
{
    /**
     * @var array<string, array<int, array{modulo: string, cursos: list<array{ciclo: int, nombre: string, horas: int, creditos: float}>}>>
     */
    private const CURRICULAS = [
        'ENF' => [
            1 => ['modulo' => 'Atención primaria en Salud', 'cursos' => [
                ['ciclo' => 1, 'nombre' => 'Anatomía Funcional', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Primeros Auxilios', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Asistencia en Inmunizaciones', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Actividades en Epidemiología', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Técnicas de comunicación', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Lógica y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Cultura física y Deporte', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Informática e internet', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Educación para la Salud', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Actividades en Salud Pública', 'horas' => 9, 'creditos' => 7],
                ['ciclo' => 2, 'nombre' => 'Actividades en Salud Comunitaria', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Estadística y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Cultura Artística', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Ofimática', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Fundamentos de investigación', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 3, 'nombre' => 'Nutrición y Dietas', 'horas' => 5, 'creditos' => 4],
            ]],
            2 => ['modulo' => 'Servicios técnicos de Enfermería Asistencial', 'cursos' => [
                ['ciclo' => 3, 'nombre' => 'Documentación en Salud', 'horas' => 2, 'creditos' => 1],
                ['ciclo' => 3, 'nombre' => 'Bioseguridad', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Asistencia básica Hospitalaria', 'horas' => 10, 'creditos' => 8],
                ['ciclo' => 3, 'nombre' => 'Procedimientos invasivos y no invasivos', 'horas' => 4, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Sociedad y economía en la globalización', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Medio Ambiente y Desarrollo Sostenible', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Investigación e innovación tecnológica', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Asistencia en la administración de medicamentos', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Muestras Biológicas', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 4, 'nombre' => 'Asistencia al usuario con Patologías', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 4, 'nombre' => 'Asistencia al usuario quirúrgico', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 4, 'nombre' => 'Asistencia al usuario quirúrgico', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Proyectos de Investigación e Innovación Tecnológica', 'horas' => 4, 'creditos' => 3],
            ]],
            3 => ['modulo' => 'Servicios técnicos de Enfermería Especializada', 'cursos' => [
                ['ciclo' => 5, 'nombre' => 'Atención en Salud Materna', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Salud del niño y adolescente', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 5, 'nombre' => 'Asistencia al adulto mayor', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 5, 'nombre' => 'Asistencia de Enfermería en Salud Mental', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Comunicación Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Comportamiento Ético', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Organización y Constitución de Empresas', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Asistencia en fisioterapia y rehabilitaciones', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 6, 'nombre' => 'Asistencia en Salud Bucal', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 6, 'nombre' => 'Asistencia en Medicina Alternativa', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 6, 'nombre' => 'Asistencia al usuario Oncológico', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 6, 'nombre' => 'Liderazgo y trabajo en equipo', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Proyecto Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Legislación e Inserción Laboral', 'horas' => 3, 'creditos' => 2],
            ]],
        ],

        'FAR' => [
            1 => ['modulo' => 'Atención de Urgencias y Administración de una Oficina Farmacéutica', 'cursos' => [
                ['ciclo' => 1, 'nombre' => 'Análisis de Procesos Biológicos y Químicos en el Ser Humano', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Estudio Estructural y Funcional del ser Humano', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 1, 'nombre' => 'Técnicas de Administración de Medicamentos', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Atención de Medicamentos Esenciales', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 1, 'nombre' => 'Técnicas de comunicación', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Lógica y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Cultura física y Deporte', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Informática e internet', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Análisis Microbiano en la Industria Farmacéutica', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 2, 'nombre' => 'Atención de Urgencias en una Oficina Farmacéutica', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Administración Farmacéutica', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Documentos Contables en una Oficina Farmacéutica', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 2, 'nombre' => 'Lineamientos de Políticas Nacionales de Salud y Medicamentos', 'horas' => 3, 'creditos' => 3],
                ['ciclo' => 2, 'nombre' => 'Interpretación y producción de textos', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Estadística y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Cultura Artística', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Ofimática', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Fundamentos de investigación', 'horas' => 2, 'creditos' => 1.5],
            ]],
            2 => ['modulo' => 'Dispensación de Medicamentos y Atención en Farmacia', 'cursos' => [
                ['ciclo' => 3, 'nombre' => 'Estudio de Enfermedades y su Tratamiento Farmacológico I', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Aplicación de Bases Farmacológicas de los Medicamentos I', 'horas' => 8, 'creditos' => 6],
                ['ciclo' => 3, 'nombre' => 'Venta y Dispensación de Medicamentos y Productos Afines', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Dispensación de Medicamentos en el Sistema de Salud', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 3, 'nombre' => 'Sociedad y economía en la globalización', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Medio Ambiente y Desarrollo Sostenible', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Investigación e innovación tecnológica', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Estudio de Enfermedades y su Tratamiento Farmacológico II', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Aplicación de Bases Farmacológicas de los Medicamentos II', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Clasificación de Medicamentos', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Promoción y Prevención de Salud en Farmacia', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 4, 'nombre' => 'Técnicas de Transformación de Recursos Naturales', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Comunicación interpersonal', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Proyectos de Investigación e Innovación Tecnológica', 'horas' => 4, 'creditos' => 3],
            ]],
            3 => ['modulo' => 'Elaboración y Comercialización de Productos Farmacéuticos y Afines', 'cursos' => [
                ['ciclo' => 5, 'nombre' => 'Métodos de Extracción e Identificación', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Venta y Dispensación de Productos Naturales', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 5, 'nombre' => 'Técnicas de Control de Calidad en la Industria Farmacéutica', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 5, 'nombre' => 'Técnicas de Transformación de Materias Primas en la Industria Farmacéutica', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 5, 'nombre' => 'Aspectos Legales en la Industria Farmacéutica', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 5, 'nombre' => 'Comunicación Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Comportamiento Ético', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Organización y Constitución de Empresas', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Clasificación de Acción Farmacológica', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 6, 'nombre' => 'Normas de Control de Calidad en la Industria Farmacéutica', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 6, 'nombre' => 'Elaboración de Formas Farmacéuticas', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 6, 'nombre' => 'Procesamiento de Productos Galénicos, Naturales, Cosméticos y Afines', 'horas' => 8, 'creditos' => 6],
                ['ciclo' => 6, 'nombre' => 'Liderazgo y trabajo en equipo', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Proyecto Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Legislación e Inserción Laboral', 'horas' => 3, 'creditos' => 2],
            ]],
        ],

        'CON' => [
            1 => ['modulo' => 'Procesos Contables', 'cursos' => [
                ['ciclo' => 1, 'nombre' => 'Contabilidad General I', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Plan Contable', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 1, 'nombre' => 'Documentación Comercial y Contable', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Administración Empresarial', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 1, 'nombre' => 'Legislación Comercial', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 1, 'nombre' => 'Técnicas de comunicación', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Lógica y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Cultura física y Deporte', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Informática e internet', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Contabilidad General II', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 2, 'nombre' => 'Legislación Laboral', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 2, 'nombre' => 'Legislación Tributaria', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 2, 'nombre' => 'Fundamentos de Costos', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Interpretación y producción de textos', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Estadística y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Cultura Artística', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Ofimática', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Fundamentos de investigación', 'horas' => 2, 'creditos' => 1.5],
            ]],
            2 => ['modulo' => 'Contabilidad Pública y Privada', 'cursos' => [
                ['ciclo' => 3, 'nombre' => 'Contabilidad de Costos', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Técnica Presupuestal', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Contabilidad Gubernamental I', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Aplicativos Informáticos', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Sociedad y economía en la globalización', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Medio Ambiente y Desarrollo Sostenible', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Investigación e innovación tecnológica', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Contabilidad de Sociedades', 'horas' => 8, 'creditos' => 6],
                ['ciclo' => 4, 'nombre' => 'Contabilidad Aplicada', 'horas' => 8, 'creditos' => 6],
                ['ciclo' => 4, 'nombre' => 'Contabilidad Gubernamental II', 'horas' => 8, 'creditos' => 6],
                ['ciclo' => 4, 'nombre' => 'Comunicación interpersonal', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Proyectos de Investigación e Innovación Tecnológica', 'horas' => 4, 'creditos' => 3],
            ]],
            3 => ['modulo' => 'Análisis Financiero', 'cursos' => [
                ['ciclo' => 5, 'nombre' => 'Formulación de Estados Financieros', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Fundamentos de Finanzas', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 5, 'nombre' => 'Formulación y Evaluación de Proyectos', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Planeamiento de la Auditoría', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 5, 'nombre' => 'Contabilidad de Entidades Financieras I', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Comunicación Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Comportamiento Ético', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Organización y Constitución de Empresas', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Análisis e Interpretación de Estados Financieros', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 6, 'nombre' => 'Finanzas Públicas', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 6, 'nombre' => 'Técnicas y Procedimientos de Auditoría', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 6, 'nombre' => 'Contabilidad de Entidades Financieras II', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 6, 'nombre' => 'Cálculo Financiero', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 6, 'nombre' => 'Liderazgo y trabajo en equipo', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Proyecto Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Legislación e Inserción Laboral', 'horas' => 3, 'creditos' => 2],
            ]],
        ],

        'ADM' => [
            1 => ['modulo' => 'Gestión Administrativa', 'cursos' => [
                ['ciclo' => 1, 'nombre' => 'Planificación y Organización', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 1, 'nombre' => 'Producción', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Gestión de Recursos Humanos', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 1, 'nombre' => 'Administración Logística', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 1, 'nombre' => 'Técnicas de comunicación', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Lógica y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Cultura física y Deporte', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 1, 'nombre' => 'Informática e internet', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Dirección y Control Empresarial', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Sistemas de Compensación, Previsional y Asistencial', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Gestión de Almacenes', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Administración Pública', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 2, 'nombre' => 'Interpretación y producción de textos', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Estadística y Funciones', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Cultura Artística', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Ofimática', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 2, 'nombre' => 'Fundamentos de investigación', 'horas' => 2, 'creditos' => 1.5],
            ]],
            2 => ['modulo' => 'Gestión de la Comercialización', 'cursos' => [
                ['ciclo' => 3, 'nombre' => 'Estadística Empresarial', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Gestión del Marketing Empresarial', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 3, 'nombre' => 'Comunicación Comercial y Atención al Cliente', 'horas' => 10, 'creditos' => 8],
                ['ciclo' => 3, 'nombre' => 'Inglés Comercial', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 3, 'nombre' => 'Sociedad y economía en la globalización', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Medio Ambiente y Desarrollo Sostenible', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 3, 'nombre' => 'Investigación e innovación tecnológica', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Investigación de Mercado', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Comercio Internacional', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 4, 'nombre' => 'Sistemas de Ventas y Comercio Electrónico', 'horas' => 9, 'creditos' => 6],
                ['ciclo' => 4, 'nombre' => 'Marketing en las Empresas de Servicios', 'horas' => 4, 'creditos' => 3],
                ['ciclo' => 4, 'nombre' => 'Comunicación interpersonal', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 4, 'nombre' => 'Proyectos de Investigación e Innovación Tecnológica', 'horas' => 4, 'creditos' => 3],
            ]],
            3 => ['modulo' => 'Recursos Financieros y Proyectos', 'cursos' => [
                ['ciclo' => 5, 'nombre' => 'Operaciones Contables', 'horas' => 6, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Legislación Comercial y Tributaria', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 5, 'nombre' => 'Análisis de Costos', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Gestión Presupuestaria', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Formulación de Proyectos de Inversión', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 5, 'nombre' => 'Comunicación Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Comportamiento Ético', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 5, 'nombre' => 'Organización y Constitución de Empresas', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Gestión de Tesorería', 'horas' => 5, 'creditos' => 4],
                ['ciclo' => 6, 'nombre' => 'Gestión Financiera', 'horas' => 8, 'creditos' => 6],
                ['ciclo' => 6, 'nombre' => 'Evaluación de Proyectos de Inversión', 'horas' => 7, 'creditos' => 5],
                ['ciclo' => 6, 'nombre' => 'Auditoría', 'horas' => 3, 'creditos' => 2],
                ['ciclo' => 6, 'nombre' => 'Liderazgo y trabajo en equipo', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Proyecto Empresarial', 'horas' => 2, 'creditos' => 1.5],
                ['ciclo' => 6, 'nombre' => 'Legislación e Inserción Laboral', 'horas' => 3, 'creditos' => 2],
            ]],
        ],
    ];

    private const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

    public function run(): void
    {
        foreach (self::CURRICULAS as $carreraCode => $modulos) {
            $carrera = Carrera::query()->where('code', $carreraCode)->first();

            if (! $carrera) {
                $this->command?->warn("Carrera con código {$carreraCode} no existe -- corre CarrerasSeeder antes. Se omite su currícula.");

                continue;
            }

            $secuenciaPorCiclo = [];

            foreach ($modulos as $moduloNumero => $modulo) {
                foreach ($modulo['cursos'] as $curso) {
                    $ciclo = $curso['ciclo'];
                    $secuenciaPorCiclo[$ciclo] = ($secuenciaPorCiclo[$ciclo] ?? 0) + 1;
                    $codigo = sprintf('%s-%s-%02d', $carreraCode, self::ROMANOS[$ciclo], $secuenciaPorCiclo[$ciclo]);

                    Curso::query()->updateOrCreate(
                        ['codigo' => $codigo],
                        [
                            'nombre' => $curso['nombre'],
                            'carrera_id' => $carrera->id,
                            'modulo_numero' => $moduloNumero,
                            'modulo_nombre' => $modulo['modulo'],
                            'ciclo_curricular' => $ciclo,
                            'horas' => $curso['horas'],
                            'creditos' => $curso['creditos'],
                            'grado_id' => null,
                            'activo' => true,
                        ]
                    );
                }
            }
        }
    }
}
