import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronRight, Home } from "lucide-react";
import { Toaster } from "sonner";
import ncwuLogo from "@/assets/ncwu-logo.png";
import {
  StudentVerification,
  isStudentVerified,
} from "@/components/StudentVerification";
import { useAuth } from "@/contexts/AuthContext";

import AppContent from "./AppContentWrapper";

function ClassSchedulePageContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const isAdmin =
    isAuthenticated &&
    user &&
    (user.role === "admin" || user.role === "superadmin" || user.is_admin);
  const isCST2023Student =
    isAuthenticated &&
    user &&
    user.department === "Computer Science & Technology" &&
    user.enrollment_year === 2023;

  const [isVerified, setIsVerified] = useState(() => {
    if (isAdmin || isCST2023Student) return true;
    return isStudentVerified();
  });
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVerified(isAdmin || isCST2023Student || isStudentVerified());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckingAuth(false);
    document.title = "CS 2023 Class Schedule - NCWU International";
  }, [isAuthenticated, user, authLoading, isAdmin, isCST2023Student]);

  const handleVerified = () => {
    setIsVerified(true);
  };

  if (checkingAuth) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-12 h-12 border-4 ${isDark ? "border-red-500/30 border-t-red-500" : "border-red-200 border-t-red-500"} rounded-full animate-spin`}
          />
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <StudentVerification isDark={isDark} onVerified={handleVerified} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden chinese-pattern-bg ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDark
              ? "rgba(15, 23, 42, 0.9)"
              : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            color: isDark ? "#fff" : "#1e293b",
            border: isDark
              ? "1px solid rgba(220, 38, 38, 0.2)"
              : "1px solid rgba(220, 38, 38, 0.3)",
          },
        }}
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-red-500/5 to-amber-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-red-500/5 to-amber-500/5 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-amber-500/5 to-red-500/5 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <header
        className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-950/80 border-red-500/20" : "bg-white/80 border-amber-200"} border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src={ncwuLogo}
                alt="NCWU Logo"
                className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 hover:scale-110"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold chinese-gradient-text">
                  CS 2023
                </h1>
                <p
                  className={`text-xs font-medium ${isDark ? "text-red-300/60" : "text-red-700"}`}
                >
                  2026 2nd Semester Schedule
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/cst"
                className="nav-link-chinese hidden sm:block text-sm"
              >
                CS 2023
              </Link>
              <Link to="/" className="nav-link-chinese hidden sm:block text-sm">
                Home
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div
        className={`relative z-10 border-b ${isDark ? "border-red-500/10 bg-red-500/5" : "border-amber-200 bg-amber-50"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="nav-link-chinese flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <ChevronRight
              className={`w-4 h-4 ${isDark ? "text-red-500/40" : "text-amber-400"}`}
            />
            <Link to="/cst" className="nav-link-chinese">
              CS 2023
            </Link>
            <ChevronRight
              className={`w-4 h-4 ${isDark ? "text-red-500/40" : "text-amber-400"}`}
            />
            <span
              className={`font-medium ${isDark ? "text-red-300" : "text-red-900"}`}
            >
              Class Schedule
            </span>
          </nav>
          <nav className="flex items-center gap-4 text-sm mt-2">
            <Link to="/social" className="nav-link-chinese hover:opacity-80 transition-opacity">
              Social
            </Link>
            <Link to="/hsk" className="nav-link-chinese hover:opacity-80 transition-opacity">
              HSK
            </Link>
            <Link to="/hsk-2026" className="nav-link-chinese hover:opacity-80 transition-opacity">
              HSK 2026
            </Link>
            <Link to="/xingyuan-ai" className="nav-link-chinese hover:opacity-80 transition-opacity">
              AI
            </Link>
            <Link to="/pdf-tools" className="nav-link-chinese hover:opacity-80 transition-opacity">
              PDF Tools
            </Link>
          </nav>
        </div>
      </div>

      <AppContent />

      <footer
        className={`relative z-10 border-t ${isDark ? "border-red-500/20 bg-red-500/5" : "border-amber-200 bg-amber-50/50"} mt-12`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={ncwuLogo}
                alt="NCWU Logo"
                className="w-8 h-8 rounded-lg object-contain transition-transform duration-300 hover:scale-110"
              />
              <p
                className={`text-sm ${isDark ? "text-red-300/50" : "text-red-700"}`}
              >
                NCWU International Student Community
              </p>
            </div>
            <p
              className={`text-sm ${isDark ? "text-red-400/40" : "text-red-600"}`}
            >
              © 2024 NCWU. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClassSchedulePage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="cst26-theme">
      <ClassSchedulePageContent />
    </ThemeProvider>
  );
}
