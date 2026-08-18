export type Turno = 'mañana' | 'tarde' | 'noche';

export interface Carrera {
    id: number;
    name: string;
    code: string;
    total_ciclos: number;
    imagen_path: string | null;
    imagen_url: string | null;
    students_count?: number;
    subjects_count?: number;
}

export interface PeriodoAcademico {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    courses_count?: number;
    matriculas_count?: number;
}

export interface ConfiguracionPago {
    id: number;
    yape_numero: string | null;
    yape_qr_path: string | null;
    plin_numero: string | null;
    plin_qr_path: string | null;
    cuenta_detalle: string | null;
}

export interface AdmissionApplication {
    id: number;
    apellido_paterno: string;
    apellido_materno: string;
    nombres: string;
    dni: string;
    sexo: 'masculino' | 'femenino';
    fecha_nacimiento: string | null;
    telefono: string | null;
    correo: string | null;
    carrera_id: number;
    turno: Turno;
    colegio_procedencia: string | null;
    lugar_procedencia: string | null;
    apoderado_nombres: string | null;
    apoderado_dni: string | null;
    apoderado_parentesco: string | null;
    apoderado_telefono: string | null;
    apoderado_correo: string | null;
    documento_dni_path: string | null;
    documento_certificado_path: string | null;
    documento_partida_path: string | null;
    documento_foto_path: string | null;
    estado: 'pendiente' | 'revisado' | 'aceptado' | 'rechazado';
    created_at: string;
    carrera?: Carrera;
}

export const admisionEstadoLabels: Record<AdmissionApplication['estado'], string> = {
    pendiente: 'Pendiente',
    revisado: 'Revisado',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
};

export interface Student {
    id: number;
    document_number: string;
    qr_token: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birth_date: string | null;
    address: string | null;
    status: 'active' | 'inactive' | 'graduated';
    carrera_id: number | null;
    ciclo: number | null;
    turno: Turno | null;
    carrera?: Carrera | null;
    enrollments_count?: number;
    user?: { avatar_url: string | null } | null;
}

export interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    specialty: string[] | null;
    tarifa_hora: number;
    courses_count?: number;
    user?: { avatar_url: string | null } | null;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    description: string | null;
    credit_hours: number;
    carrera_id: number | null;
    ciclo: number | null;
    imagen_path: string | null;
    imagen_url: string | null;
    carrera?: Carrera | null;
    courses_count?: number;
}

export interface Course {
    id: number;
    subject_id: number;
    teacher_id: number | null;
    name: string;
    period: string;
    periodo_academico_id: number | null;
    schedule: string | null;
    turno: Turno | null;
    capacity: number;
    objetivo_general: string | null;
    mensaje_bienvenida: string | null;
    modalidad: string | null;
    sistema_evaluacion: string | null;
    requisitos: string | null;
    competencia_general: string | null;
    competencias_especificas: string | null;
    resultados_aprendizaje: string | null;
    normas_curso: string | null;
    subject?: Subject;
    teacher?: Teacher | null;
    periodo_academico?: PeriodoAcademico | null;
    enrollments_count?: number;
    recursos_aula_count?: number;
    evaluations_count?: number;
    horarios?: Horario[];
}

export interface Aula {
    id: number;
    nombre: string;
}

export type DiaSemana =
    | 'lunes'
    | 'martes'
    | 'miercoles'
    | 'jueves'
    | 'viernes'
    | 'sabado'
    | 'domingo';

export const diaSemanaLabels: Record<DiaSemana, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
};

export interface Horario {
    id: number;
    course_id: number;
    dia_semana: DiaSemana;
    hora_inicio: string;
    hora_fin: string;
    aula: string | null;
    aula_id: number | null;
    aula_ref?: Aula | null;
    course?: Course;
}

export interface Enrollment {
    id: number;
    student_id: number;
    course_id: number;
    enrolled_at: string;
    status: 'active' | 'withdrawn' | 'completed';
    student?: Student;
    course?: Course;
}

