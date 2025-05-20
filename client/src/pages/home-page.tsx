import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MainNav } from "@/components/layout/main-nav";
import { FilesSection } from "@/components/sections/files-section";
import { ExamsSection } from "@/components/sections/exams-section";
import { QuizzesSection } from "@/components/sections/quizzes-section";
import { LatestFilesSection } from "@/components/sections/latest-files-section";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function HomePage() {
  const [location, setLocation] = useLocation();
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  
  // التمرير إلى القسم المطلوب عند تغيير الهاش
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <Header />
      <MainNav />
      <main className="flex-grow container mx-auto px-4 py-6">
        <LatestFilesSection />
        <FilesSection />
        <QuizzesSection />
        <ExamsSection />
      </main>
      <Footer />
    </div>
  );
}
