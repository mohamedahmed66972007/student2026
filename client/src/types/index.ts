import { File, Exam } from "@shared/schema";

export interface SubjectOption {
  value: string;
  label: string;
}

export interface SemesterOption {
  value: string;
  label: string;
}

export const subjectOptions: SubjectOption[] = [
  { value: "all", label: "جميع المواد" },
  { value: "arabic", label: "اللغة العربية" },
  { value: "english", label: "اللغة الإنجليزية" },
  { value: "math", label: "الرياضيات" },
  { value: "chemistry", label: "الكيمياء" },
  { value: "physics", label: "الفيزياء" },
  { value: "biology", label: "الأحياء" },
  { value: "constitution", label: "الدستور" },
  { value: "islamic", label: "التربية الإسلامية" },
];

export const semesterOptions: SemesterOption[] = [
  { value: "all", label: "جميع الفصول" },
  { value: "first", label: "الفصل الأول" },
  { value: "second", label: "الفصل الثاني" },
];

export const getSubjectLabel = (value: string): string => {
  const subject = subjectOptions.find(option => option.value === value);
  return subject ? subject.label : "غير معروف";
};

export const getSemesterLabel = (value: string): string => {
  const semester = semesterOptions.find(option => option.value === value);
  return semester ? semester.label : "غير معروف";
};

export interface FileWithUrl extends File {
  downloadUrl: string;
}

export interface ExamRow {
  id?: number;
  subject: string;
  date: string;
  time: string;
  room: string;
  notes?: string;
}
