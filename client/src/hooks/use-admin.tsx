import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const { data, isLoading } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ["/api/check-auth"],
    onSuccess: (data) => {
      setIsAdmin(data.isAuthenticated);
    },
    onError: () => {
      setIsAdmin(false);
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("POST", "/api/login", credentials);
    },
    onSuccess: () => {
      setIsAdmin(true);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "تم تسجيل دخولك كمشرف",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-auth"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الدخول",
        description: "تأكد من صحة اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setIsAdmin(false);
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-auth"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  
  return context;
}
