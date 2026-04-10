import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronRight, Home, ArrowLeft, Calendar } from "lucide-react";
import { Toaster } from "sonner";
import ncwuLogo from "@/assets/ncwu-logo.png";
import Economics2023AppContentWrapper from "./Economics2023AppContentWrapper";

function Economics2023SchedulePageContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    document.title = "Economics 2023 Class Schedule - NCWU International";
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden chinese-pattern-bg ${isDark ? "bg-slate-900" : "bg-gradient-to-b from-slate-50 to-slate-100"}`}>
      <Toaster position="top-center" toastOptions={{ style: { background: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.9)", backdropFilter:"blur(12px)", color: isDark ? "#fff" : "#1e293b", border: isDark ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(220,38,38,0.3)" }}} />

      <header className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-950/80 border-red-500/20" : "bg-white/80 border-amber-200"} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={ncwuLogo} alt="NCWU Logo" className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 hover:scale-110"/>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold chinese-gradient-text">Economics 2023</h1>
                <p className={`text-xs font-medium ${isDark ? "text-red-300/60" : "text-red-700"}`}>2026 Academic Year - Class Schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/economics-2023" className="nav-link-chinese hidden sm:block text-sm">Economics 2023</Link>
              <Link to="/" className="nav-link-chinese hidden sm:block text-sm">Home</Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className={`relative z-10 border-b ${isDark ? "border-red-500/10 bg-red-500/5" : "border-amber-200 bg-amber-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="nav-link-chinese flex items-center gap-1"><Home className="w-4 h-4"/><span>Home</span></Link>
            <ChevronRight className={`w-4 h-4 ${isDark ? "text-red-500/40" : "text-amber-400"}`} />
            <Link to="/economics-2023" className="nav-link-chinese">Economics 2023</Link>
            <ChevronRight className={`w-4 h-4 ${isDark ? "text-red-500/40" : "text-amber-400"}`} />
            <span className={`font-medium ${isDark ? "text-red-300" : "text-red-900"}`}>Class Schedule</span>
          </nav>
        </div>
      </div>

      <main className="relative z-10 dragon-phoenix-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Economics 2023 / 23 Batch — Class Schedule</h1>
            <p className={`text-sm max-w-xl mx-auto mb-5 ${isDark ? "text-white/60" : "text-slate-500"}`}>Weekly class timetable for Economics international students (2023/23 batch)</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/economics-2023" className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/40">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Overview
              </Link>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${isDark ? "bg-red-500/15 text-red-300" : "bg-red-100 text-red-700"}`}>
                <Calendar className="w-3 h-3" /> 23 Batch
              </span>
            </div>
          </div>

          <Economics2023AppContentWrapper />
        </div>
      </main>

      <footer className={`relative z-10 border-t ${isDark ? "border-red-500/20 bg-red-500/5" : "border-amber-200 bg-amber-50/50"} mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={ncwuLogo} alt="NCWU Logo" className="w-8 h-8 rounded-lg object-contain"/>
              <p className={`text-sm ${isDark ? "text-red-300/50" : "text-red-700"}`}>NCWU International Student Community</p>
            </div>
            <p className={`text-sm ${isDark ? "text-red-400/40" : "text-red-600"}`}>© 2024 NCWU. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Economics2023SchedulePage() {
  return (<ThemeProvider defaultTheme="light" storageKey="ncwu-theme"><Economics2023SchedulePageContent /></ThemeProvider>);
}
