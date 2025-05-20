import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash, Plus, X, Save } from "lucide-react";
import { ExamRow } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamRow[];
}

export function ExamScheduleModal({ isOpen, onClose, exams }: ExamScheduleModalProps) {
  const [examRows, setExamRows] = useState<ExamRow[]>(exams.length ? [...exams] : [{
    subject: '',
    date: '',
    time: '',
    room: '',
    notes: ''
  }]);
  
  const { toast } = useToast();

  const examMutation = useMutation({
    mutationFn: async (data: ExamRow[]) => {
      return await apiRequest("POST", "/api/exams", data);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث جدول الاختبارات",
        description: "تم تحديث جدول الاختبارات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تحديث الجدول",
        description: error.message || "حدث خطأ أثناء تحديث جدول الاختبارات",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const hasEmptyFields = examRows.some(row => 
      !row.subject || !row.date || !row.time || !row.room
    );
    
    if (hasEmptyFields) {
      toast({
        title: "بيانات غير مكتملة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    examMutation.mutate(examRows);
  };

  const addNewRow = () => {
    setExamRows([...examRows, {
      subject: '',
      date: '',
      time: '',
      room: '',
      notes: ''
    }]);
  };

  const removeRow = (index: number) => {
    if (examRows.length > 1) {
      const updatedRows = [...examRows];
      updatedRows.splice(index, 1);
      setExamRows(updatedRows);
    } else {
      toast({
        title: "تنبيه",
        description: "يجب أن يكون هناك صف واحد على الأقل في الجدول",
        variant: "destructive",
      });
    }
  };

  const updateRow = (index: number, field: keyof ExamRow, value: string) => {
    const updatedRows = [...examRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setExamRows(updatedRows);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">تحديث جدول الاختبارات</DialogTitle>
          <DialogDescription className="text-center">
            أضف أو عدّل مواعيد الاختبارات
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
        
        <div className="mb-4 text-center">
          <Button
            variant="outline"
            onClick={addNewRow}
            className="bg-secondary text-white hover:bg-secondary/90"
          >
            <Plus className="h-4 w-4 ml-1" />
            إضافة صف جديد
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {examRows.map((row, index) => (
                <div key={index} className="exam-row border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-sm">المادة</Label>
                      <Input
                        value={row.subject}
                        onChange={(e) => updateRow(index, 'subject', e.target.value)}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">التاريخ</Label>
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(index, 'date', e.target.value)}
                        required
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-sm">الوقت</Label>
                      <Input
                        type="time"
                        value={row.time}
                        onChange={(e) => updateRow(index, 'time', e.target.value)}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">القاعة</Label>
                      <Input
                        value={row.room}
                        onChange={(e) => updateRow(index, 'room', e.target.value)}
                        required
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">ملاحظات</Label>
                    <Input
                      value={row.notes || ''}
                      onChange={(e) => updateRow(index, 'notes', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/10"
                    onClick={() => removeRow(index)}
                  >
                    <Trash className="h-4 w-4 ml-1" />
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <Button 
            type="submit" 
            className="w-full mt-4"
            disabled={examMutation.isPending}
          >
            {examMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                جاري الحفظ...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                حفظ جدول الاختبارات
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
