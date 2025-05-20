import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, AlertCircle, Plus, Save, X, XCircle, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// أيام الأسبوع بالعربية
const weekDays = [
  { id: 1, name: "الأحد" },
  { id: 2, name: "الاثنين" },
  { id: 3, name: "الثلاثاء" },
  { id: 4, name: "الأربعاء" },
  { id: 5, name: "الخميس" }
];

// قائمة المواد الدراسية
const subjects = [
  { value: "arabic", label: "اللغة العربية" },
  { value: "english", label: "اللغة الإنجليزية" },
  { value: "math", label: "الرياضيات" },
  { value: "chemistry", label: "الكيمياء" },
  { value: "physics", label: "الفيزياء" },
  { value: "biology", label: "الأحياء" },
  { value: "constitution", label: "الدستور" },
  { value: "islamic", label: "التربية الإسلامية" },
  { value: "other", label: "أخرى" }
];

// نموذج اختبار فارغ
interface ExamDay {
  day: string;
  date: string;
  hasExam: boolean;
  subject?: string;
  topics?: string;
}

export function ExamsSection() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [examSchedule, setExamSchedule] = useState<ExamDay[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // استرجاع جدول الاختبارات
  const { data: weeklySchedule, isLoading, error } = useQuery({
    queryKey: ["/api/weekly-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-schedule");
      if (!res.ok) throw new Error("فشل في تحميل جدول الاختبارات");
      return res.json();
    }
  });

  // تحديث جدول الاختبارات عند استرجاعه
  useEffect(() => {
    if (weeklySchedule && weeklySchedule.length > 0) {
      setExamSchedule(weeklySchedule);
    } else {
      // إنشاء جدول فارغ إذا لم يكن هناك بيانات
      const emptySchedule = weekDays.map(day => ({
        day: day.name,
        date: "",
        hasExam: false
      }));
      setExamSchedule(emptySchedule);
    }
  }, [weeklySchedule]);

  // حفظ جدول الاختبارات
  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: ExamDay[]) => {
      return await apiRequest("POST", "/api/weekly-schedule", schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-schedule"] });
      toast({
        title: "تم حفظ جدول الاختبارات",
        description: "تم تحديث جدول الاختبارات بنجاح"
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في حفظ جدول الاختبارات",
        description: error.message || "حدث خطأ أثناء حفظ جدول الاختبارات",
        variant: "destructive"
      });
    }
  });

  // تحديث حقل في يوم معين
  const updateExamDay = (index: number, field: keyof ExamDay, value: any) => {
    const updatedSchedule = [...examSchedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setExamSchedule(updatedSchedule);
  };

  // حفظ التغييرات
  const handleSaveChanges = () => {
    // التحقق من صحة البيانات
    const isValid = examSchedule.every(day => !day.hasExam || (day.hasExam && day.date && day.subject));
    
    if (!isValid) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة للأيام التي بها اختبارات",
        variant: "destructive"
      });
      return;
    }
    
    saveScheduleMutation.mutate(examSchedule);
  };

  // إلغاء التحرير
  const handleCancel = () => {
    if (weeklySchedule && weeklySchedule.length > 0) {
      setExamSchedule(weeklySchedule);
    }
    setIsEditing(false);
  };

  // إضافة اختبار جديد
  const startEditing = () => {
    if (!weeklySchedule || weeklySchedule.length === 0) {
      // إنشاء جدول فارغ إذا لم يكن هناك بيانات
      const emptySchedule = weekDays.map(day => ({
        day: day.name,
        date: "",
        hasExam: false
      }));
      setExamSchedule(emptySchedule);
    }
    setIsEditing(true);
  };

  return (
    <section id="exams" className="py-10 scroll-mt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">جدول الاختبارات</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          جدول الاختبارات المقبلة مرتبة حسب أيام الأسبوع
        </p>

        <div className="flex justify-end mb-6">
          {isAdmin && !isEditing ? (
            <Button onClick={startEditing}>
              <Plus className="h-4 w-4 ml-1" />
              تحرير جدول الاختبارات
            </Button>
          ) : isAdmin && isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={saveScheduleMutation.isPending}
              >
                <X className="h-4 w-4 ml-1" />
                إلغاء
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={saveScheduleMutation.isPending}
              >
                {saveScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-1" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  حدث خطأ أثناء تحميل جدول الاختبارات
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  يرجى تحديث الصفحة والمحاولة مرة أخرى
                </p>
              </div>
            </div>
          </div>
        ) : !examSchedule || examSchedule.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              لا توجد اختبارات مجدولة حاليًا
            </p>
            {isAdmin && (
              <Button onClick={startEditing}>
                إضافة جدول اختبارات
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {examSchedule.map((day, index) => (
              <Card key={index} className={`overflow-hidden ${day.hasExam ? 'border-primary/30 dark:border-primary/20' : ''}`}>
                <CardHeader className={`pb-3 ${day.hasExam ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span>{day.day}</span>
                    {isEditing ? (
                      <Switch
                        checked={day.hasExam}
                        onCheckedChange={(checked) => updateExamDay(index, 'hasExam', checked)}
                      />
                    ) : day.hasExam ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`date-${index}`}>التاريخ</Label>
                        <Input
                          id={`date-${index}`}
                          value={day.date || ''}
                          onChange={(e) => updateExamDay(index, 'date', e.target.value)}
                          placeholder="مثال: 25 مايو 2025"
                          disabled={!day.hasExam}
                        />
                      </div>
                      
                      {day.hasExam && (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor={`subject-${index}`}>المادة</Label>
                            <Select
                              value={day.subject || ''}
                              onValueChange={(value) => updateExamDay(index, 'subject', value)}
                              disabled={!day.hasExam}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المادة" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map((subject) => (
                                  <SelectItem key={subject.value} value={subject.value}>
                                    {subject.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`topics-${index}`}>الدروس المقررة</Label>
                            <Textarea
                              id={`topics-${index}`}
                              value={day.topics || ''}
                              onChange={(e) => updateExamDay(index, 'topics', e.target.value)}
                              placeholder="أدخل الدروس المقررة للاختبار"
                              className="resize-none h-20"
                              disabled={!day.hasExam}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : !day.hasExam ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                      لا يوجد اختبار
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="font-medium">التاريخ: <span className="font-normal text-gray-600 dark:text-gray-400">{day.date}</span></p>
                      <p className="font-medium">المادة: <span className="font-normal text-gray-600 dark:text-gray-400">
                        {subjects.find(s => s.value === day.subject)?.label || day.subject}
                      </span></p>
                      {day.topics && (
                        <div>
                          <p className="font-medium mb-1">الدروس المقررة:</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">{day.topics}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}