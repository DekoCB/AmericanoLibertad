export type UserRole =
    | 'gerencia'
    | 'administrativo'
    | 'coordinador'
    | 'academico'
    | 'docente'
    | 'estudiante';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: UserRole;
    teacher_id: number | null;
    student_id: number | null;
    avatar_url: string | null;
}

export interface NavPermissions {
    students: boolean;
    teachers: boolean;
    subjects: boolean;
    courses: boolean;
    carreras: boolean;
    admisiones: boolean;
    notas: boolean;
    matriculas: boolean;
    pagos: boolean;
    caja: boolean;
    reportes: boolean;
    horarios: boolean;
    asistencias: boolean;
    aulaVirtual: boolean;
    registrosHoras: boolean;
    permisos: boolean;
    users: boolean;
    misPagos: boolean;
    periodosAcademicos: boolean;
    configuracionPagos: boolean;
}

export interface PaymentAlert {
    pendientes: number;
    efectivoPorConfirmar: {
        id: number;
        monto: number;
        fecha_limite_pago: string | null;
    }[];
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        nav: NavPermissions | null;
    };
    flash: {
        success: string | null;
        error: string | null;
    };
    paymentAlert: PaymentAlert | null;
};
