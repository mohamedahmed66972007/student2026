import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileCard } from "@/components/ui/file-card";
import { Upload, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAdmin } from "@/hooks/use-admin";
import { UploadFileModal } from "@/components/modals/upload-file-modal";
import { File } from "@shared/schema";
import { FileWithUrl, subjectOptions, semesterOptions } from "@/types";
import { Loader2 } from "lucide-react";

export function FilesSection() {
  const { isAdmin } = useAdmin();
  const [subject, setSubject] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: files, isLoading, error } = useQuery<File[]>({
    queryKey: ["/api/files", subject, semester],
    queryFn: async () => {
      const url = `/api/files?${subject !== 'all' ? `subject=${subject}` : ''}${subject !== 'all' && semester !== 'all' ? '&' : ''}${semester !== 'all' ? `semester=${semester}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch files');
      }
      return res.json();
    }
  });

  const filesWithUrls: FileWithUrl[] = files ? files.map(file => ({
    ...file,
    downloadUrl: `/api/download/${file.id}`
  })) : [];

  return (
    <section id="files" className="mb-10 pt-4">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-primary">الملفات الدراسية</h2>
        {isAdmin && (
          <div>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-secondary hover:bg-secondary-foreground/90 text-white"
            >
              <Upload className="h-4 w-4 ml-1" />
              رفع ملف جديد
            </Button>
          </div>
        )}
      </div>

      {/* File Filters */}
      <Card className="p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">تصفية الملفات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subjectFilter">المادة</Label>
            <Select
              value={subject}
              onValueChange={setSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="جميع المواد" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="semesterFilter">الفصل الدراسي</Label>
            <Select
              value={semester}
              onValueChange={setSemester}
            >
              <SelectTrigger>
                <SelectValue placeholder="جميع الفصول" />
              </SelectTrigger>
              <SelectContent>
                {semesterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Files List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p>حدث خطأ أثناء تحميل الملفات. الرجاء المحاولة مرة أخرى.</p>
        </div>
      ) : filesWithUrls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filesWithUrls.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>لا توجد ملفات مطابقة لعوامل التصفية المحددة</p>
        </div>
      )}

      <UploadFileModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </section>
  );
}
