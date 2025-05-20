import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { subjectOptions } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAdmin } from "@/hooks/use-admin";
import { X, Play, CheckCircle, AlertCircle, Trash, BarChart2 } from "lucide-react";
import { Quiz, QuizAttempt, QuizQuestion, QuizAnswer } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface QuizDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
}

export function QuizDetailsModal({ isOpen, onClose, quiz }: QuizDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<string>("info");
  const [userName, setUserName] = useState("");
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [attemptSubmitted, setAttemptSubmitted] = useState<boolean>(false);
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // استعلام محاولات اختبار المستخدم
  const { data: attempts, isLoading: attemptsLoading } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quizzes", quiz.id, "attempts"],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quiz.id}/attempts`);
      if (!res.ok) {
        throw new Error('فشل في استرجاع محاولات الاختبار');
      }
      return res.json();
    },
    enabled: isAdmin || activeTab === "analytics"
  });

  // إرسال إجابة الاختبار
  const submitAttemptMutation = useMutation({
    mutationFn: async (data: {
      quizId: number;
      userName: string;
      answers: { questionId: string; answer: string | string[] }[];
    }) => {
      return await apiRequest("POST", "/api/quizzes/attempts", data);
    },
    onSuccess: (data) => {
      setAttemptSubmitted(true);
      setAttemptResult(data);
      toast({
        title: "تم إرسال إجاباتك بنجاح",
        description: `نتيجتك: ${data.score} من ${data.totalQuestions}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", quiz.id, "attempts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في إرسال الإجابات",
        description: error.message || "حدث خطأ أثناء إرسال إجاباتك",
        variant: "destructive",
      });
    },
  });

  // حذف الاختبار (للمشرفين أو منشئ الاختبار)
  const deleteQuizMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/quizzes/${quiz.id}`, {
        creatorName: isAdmin ? 'admin' : quiz.creatorName
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الاختبار بنجاح",
        description: "تم حذف الاختبار وجميع محاولاته",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في حذف الاختبار",
        description: error.message || "حدث خطأ أثناء حذف الاختبار",
        variant: "destructive",
      });
    },
  });

  // إعادة تعيين حالة المودال عند فتحه
  useEffect(() => {
    if (isOpen) {
      setActiveTab("info");
      setUserName("");
      setUserAnswers({});
      setAttemptSubmitted(false);
      setAttemptResult(null);
    }
  }, [isOpen]);
  
  // التحقق مما إذا كان المستخدم قد أجرى الاختبار من قبل عند تغيير الاسم
  useEffect(() => {
    const checkPreviousAttempt = async () => {
      if (!userName || !quiz.id) return;
      
      try {
        const res = await fetch(`/api/quizzes/${quiz.id}/my-attempt?userName=${encodeURIComponent(userName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setAttemptSubmitted(true);
            setAttemptResult(data);
          }
        }
      } catch (error) {
        console.error("Error checking previous attempt:", error);
      }
    };

    // تنفيذ الاستعلام فقط إذا كان هناك قيمة للاسم
    if (userName && userName.trim() !== '') {
      checkPreviousAttempt();
    }
  }, [userName, quiz.id]);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleStartQuiz = () => {
    if (!userName.trim()) {
      toast({
        title: "الاسم مطلوب",
        description: "الرجاء إدخال اسمك قبل البدء",
        variant: "destructive",
      });
      return;
    }
    setActiveTab("quiz");
  };

  const handleSubmitQuiz = () => {
    // التحقق من إجابة جميع الأسئلة
    const answeredQuestions = Object.keys(userAnswers).length;
    if (answeredQuestions < quiz.questions.length) {
      toast({
        title: "إجابات غير مكتملة",
        description: `لم تجب على جميع الأسئلة (${answeredQuestions} من ${quiz.questions.length})`,
        variant: "destructive",
      });
      return;
    }

    // تنسيق الإجابات للإرسال
    const formattedAnswers = Object.entries(userAnswers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    submitAttemptMutation.mutate({
      quizId: quiz.id,
      userName,
      answers: formattedAnswers,
    });
  };

  const calculateSuccessRate = (): string => {
    if (!attempts || attempts.length === 0) return "0%";
    
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.reduce((count, attempt) => {
      const successRate = attempt.score / attempt.totalQuestions;
      return successRate >= 0.5 ? count + 1 : count; // اعتبار النجاح 50% أو أكثر
    }, 0);
    
    return `${Math.round((successfulAttempts / totalAttempts) * 100)}%`;
  };

  const calculateAverageScore = (): string => {
    if (!attempts || attempts.length === 0) return "0";
    
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
    
    return ((totalScore / totalQuestions) * 100).toFixed(1) + "%";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">{quiz.title}</DialogTitle>
          <DialogDescription className="text-center">
            رمز الاختبار: <span className="font-mono font-semibold">{quiz.code}</span> | 
            المادة: <span className="font-semibold">{subjectOptions.find(option => option.value === quiz.subject)?.label || quiz.subject}</span>
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-muted-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="info">معلومات الاختبار</TabsTrigger>
            {!attemptSubmitted && <TabsTrigger value="quiz" disabled={!userName}>حل الاختبار</TabsTrigger>}
            {attemptSubmitted && <TabsTrigger value="results">النتائج</TabsTrigger>}
            {(isAdmin || quiz.creatorName === userName) && (
              <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-hidden">
            {/* معلومات الاختبار */}
            <TabsContent value="info" className="h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>حول الاختبار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">منشئ الاختبار: <span className="font-semibold">{quiz.creatorName}</span></p>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ الإنشاء: <span className="font-semibold">{formatDate(quiz.createdAt)}</span></p>
                    <p className="text-sm text-muted-foreground mb-1">عدد الأسئلة: <span className="font-semibold">{quiz.questions.length}</span></p>
                  </div>

                  <Separator />

                  {!attemptSubmitted ? (
                    <div className="space-y-3">
                      <Label htmlFor="userName">أدخل اسمك للبدء</Label>
                      <Input
                        id="userName"
                        placeholder="اسمك الكامل"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        onBlur={(e) => {
                          // حفظ القيمة بشكل آمن عند فقدان التركيز
                          if (!e.target.value) {
                            setUserName("");
                          }
                        }}
                      />
                      <Button onClick={handleStartQuiz} className="w-full" disabled={!userName.trim()}>
                        <Play className="h-4 w-4 ml-1" />
                        بدء الاختبار
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-md">
                      <p className="font-semibold mb-2">لقد أكملت هذا الاختبار بالفعل</p>
                      <p>النتيجة: <span className="font-semibold">{attemptResult?.score} من {attemptResult?.totalQuestions}</span></p>
                      <Button variant="outline" className="mt-2" onClick={() => setActiveTab("results")}>
                        عرض نتائجك
                      </Button>
                    </div>
                  )}

                  {(isAdmin || userName === quiz.creatorName) && (
                    <>
                      <Separator />
                      <div>
                        <Button
                          variant="destructive"
                          onClick={() => deleteQuizMutation.mutate()}
                          disabled={deleteQuizMutation.isPending}
                        >
                          <Trash className="h-4 w-4 ml-1" />
                          حذف الاختبار
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* حل الاختبار */}
            <TabsContent value="quiz" className="h-full overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-1">
                  {quiz.questions.map((question, index) => (
                    <Card key={question.id} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">
                          سؤال {index + 1}: {question.text}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* أسئلة الاختيار المتعدد */}
                        {question.type === "multipleChoice" && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center">
                                <input
                                  type="radio"
                                  id={`q${index}-option${optionIndex}`}
                                  name={`question-${question.id}`}
                                  value={option}
                                  checked={userAnswers[question.id] === option}
                                  onChange={() => handleAnswerChange(question.id, option)}
                                  className="ml-2"
                                />
                                <label htmlFor={`q${index}-option${optionIndex}`} className="text-sm">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* أسئلة صح أو خطأ */}
                        {question.type === "trueFalse" && (
                          <div className="flex gap-4">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={`q${index}-true`}
                                name={`question-${question.id}`}
                                value="صح"
                                checked={userAnswers[question.id] === "صح"}
                                onChange={() => handleAnswerChange(question.id, "صح")}
                                className="ml-2"
                              />
                              <label htmlFor={`q${index}-true`} className="text-sm">
                                صح
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={`q${index}-false`}
                                name={`question-${question.id}`}
                                value="خطأ"
                                checked={userAnswers[question.id] === "خطأ"}
                                onChange={() => handleAnswerChange(question.id, "خطأ")}
                                className="ml-2"
                              />
                              <label htmlFor={`q${index}-false`} className="text-sm">
                                خطأ
                              </label>
                            </div>
                          </div>
                        )}

                        {/* أسئلة الإجابة القصيرة */}
                        {question.type === "shortAnswer" && (
                          <div>
                            <Input
                              placeholder="اكتب إجابتك هنا"
                              value={(userAnswers[question.id] as string) || ""}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 border-t pt-4 flex justify-center">
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={submitAttemptMutation.isPending}
                  size="lg"
                  className="px-10"
                >
                  {submitAttemptMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      جاري التقديم...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      تسليم الاختبار
                    </span>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* نتائج الاختبار */}
            <TabsContent value="results" className="h-full overflow-y-auto">
              {attemptResult && (
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle>نتائج الاختبار</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <h3 className="text-xl font-bold mb-2">درجتك النهائية</h3>
                      <div className="text-3xl font-bold mb-2">
                        {attemptResult.score} / {attemptResult.totalQuestions}
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground">
                        {Math.round((attemptResult.score / attemptResult.totalQuestions) * 100)}%
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">مراجعة الإجابات</h3>
                      {quiz.questions.map((question, index) => {
                        const userAnswer = attemptResult.answers.find(
                          (a) => a.questionId === question.id
                        );
                        
                        return (
                          <div key={question.id} className="border p-3 rounded-md">
                            <div className="flex items-start gap-2">
                              {userAnswer?.isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{index + 1}. {question.text}</p>
                                
                                <div className="mt-2 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">إجابتك: </span>
                                    <span className={userAnswer?.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                                      {Array.isArray(userAnswer?.answer)
                                        ? userAnswer?.answer.join(", ")
                                        : userAnswer?.answer}
                                    </span>
                                  </p>
                                  
                                  {!userAnswer?.isCorrect && (
                                    <p className="mt-1">
                                      <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                                      <span className="text-green-600 dark:text-green-400 font-medium">
                                        {Array.isArray(question.correctAnswer)
                                          ? question.correctAnswer.join(", ")
                                          : question.correctAnswer}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* تحليلات الاختبار */}
            <TabsContent value="analytics" className="h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>تحليلات الاختبار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {attemptsLoading ? (
                    <div className="flex justify-center p-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : !attempts || attempts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      لا توجد محاولات لهذا الاختبار بعد
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-muted/50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm font-medium mb-1 text-muted-foreground">
                              عدد المحاولات
                            </p>
                            <p className="text-2xl font-bold">{attempts.length}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm font-medium mb-1 text-muted-foreground">
                              نسبة النجاح
                            </p>
                            <p className="text-2xl font-bold">{calculateSuccessRate()}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm font-medium mb-1 text-muted-foreground">
                              متوسط الدرجات
                            </p>
                            <p className="text-2xl font-bold">{calculateAverageScore()}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-2">المحاولات</h3>
                        <div className="space-y-2">
                          {attempts.map((attempt) => (
                            <div
                              key={attempt.id}
                              className="p-3 border rounded-md flex flex-wrap justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">{attempt.userName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(attempt.completedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    attempt.score / attempt.totalQuestions >= 0.5
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {attempt.score} / {attempt.totalQuestions}{" "}
                                  (
                                  {Math.round(
                                    (attempt.score / attempt.totalQuestions) * 100
                                  )}
                                  %)
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}