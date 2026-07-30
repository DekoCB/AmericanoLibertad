export type Turno = 'mañana' | 'tarde' | 'noche';

export interface Carrera {
    id: number;
    name: string;
    code: string;
    total_ciclos: number;
    students_count?: number;
    subjects_count?: number;
}

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
    carrera?: Carrera | null;
    courses_count?: number;
}

export interface Course {
    id: number;
    subject_id: number;
    teacher_id: number | null;
    name: string;
    period: string;
    schedule: string | null;
    turno: Turno | null;
    capacity: number;
    subject?: Subject;
    teacher?: Teacher | null;
    enrollments_count?: number;
    recursos_aula_count?: number;
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
    course?: Course;
    grades_count?: number;
    preguntas_count?: number;
    mi_intento?: QuizIntento | null;
    mi_entrega?: EntregaEvaluacion | null;
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
    administrativo: 'Administrativo',
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
    monto_matricula: number;
    fecha_matricula: string;
    estado: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
    student?: Student;
    carrera?: Carrera;
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

export const egresoCategoriaLabels: Record<Egreso['categoria'], string> = {
    pago_docente: 'Pago a docente',
    operativo: 'Operativo',
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
    tipo: 'enlace' | 'archivo' | 'anuncio';
    entregable: boolean;
    fecha_entrega: string | null;
    descripcion: string | null;
    url: string | null;
    archivo: string | null;
    archivo_nombre: string | null;
    archivo_url: string | null;
    creado_por: number | null;
    created_at: string;
}

export const recursoTipoLabels: Record<RecursoAula['tipo'], string> = {
    enlace: 'Enlace',
    archivo: 'Archivo',
    anuncio: 'Anuncio',
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