export interface Evaluation {
    id: number;
    course_id: number;
    name: string;
    type: 'exam' | 'quiz' | 'homework' | 'project';
    weight: number;
    date: string;
    semana: number | null;
    max_score: number;
    intentos_permitidos: number;
    course?: Course;
    grades_count?: number;
    total_estudiantes?: number;
    preguntas_count?: number;
    intentos_usados?: number;
    mi_intento?: QuizIntento | null;
    mi_entrega?: EntregaEvaluacion | null;
    estado?: 'pendiente' | 'entregado' | 'en_progreso' | 'calificado' | 'vencido';
}

export interface Tema {
    titulo: string;
    subtemas: string[];
}

export interface SemanaContenido {
    id: number;
    course_id: number;
    semana: number;
    titulo: string | null;
    descripcion: string | null;
    objetivo: string | null;
    resultados_aprendizaje: string | null;
    temas: Tema[] | null;
    cierre_resumen: string | null;
}

export interface QuizOpcion {
    id: number;
    quiz_pregunta_id: number;
    texto: string;
    es_correcta: boolean;
    orden: number;
}

export interface QuizPregunta {
    id: number;
    evaluation_id: number;
    texto: string;
    orden: number;
    opciones?: QuizOpcion[];
}

export interface QuizIntento {
    id: number;
    evaluation_id: number;
    student_id: number;
    puntaje: number;
    enviado_at: string;
}

export interface EntregaEvaluacion {
    id: number;
    evaluation_id: number;
    student_id: number;
    archivo: string;
    nombre_original: string;
    enviado_at: string;
}

export interface Grade {
    id: number;
    evaluation_id: number;
    student_id: number;
    score: number;
    comments: string | null;
    evaluation?: Evaluation;
    student?: Student;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export const evaluationTypeLabels: Record<Evaluation['type'], string> = {
    exam: 'Examen',
    quiz: 'Quiz',
    homework: 'Tarea',
    project: 'Proyecto',
};

export const studentStatusLabels: Record<Student['status'], string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    graduated: 'Graduado',
};

export const userRoleLabels: Record<import('.').UserRole, string> = {
    gerencia: 'Gerencia',
    administrativo: 'Secretaría',
    coordinador: 'Coordinador',
    academico: 'Académico',
    docente: 'Docente',
    estudiante: 'Estudiante',
};

export const turnoLabels: Record<Turno, string> = {
    mañana: 'Mañana',
    tarde: 'Tarde',
    noche: 'Noche',
};

export interface Pago {
    id: number;
    cuota_id: number;
    student_id: number;
    registrado_por: number | null;
    monto: number;
    medio: 'efectivo' | 'yape' | 'plin' | 'tarjeta' | 'mixto';
    monto_efectivo: number;
    monto_yape: number;
    fecha: string;
    nota: string | null;
    estado: 'declarado' | 'confirmado';
    comprobante_path: string | null;
    confirmado_por: number | null;
    confirmado_at: string | null;
    fecha_limite_pago: string | null;
    student?: Student;
    cuota?: Cuota;
}

export interface Cuota {
    id: number;
    matricula_id: number;
    tipo: 'matricula' | 'pension';
    mes: string | null;
    monto_programado: number;
    monto_pagado: number;
    fecha_vencimiento: string | null;
    estado: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
    pagos?: Pago[];
    matricula?: Matricula;
}

export interface HistorialMatricula {
    id: number;
    matricula_id: number;
    user_id: number | null;
    campo: string;
    valor_anterior: string | null;
    valor_nuevo: string | null;
    created_at: string;
    user?: { id: number; name: string } | null;
}

export interface Matricula {
    id: number;
    student_id: number;
    carrera_id: number;
    ciclo: number;
    turno: Turno;
    period: string;
    periodo_academico_id: number | null;
    monto_matricula: number;
    fecha_matricula: string;
    estado: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
    student?: Student;
    carrera?: Carrera;
    periodo_academico?: PeriodoAcademico | null;
    cuotas?: Cuota[];
    saldo_total?: number;
    pagado_total?: number;
    materias?: { subject: string; course: string; teacher: string | null }[];
    historiales?: HistorialMatricula[];
}

export interface Egreso {
    id: number;
    concepto: string;
    categoria: 'pago_docente' | 'operativo' | 'otro';
    monto: number;
    fecha: string;
    registrado_por: number | null;
}

