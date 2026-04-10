import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronRight, Home } from "lucide-react";
import { Toaster } from "sonner";
import ncwuLogo from "@/assets/ncwu-logo.png";
import Economics2024AppContentWrapper from "./Economics2024AppContentWrapper";
import { EconomicsStudentVerification, isEconomicsStudentVerified } from "@/components/EconomicsStudentVerification";
import { useAuth } from "@/contexts/AuthContext";

function Economics2024SchedulePageContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'superadmin' || user.is_admin);
  const isEconomics2024Student = isAuthenticated && user && user.department === 'Economics' && user.enrollment_year === 2024;

  const [isVerified, setIsVerified] = useState(() => (isAdmin || isEconomics2024Student || isEconomicsStudentVerified()));
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    document.title = "Economics 2024 Class Schedule - NCWU International";
    setIsVerified(isAdmin || isEconomics2024Student || isEconomicsStudentVerified());
    setIsChecking(false);
  }, [isAuthenticated, user, authLoading, isAdmin, isEconomics2024Student]);

  if (isChecking) {
    return (<div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"/></div>);
  }

  return (
    <div className={`min-h-screen relative overflow-hidden chinese-pattern-bg ${isDark ? "bg-slate-900" : "bg-gradient-to-b from-slate-50 to-slate-100"}`}>
      {!isVerified && <EconomicsStudentVerification isDark={isDark} onVerified={() => setIsVerified(true)} />}
      <Toaster position="top-center" toastOptions={{ style: { background: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.9)", backdropFilter:"blur(12px)", color: isDark ? "#fff" : "#1e293b", border: isDark ? "1px solid rgba(147,51,234,0.2)" : "1px solid rgba(147,51,234,0.3)" }}} />

      <header className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-950/80 border-purple-500/20" : "bg-white/80 border-purple-200"} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={ncwuLogo} alt="NCWU Logo" className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 hover:scale-110"/>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold chinese-gradient-text">Economics 2024</h1>
                <p className={`text-xs font-medium ${isDark ? "text-purple-300/60" : "text-purple-700"}`}>2026 Academic Year - Class Schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/economics-2024" className="nav-link-chinese hidden sm:block text-sm">Economics 2024</Link>
              <Link to="/" className="nav-link-chinese hidden sm:block text-sm">Home</Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className={`relative z-10 border-b ${isDark ? "border-purple-500/10 bg-purple-500/5" : "border-purple-200 bg-purple-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="nav-link-chinese flex items-center gap-1"><Home className="w-4 h-4"/><span>Home</span></Link>
            <ChevronRight className={`w-4 h-4 ${isDark ? "text-purple-500/40" : "text-purple-400"}`} />
            <Link to="/economics-2024" className="nav-link-chinese">Economics 2024</Link>
            <ChevronRight className={`w-4 h-4 ${isDark ? "text-purple-500/40" : "text-purple-400"}`} />
            <span className={`font-medium ${isDark ? "text-purple-300" : "text-purple-900"}`}>Class Schedule</span>
          </nav>
        </div>
      </div>

      <Economics2024AppContentWrapper />

      <footer className={`relative z-10 border-t ${isDark ? "border-purple-500/20 bg-purple-500/5" : "border-purple-200 bg-purple-50/50"} mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={ncwuLogo} alt="NCWU Logo" className="w-8 h-8 rounded-lg object-contain"/>
              <p className={`text-sm ${isDark ? "text-purple-300/50" : "text-purple-700"}`}>NCWU International Student Community</p>
            </div>
            <p className={`text-sm ${isDark ? "text-purple-400/40" : "text-purple-600"}`}>© 2024 NCWU. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Economics2024SchedulePage() {
  return (<ThemeProvider defaultTheme="light" storageKey="ncwu-theme"><Economics2024SchedulePageContent /></ThemeProvider>);
}
