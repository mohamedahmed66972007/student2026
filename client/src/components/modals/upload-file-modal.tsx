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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";
import { subjectOptions, semesterOptions } from "@/types";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadFileModal({ isOpen, onClose }: UploadFileModalProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/files", undefined, {
        body: formData,
        headers: {},
      });
    },
    onSuccess: () => {
      toast({
        title: "تم رفع الملف بنجاح",
        description: "تم إضافة الملف بنجاح للمنصة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل رفع الملف",
        description: error.message || "حدث خطأ أثناء رفع الملف",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار ملف للرفع",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("semester", semester);
    formData.append("file", selectedFile);
    
    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setSemester("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">رفع ملف جديد</DialogTitle>
          <DialogDescription className="text-center">
            أضف ملفًا جديدًا للطلاب
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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileTitle">عنوان الملف</Label>
              <Input
                id="fileTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileSubject">المادة</Label>
              <Select
                value={subject}
                onValueChange={setSubject}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.filter(option => option.value !== 'all').map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileSemester">الفصل الدراسي</Label>
              <Select
                value={semester}
                onValueChange={setSemester}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.filter(option => option.value !== 'all').map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileUpload">الملف</Label>
              <Input
                id="fileUpload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx"
              />
              <p className="text-xs text-muted-foreground">
                الأنواع المدعومة: PDF, DOCX, PPTX (الحد الأقصى 10MB)
              </p>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                جاري الرفع...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                رفع الملف
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
