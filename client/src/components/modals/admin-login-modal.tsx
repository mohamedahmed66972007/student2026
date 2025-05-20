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
import { useAdmin } from "@/hooks/use-admin";
import { X } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login(username, password);
      onClose();
    } catch (error) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">تسجيل دخول المشرف</DialogTitle>
          <DialogDescription className="text-center">
            فقط المشرفون المعتمدون يمكنهم الدخول
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
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            تسجيل الدخول
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
