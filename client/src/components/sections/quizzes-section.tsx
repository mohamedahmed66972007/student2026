import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, BookOpen } from "lucide-react";
import { Quiz } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { subjectOptions } from "@/types";
import { CreateQuizModal } from "@/components/modals/create-quiz-modal";
import { QuizDetailsModal } from "@/components/modals/quiz-details-modal";

export function QuizzesSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // استرجاع قائمة الاختبارات
  const { data: quizzes, isLoading, error, refetch } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes", searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/api/quizzes/search?term=${encodeURIComponent(searchTerm)}` : '/api/quizzes';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('فشل في استرجاع الاختبارات');
      }
      return res.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // إعادة تنفيذ الاستعلام مع مصطلح البحث الجديد
    refetch();
  };

  const openQuizDetails = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsDetailsModalOpen(true);
  };

  return (
    <section id="quizzes" className="py-10 scroll-mt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">الاختبارات التفاعلية</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          اختبارات تفاعلية يمكنك إنشاؤها والاستفادة منها في المراجعة والتقييم الذاتي
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="ابحث عن اختبار بالعنوان أو المادة أو الرمز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 ml-1" />
              بحث
            </Button>
          </form>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 ml-1" />
            إنشاء اختبار جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 dark:text-red-400">
              حدث خطأ أثناء تحميل الاختبارات. الرجاء المحاولة مرة أخرى.
            </p>
          </div>
        ) : !quizzes || quizzes.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm
                ? "لا توجد اختبارات تطابق بحثك"
                : "لا توجد اختبارات متاحة حاليًا"}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
              إنشاء أول اختبار
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge className="text-xs">{subjectOptions.find(option => option.value === quiz.subject)?.label || quiz.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    المنشئ: {quiz.creatorName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    تاريخ الإنشاء: {formatDate(quiz.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    عدد الأسئلة: {quiz.questions.length}
                  </p>
                  <div className="mt-3">
                    <p className="text-sm font-medium">رمز الاختبار:</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono text-xs mt-1">
                      {quiz.code}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => openQuizDetails(quiz)}
                  >
                    بدء الاختبار
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateQuizModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {selectedQuiz && isDetailsModalOpen && (
        <QuizDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          quiz={selectedQuiz}
        />
      )}
    </section>
  );
}