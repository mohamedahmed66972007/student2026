import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash, Plus, Save, X } from "lucide-react";
import { QuizQuestion } from "@shared/schema";

// تحقق من بيانات إنشاء الاختبار
const createQuizSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون على الأقل 3 أحرف"),
  subject: z.string().min(1, "الرجاء اختيار المادة"),
  creatorName: z.string().min(1, "الرجاء إدخال اسمك"),
});

type FormValues = z.infer<typeof createQuizSchema> & {
  questions: QuizQuestion[];
};

const questionTypeOptions = [
  { value: "multipleChoice", label: "اختيار من متعدد" },
  { value: "trueFalse", label: "صح أو خطأ" },
  { value: "shortAnswer", label: "إجابة قصيرة" },
];

const subjectOptions = [
  { value: "arabic", label: "اللغة العربية" },
  { value: "english", label: "اللغة الإنجليزية" },
  { value: "math", label: "الرياضيات" },
  { value: "chemistry", label: "الكيمياء" },
  { value: "physics", label: "الفيزياء" },
  { value: "biology", label: "الأحياء" },
  { value: "constitution", label: "الدستور" },
  { value: "islamic", label: "التربية الإسلامية" },
  { value: "other", label: "أخرى" },
];

// بنية سؤال فارغ
const emptyQuestion: QuizQuestion = {
  id: "",
  type: "multipleChoice",
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
};

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuizModal({ isOpen, onClose }: CreateQuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { ...emptyQuestion, id: uuidv4() },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      subject: "",
      creatorName: "",
      questions: questions,
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/quizzes", {
        ...data,
        questions: questions,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الاختبار بنجاح",
        description: "يمكن للطلاب الآن الوصول إلى الاختبار والإجابة عليه",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إنشاء الاختبار",
        description: error.message || "حدث خطأ أثناء إنشاء الاختبار",
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    const newQuestion = { ...emptyQuestion, id: uuidv4() };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
      if (currentQuestionIndex >= updatedQuestions.length) {
        setCurrentQuestionIndex(updatedQuestions.length - 1);
      }
    } else {
      toast({
        title: "لا يمكن حذف السؤال",
        description: "يجب أن يحتوي الاختبار على سؤال واحد على الأقل",
        variant: "destructive",
      });
    }
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions];
    
    if (field === 'type') {
      // إعادة تهيئة الخيارات عند تغيير نوع السؤال
      if (value === 'trueFalse') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: value,
          options: ["صح", "خطأ"],
          correctAnswer: ""
        };
      } else if (value === 'multipleChoice') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: value,
          options: ["", "", "", ""],
          correctAnswer: ""
        };
      } else {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: value,
          options: undefined,
          correctAnswer: ""
        };
      }
    } else if (field === 'options') {
      // تحديث خيار محدد
      if (typeof value === 'object' && 'index' in value && 'text' in value) {
        const optionIndex = value.index;
        const newOptions = [...(updatedQuestions[index].options || [])];
        newOptions[optionIndex] = value.text;
        updatedQuestions[index].options = newOptions;
      }
    } else {
      // تحديث أي حقل آخر
      (updatedQuestions[index] as any)[field] = value;
    }
    
    setQuestions(updatedQuestions);
  };

  const onSubmit = (data: FormValues) => {
    // التحقق من صحة الأسئلة
    const isQuestionsValid = questions.every(q => {
      if (!q.text) return false;
      
      if (q.type === 'multipleChoice') {
        return q.options && 
               q.options.filter(o => o.trim() !== '').length >= 2 && 
               q.correctAnswer !== '';
      }
      
      if (q.type === 'trueFalse') {
        return q.options && 
               q.options.length === 2 && 
               q.correctAnswer !== '';
      }
      
      if (q.type === 'shortAnswer') {
        return q.correctAnswer !== '';
      }
      
      return false;
    });
    
    if (!isQuestionsValid) {
      toast({
        title: "نقص في بيانات الأسئلة",
        description: "تأكد من ملء جميع حقول الأسئلة بشكل صحيح والإجابات الصحيحة",
        variant: "destructive",
      });
      return;
    }
    
    createQuizMutation.mutate({
      ...data,
      questions,
      randomizeQuestions // إضافة خيار ترتيب الأسئلة عشوائيًا
    });
  };

  const resetForm = () => {
    form.reset({
      title: "",
      subject: "",
      creatorName: "",
    });
    setQuestions([{ ...emptyQuestion, id: uuidv4() }]);
    setCurrentQuestionIndex(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">إنشاء اختبار جديد</DialogTitle>
          <DialogDescription className="text-center">
            قم بإنشاء اختبار جديد للطلاب وإضافة الأسئلة
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

        <div className="overflow-y-auto flex-1 pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* معلومات الاختبار */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان الاختبار</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل عنوان الاختبار" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المادة</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المادة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم منشئ الاختبار</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسمك"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="col-span-2 mt-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse justify-between rounded-md border p-4">
                    <div>
                      <h4 className="text-sm font-medium leading-none mb-1">ترتيب الأسئلة عشوائياً</h4>
                      <p className="text-xs text-muted-foreground">
                        يقوم بتغيير ترتيب الأسئلة بشكل عشوائي لكل متقدم للاختبار
                      </p>
                    </div>
                    <Switch 
                      checked={randomizeQuestions}
                      onCheckedChange={setRandomizeQuestions}
                    />
                  </div>
                </div>
              </div>

              {/* إضافة وتعديل الأسئلة */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">الأسئلة</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة سؤال
                  </Button>
                </div>

                <Tabs
                  value={currentQuestionIndex.toString()}
                  onValueChange={(value) => setCurrentQuestionIndex(parseInt(value))}
                  className="w-full"
                >
                  <TabsList className="w-full flex overflow-x-auto space-x-2 space-x-reverse mb-4">
                    {questions.map((_, index) => (
                      <TabsTrigger
                        key={index}
                        value={index.toString()}
                        className="flex-shrink-0"
                      >
                        سؤال {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {questions.map((question, index) => (
                    <TabsContent
                      key={index}
                      value={index.toString()}
                      className="space-y-4"
                    >
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between">
                            <div className="text-sm font-medium">نوع السؤال:</div>
                            <Select
                              value={question.type}
                              onValueChange={(value: "multipleChoice" | "trueFalse" | "shortAnswer") =>
                                updateQuestion(index, 'type', value)
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="نوع السؤال" />
                              </SelectTrigger>
                              <SelectContent>
                                {questionTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <FormLabel>نص السؤال</FormLabel>
                            <Textarea
                              value={question.text}
                              onChange={(e) =>
                                updateQuestion(index, 'text', e.target.value)
                              }
                              placeholder="أدخل نص السؤال هنا"
                              className="resize-none"
                            />
                          </div>

                          {/* خيارات الإجابة - متعدد الخيارات */}
                          {question.type === "multipleChoice" && (
                            <div className="space-y-3">
                              <FormLabel>خيارات الإجابة</FormLabel>
                              {question.options?.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      updateQuestion(index, 'options', {
                                        index: optionIndex,
                                        text: e.target.value,
                                      })
                                    }
                                    placeholder={`الخيار ${optionIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={
                                      question.correctAnswer === option.toString()
                                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                                        : ""
                                    }
                                    onClick={() =>
                                      updateQuestion(index, 'correctAnswer', option)
                                    }
                                  >
                                    تعيين كإجابة صحيحة
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* خيارات صح أو خطأ */}
                          {question.type === "trueFalse" && (
                            <div className="space-y-3">
                              <FormLabel>الإجابة الصحيحة</FormLabel>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={
                                    question.correctAnswer === "صح"
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    updateQuestion(index, 'correctAnswer', "صح")
                                  }
                                >
                                  صح
                                </Button>
                                <Button
                                  type="button"
                                  variant={
                                    question.correctAnswer === "خطأ"
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    updateQuestion(index, 'correctAnswer', "خطأ")
                                  }
                                >
                                  خطأ
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* الإجابة القصيرة */}
                          {question.type === "shortAnswer" && (
                            <div>
                              <FormLabel>الإجابة الصحيحة</FormLabel>
                              <Input
                                value={
                                  typeof question.correctAnswer === 'string'
                                    ? question.correctAnswer
                                    : ''
                                }
                                onChange={(e) =>
                                  updateQuestion(index, 'correctAnswer', e.target.value)
                                }
                                placeholder="أدخل الإجابة الصحيحة"
                              />
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                            >
                              <Trash className="h-4 w-4 ml-1" />
                              حذف السؤال
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={createQuizMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {createQuizMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      جاري الإنشاء...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      إنشاء الاختبار
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}