import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileCard } from "@/components/ui/file-card";
import { File } from "@shared/schema";
import { FileWithUrl } from "@/types";
import { Loader2, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function LatestFilesSection() {
  const { data: files, isLoading, error } = useQuery<File[]>({
    queryKey: ["/api/files/latest"],
    queryFn: async () => {
      const res = await fetch("/api/files/latest?limit=3");
      if (!res.ok) {
        throw new Error('فشل في استرجاع أحدث الملفات');
      }
      return res.json();
    }
  });

  const filesWithUrls: FileWithUrl[] = files ? files.map(file => ({
    ...file,
    downloadUrl: `/api/download/${file.id}`
  })) : [];

  return (
    <section className="mb-12 pt-2">
      <div className="bg-gradient-to-r from-primary to-primary-foreground/90 rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">أهم الملفات الحديثة لدفعة 2026</h1>
          <p className="text-white/90 text-lg mb-6">منصة الملفات التعليمية للصف الثاني عشر</p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link href="#files">
                <FileIcon className="h-5 w-5 ml-2" />
                استعراض جميع الملفات
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-transparent border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="#quizzes">
                الاختبارات التفاعلية
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>حدث خطأ أثناء تحميل الملفات. الرجاء المحاولة مرة أخرى.</p>
        </div>
      ) : filesWithUrls.length > 0 ? (
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 text-center">أحدث الملفات المضافة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filesWithUrls.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/10"
              asChild
            >
              <Link href="#files">
                عرض المزيد من الملفات
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p>لا توجد ملفات متاحة حاليًا</p>
        </div>
      )}
    </section>
  );
}