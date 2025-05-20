import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to Arabic format
export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
    
  return format(dateObj, 'dd MMMM yyyy', { locale: ar });
}

// Convert file size to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file icon based on mime type and subject
export function getFileIcon(mimeType: string, subject?: string): string {
  // إذا كان هناك موضوع محدد، استخدم أيقونة خاصة للمادة
  if (subject) {
    switch(subject) {
      case 'arabic':
        return 'arabic';
      case 'english':
        return 'english';
      case 'math':
        return 'math';
      case 'chemistry':
        return 'chemistry';
      case 'physics':
        return 'physics';
      case 'biology':
        return 'biology';
      case 'constitution':
        return 'constitution';
      case 'islamic':
        return 'islamic';
    }
  }
  
  // إذا لم يكن هناك موضوع، استخدم نوع الملف
  switch (mimeType) {
    case 'application/pdf':
      return 'file-pdf';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'file-word';
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'file-powerpoint';
    default:
      return 'file';
  }
}
