import { useRoute } from "wouter";
import { 
  FileText, 
  CalendarDays, 
  BookOpen 
} from "lucide-react";
import React from "react";

export function MainNav() {
  const [isFilesActive] = useRoute("#files");
  const [isQuizzesActive] = useRoute("#quizzes");
  const [isExamsActive] = useRoute("#exams");

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center md:justify-start h-14">
          <div className="flex gap-2 overflow-x-auto py-1 w-full md:w-auto justify-center md:justify-start">
            <a 
              href="#files" 
              onClick={(e) => scrollToSection('files', e)}
              className={`text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 whitespace-nowrap ${isFilesActive ? 'bg-primary/10 text-primary dark:text-primary-foreground' : ''}`}
            >
              <FileText className="h-4 w-4" />
              الملفات الدراسية
            </a>
            <a 
              href="#quizzes" 
              onClick={(e) => scrollToSection('quizzes', e)}
              className={`text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 whitespace-nowrap ${isQuizzesActive ? 'bg-primary/10 text-primary dark:text-primary-foreground' : ''}`}
            >
              <BookOpen className="h-4 w-4" />
              الاختبارات التفاعلية
            </a>
            <a 
              href="#exams" 
              onClick={(e) => scrollToSection('exams', e)}
              className={`text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 whitespace-nowrap ${isExamsActive ? 'bg-primary/10 text-primary dark:text-primary-foreground' : ''}`}
            >
              <CalendarDays className="h-4 w-4" />
              جدول الاختبارات
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