export const cuotaEstadoLabels: Record<Cuota['estado'], string> = {
    pendiente: 'Pendiente',
    parcial: 'Parcial',
    pagado: 'Pagado',
    vencido: 'Vencido',
};

export const medioPagoLabels: Record<Pago['medio'], string> = {
    efectivo: 'Efectivo',
    yape: 'Yape',
    plin: 'Plin',
    tarjeta: 'Tarjeta',
    mixto: 'Mixto',
};

export const pagoEstadoLabels: Record<Pago['estado'], string> = {
    declarado: 'Esperando confirmación',
    confirmado: 'Confirmado',
};

export const egresoCategoriaLabels: Record<Egreso['categoria'], string> = {
    pago_docente: 'Pago a docente',
    operativo: 'Operativo',
    otro: 'Otro',
};

export interface IngresoManual {
    id: number;
    concepto: string;
    categoria: 'donacion' | 'servicio' | 'otro';
    monto: number;
    fecha: string;
    registrado_por: number | null;
}

export const ingresoManualCategoriaLabels: Record<IngresoManual['categoria'], string> = {
    donacion: 'Donación',
    servicio: 'Servicio',
    otro: 'Otro',
};

export const enrollmentStatusLabels: Record<Enrollment['status'], string> = {
    active: 'Activa',
    withdrawn: 'Retirada',
    completed: 'Completada',
};

export interface Asistencia {
    id: number;
    course_id: number;
    student_id: number;
    fecha: string;
    estado: 'presente' | 'tardanza' | 'falta' | 'justificado';
    hora_registro: string | null;
    registrado_por: number | null;
    student?: Student;
    course?: Course;
}

export const asistenciaEstadoLabels: Record<Asistencia['estado'], string> = {
    presente: 'Presente',
    tardanza: 'Tardanza',
    falta: 'Falta',
    justificado: 'Justificado',
};

export interface AsistenciaSheetRow {
    student: Student;
    asistencia: Asistencia | null;
}

export interface RecursoAula {
    id: number;
    course_id: number;
    semana: number | null;
    titulo: string;
    tipo: 'enlace' | 'archivo' | 'anuncio' | 'texto';
    entregable: boolean;
    es_principal: boolean;
    es_complementario: boolean;
    fecha_entrega: string | null;
    descripcion: string | null;
    url: string | null;
    archivo: string | null;
    archivo_nombre: string | null;
    archivo_url: string | null;
    creado_por: number | null;
    created_at: string;
    visto?: boolean;
}

export interface ForoRespuesta {
    id: number;
    foro_tema_id: number;
    user_id: number;
    contenido: string;
    created_at: string;
    user?: { id: number; name: string };
}

export interface ForoTema {
    id: number;
    course_id: number;
    semana: number;
    titulo: string;
    pregunta: string | null;
    creado_por: number | null;
    created_at: string;
    autor?: { id: number; name: string };
    respuestas?: ForoRespuesta[];
}

export const recursoTipoLabels: Record<RecursoAula['tipo'], string> = {
    enlace: 'Enlace',
    archivo: 'Archivo',
    anuncio: 'Anuncio',
    texto: 'Texto',
};

export interface RegistroHoras {
    id: number;
    teacher_id: number;
    course_id: number | null;
    fecha: string;
    horas_academicas: number;
    minutos_tardanza: number;
    nota: string | null;
    pagado: boolean;
    egreso_id: number | null;
    teacher?: Teacher;
    course?: Course | null;
    monto_bruto?: number;
    descuento_tardanza?: number;
    monto_neto?: number;
}

export interface PermisoDocente {
    id: number;
    teacher_id: number;
    tipo: 'permiso' | 'licencia' | 'vacaciones';
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string | null;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    respondido_por: number | null;
    teacher?: Teacher;
}

export const permisoTipoLabels: Record<PermisoDocente['tipo'], string> = {
    permiso: 'Permiso',
    licencia: 'Licencia',
    vacaciones: 'Vacaciones',
};

export const permisoEstadoLabels: Record<PermisoDocente['estado'], string> = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
};
