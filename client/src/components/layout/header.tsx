import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAdmin } from "@/hooks/use-admin";
import { Sun, Moon, Shield } from "lucide-react";
import { useState } from "react";
import { AdminLoginModal } from "@/components/modals/admin-login-modal";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, logout } = useAdmin();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleAdminAction = () => {
    if (isAdmin) {
      logout();
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <header className="bg-primary dark:bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-white text-xl md:text-2xl font-bold">دفعة 2026</h1>
          <span className="text-accent text-sm md:text-base">منصة الملفات التعليمية</span>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-white hover:text-white hover:bg-primary-foreground/10"
          >
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleAdminAction}
            className="bg-secondary hover:bg-secondary-foreground/90 text-black dark:text-white"
          >
            <Shield className="h-4 w-4 ml-1" />
            {isAdmin ? "تسجيل الخروج" : "دخول المشرف"}
          </Button>
        </div>
      </div>
      <AdminLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
}
