import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

interface Faq {
    pregunta: string;
    respuesta: string;
    when?: boolean;
}

const ESTUDIANTE_INTRO =
    'Guía rápida para revisar tus secciones, marcar tu asistencia y entregar tus trabajos.';

const ESTUDIANTE_FAQS: Faq[] = [
    {
        pregunta: '¿Dónde veo mis secciones, horario y notas?',
        respuesta:
            'En el Dashboard verás tus secciones activas, tu promedio general y tus notas más recientes. Tu horario completo está en Horarios.',
    },
    {
        pregunta: '¿Cómo registro mi asistencia?',
        respuesta:
            'Ve a Asistencias y usa el campo de escaneo con tu DNI o tu código QR al llegar a clase.',
    },
    {
        pregunta: '¿Cómo entrego una tarea o resuelvo un quiz?',
        respuesta:
            'Entra a Aula virtual, elige tu sección y busca la evaluación en la semana correspondiente: ahí podrás subir tu archivo o resolver el cuestionario.',
    },
    {
        pregunta: '¿Dónde encuentro los materiales de mis secciones?',
        respuesta:
            'En Aula virtual, dentro de cada sección, encontrarás los anuncios, enlaces y archivos que publique tu docente.',
    },
];

const DOCENTE_INTRO =
    'Guía rápida para gestionar tus secciones: asistencia, notas, aula virtual y tus horas dictadas.';

const DOCENTE_FAQS: Faq[] = [
    {
        pregunta: '¿Cómo tomo asistencia a mis secciones?',
        respuesta:
            'Ve a Asistencias, elige la sección y registra a cada estudiante con su DNI/QR o márcalo manualmente.',
    },
    {
        pregunta: '¿Cómo registro las notas de una evaluación?',
        respuesta:
            'Entra a la sección, abre la evaluación y usa "Registrar notas". Si es un quiz, se califica automáticamente al resolverlo el estudiante.',
    },
    {
        pregunta: '¿Cómo publico recursos o evaluaciones en el aula virtual?',
        respuesta:
            'Desde Aula virtual → tu sección, agrega un recurso (enlace, archivo o anuncio) o crea una evaluación indicando la semana en la que debe aparecer.',
    },
    {
        pregunta: '¿Cómo registro mis horas dictadas y veo mi pago?',
        respuesta:
            'En Registro de horas anota tus horas por sección; cuando se genere tu pago, podrás descargar el comprobante desde la misma lista.',
    },
    {
        pregunta: '¿Cómo solicito un permiso o licencia?',
        respuesta:
            'Ve a Permisos y crea una solicitud indicando el tipo, las fechas y el motivo. Quedará pendiente de aprobación.',
    },
];

const STAFF_INTRO =
    'Guía rápida para las secciones administrativas y académicas que tienes disponibles.';

function buildStaffFaqs(nav: PageProps['auth']['nav']): Faq[] {
    return [
        {
            pregunta: '¿Cómo registro una matrícula nueva?',
            respuesta:
                'Ve a Matrículas → Nueva matrícula, selecciona el estudiante, carrera, ciclo y turno. El monto se calcula automáticamente según el ciclo.',
            when: nav?.matriculas,
        },
        {
            pregunta: '¿Cómo registro un pago de pensión?',
            respuesta:
                'Entra al detalle de la matrícula del estudiante, agrega la cuota del mes y usa "Registrar pago" indicando el monto y la modalidad (efectivo, Yape, Plin o tarjeta).',
            when: nav?.matriculas,
        },
        {
            pregunta: '¿Cómo gestiono estudiantes, profesores y secciones?',
            respuesta:
                'En el menú Académico puedes crear, editar y filtrar estudiantes, profesores, cursos y secciones.',
            when: nav?.students || nav?.teachers || nav?.courses,
        },
        {
            pregunta: '¿Cómo tomo o reviso la asistencia de una sección?',
            respuesta:
                'En Asistencias eliges la sección para marcar asistencia, o revisas el historial por fecha, sección o estudiante.',
            when: nav?.asistencias,
        },
        {
            pregunta: '¿Cómo registro un egreso o reviso la caja?',
            respuesta:
                'En Caja puedes registrar egresos (como pagos a docentes) y ver el balance de ingresos y egresos.',
            when: nav?.caja,
        },
        {
            pregunta: '¿Dónde veo los reportes financieros?',
            respuesta:
                'En Reportes encontrarás resúmenes de ingresos, egresos y pagos por período.',
            when: nav?.reportes,
        },
        {
            pregunta: '¿Cómo reviso y pago las horas de los docentes?',
            respuesta:
                'En Registro de horas puedes ver las horas registradas por cada docente y generar su pago; el comprobante queda disponible para descargar.',
            when: nav?.registrosHoras,
        },
        {
            pregunta: '¿Cómo apruebo permisos o licencias de docentes?',
            respuesta:
                'En Permisos revisa las solicitudes pendientes y apruébalas o recházalas.',
            when: nav?.permisos,
        },
        {
            pregunta: '¿Cómo creo cuentas de usuario?',
            respuesta:
                'En Usuarios puedes crear una cuenta, asignarle un rol y vincularla a un profesor o estudiante existente.',
            when: nav?.users,
        },
    ];
}

export default function HelpContent({
    className = '',
}: {
    className?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const role = auth.user.role;
    const nav = auth.nav;

    const staffFaqs = buildStaffFaqs(nav);

    const { intro, faqs } =
        role === 'estudiante'
            ? { intro: ESTUDIANTE_INTRO, faqs: ESTUDIANTE_FAQS }
            : role === 'docente'
              ? { intro: DOCENTE_INTRO, faqs: DOCENTE_FAQS }
              : {
                    intro: STAFF_INTRO,
                    faqs: staffFaqs.filter((faq) => faq.when !== false),
                };

    return (
        <div className={`space-y-6 ${className}`}>
            <div>
                <h3 className="mb-1 text-lg font-bold text-brand-ink-strong">
                    Preguntas frecuentes
                </h3>
                <p className="mb-4 text-sm text-brand-muted">{intro}</p>
                <div className="divide-y divide-brand-border-faint">
                    {faqs.map((faq) => (
                        <div key={faq.pregunta} className="py-4">
                            <p className="font-medium text-brand-ink-strong">
                                {faq.pregunta}
                            </p>
                            <p className="mt-1 text-sm text-brand-muted">
                                {faq.respuesta}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-2 text-lg font-bold text-brand-ink-strong">
                    ¿Necesitas más ayuda?
                </h3>
                <p className="text-sm text-brand-muted">
                    Escríbenos a{' '}
                    <a
                        href="mailto:soporte@americanolibertad.edu.pe"
                        className="text-brand-link hover:underline"
                    >
                        soporte@americanolibertad.edu.pe
                    </a>{' '}
                    y te ayudaremos con cualquier duda sobre el sistema.
                </p>
            </div>
        </div>
    );
}
