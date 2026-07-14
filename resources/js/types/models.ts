export interface Student {
    id: number;
    document_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birth_date: string | null;
    address: string | null;
    status: 'active' | 'inactive' | 'graduated';
    enrollments_count?: number;
}

export interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    specialty: string | null;
    courses_count?: number;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    description: string | null;
    credit_hours: number;
    courses_count?: number;
}

export interface Course {
    id: number;
    subject_id: number;
    teacher_id: number | null;
    name: string;
    period: string;
    schedule: string | null;
    capacity: number;
    subject?: Subject;
    teacher?: Teacher | null;
    enrollments_count?: number;
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
    max_score: number;
    course?: Course;
    grades_count?: number;
}

export interface Grade {
    id: number;
    evaluation_id: number;
    student_id: number;
    score: number;
    comments: string | null;
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

export const enrollmentStatusLabels: Record<Enrollment['status'], string> = {
    active: 'Activa',
    withdrawn: 'Retirada',
    completed: 'Completada',
};
