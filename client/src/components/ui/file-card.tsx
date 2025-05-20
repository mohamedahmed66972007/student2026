import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFileIcon, formatFileSize, formatDate } from "@/lib/utils";
import { FileWithUrl } from "@/types";
import { Download, Eye, Clock } from "lucide-react";
import { subjectOptions, semesterOptions } from "@/types";

interface FileCardProps {
  file: FileWithUrl;
}

export function FileCard({ file }: FileCardProps) {
  const subjectLabel = subjectOptions.find(option => option.value === file.subject)?.label || file.subject;
  const semesterLabel = semesterOptions.find(option => option.value === file.semester)?.label || file.semester;
  const fileIcon = getFileIcon(file.mimeType, file.subject);
  
  // تحديد رمز المادة الخاص بكل مادة
  const getSubjectEmoji = (subject: string) => {
    switch(subject) {
      case 'arabic': return '📚';
      case 'english': return '🔤';
      case 'math': return '📐';
      case 'chemistry': return '🧪';
      case 'physics': return '⚛️';
      case 'biology': return '🧬';
      case 'constitution': return '📜';
      case 'islamic': return '☪️';
      default: return '📄';
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-none bg-white dark:bg-gray-900 shadow-sm">
      <div className="relative h-48 bg-gradient-to-tr from-primary/5 to-primary/20 dark:from-primary/10 dark:to-primary/30 flex items-center justify-center">
        <div className="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md">
          <span className="text-3xl">{getSubjectEmoji(file.subject)}</span>
        </div>
        <div className="absolute top-3 left-3 flex space-x-2 rtl:space-x-reverse">
          <Badge variant="secondary" className="bg-white/90 text-primary-foreground dark:bg-gray-800/90 dark:text-gray-200">
            {subjectLabel}
          </Badge>
          <Badge variant="outline" className="bg-white/90 dark:bg-gray-800/90">
            {semesterLabel}
          </Badge>
        </div>
      </div>
      <CardHeader className="px-4 pt-3 pb-2">
        <div className="font-semibold text-lg text-gray-800 dark:text-gray-100 line-clamp-2 h-12">
          {file.title}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-1">
          <Clock className="h-3 w-3 ml-1 mt-0.5" />
          <span>{formatDate(file.uploadDate)}</span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          الحجم: {formatFileSize(file.fileSize)}
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-1 pb-4 flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-primary text-primary hover:bg-primary/10"
          asChild
        >
          <a href={`/uploads/${file.fileName}`} target="_blank" rel="noopener noreferrer">
            <Eye className="h-4 w-4 ml-1" />
            عرض
          </a>
        </Button>
        <Button 
          size="sm"
          asChild
        >
          <a href={file.downloadUrl} download={file.originalName}>
            <Download className="h-4 w-4 ml-1" />
            تنزيل
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}