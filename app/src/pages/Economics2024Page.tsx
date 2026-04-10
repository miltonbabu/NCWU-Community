import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRTL } from "@/hooks/useRTL";
import { Calendar, BookOpen, ChevronRight, Home, Users, MapPin, TrendingUp, BarChart3, ArrowRight, Clock } from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";

function Economics2024PageContent() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  useRTL();

  useEffect(() => {
    document.title = `${t("economics2024.title", "Economics 2024")} - NCWU International`;
  }, [t]);

  const features = [
    { icon: Calendar, title: t("economics2024.classSchedule", "Class Schedule"), description: t("economics2024.classScheduleDesc", "View your weekly class timetable") },
    { icon: BookOpen, title: t("economics2024.courseMaterials", "Course Materials"), description: t("economics2024.courseMaterialsDesc", "Access study resources and materials") },
    { icon: TrendingUp, title: t("economics2024.economicAnalysis", "Economic Analysis"), description: t("economics2024.economicAnalysisDesc", "Learn economic theories and applications") },
    { icon: BarChart3, title: t("economics2024.dataStatistics", "Data & Statistics"), description: t("economics2024.dataStatisticsDesc", "Work with economic data and models") },
  ];

  const courses = [
    { code: "ECO201", name: "Finance", credits: 4, description: "Financial principles and practices" },
    { code: "ECO202", name: "International Economics", credits: 3, description: "Global trade and international economic relations" },
    { code: "ECO203", name: "E-Commerce", credits: 3, description: "Electronic commerce and digital business strategies" },
    { code: "ECO204", name: "Accounting", credits: 3, description: "Financial accounting principles and reporting" },
  ];

  return (
    <div className={`min-h-screen chinese-pattern-bg chinese-wave-bg bg-gradient-to-br ${isDark ? "from-slate-900 via-purple-950/30 to-slate-900" : "from-slate-50 via-purple-50/30 to-slate-50"}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 via-transparent to-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:"1s"}} />
      </div>

      <header className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-900/80 border-purple-500/20" : "bg-white/80 border-purple-200/50"} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={ncwuLogo} alt="NCWU Logo" className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 hover:scale-110" />
              <div>
                <h1 className="text-lg font-bold chinese-gradient-text">Economics 2024</h1>
                <p className={`text-xs font-medium ${isDark ? "text-purple-300/60" : "text-purple-700"}`}>Department of Economics - 24 Batch</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="nav-link-chinese text-sm">Home</Link>
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
            <span className={`font-medium ${isDark ? "text-purple-300" : "text-purple-900"}`}>Economics 2024</span>
          </nav>
        </div>
      </div>

      <main className="relative z-10 dragon-phoenix-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-2xl ${isDark ? "bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30" : "bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200"} shadow-xl transition-transform duration-300 hover:scale-105`}>
                <TrendingUp className={`w-16 h-16 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
              </div>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Economics 2024 / 24 Batch</h1>
            <p className={`text-lg max-w-2xl mx-auto mb-6 ${isDark ? "text-white/70" : "text-slate-600"}`}>2026 Academic Year - Class schedules for Economics international students at NCWU (2024/24 batch).</p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 chinese-gradient-text">Class Schedule</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link to="/economics-2024/class-schedule" className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${isDark ? "bg-slate-800 hover:bg-slate-700 border-2 border-purple-500 hover:border-purple-400" : "bg-white hover:bg-purple-50 border-2 border-purple-500 hover:border-purple-600 shadow-lg hover:shadow-xl"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-purple-500`}><Calendar className="w-5 h-5 text-white"/></div>
                    <div><h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Economics 2024</h3></div>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${isDark ? "text-purple-400 group-hover:text-purple-300" : "text-purple-500 group-hover:text-purple-600"} transition-colors`} />
                </div>
                <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Class Schedule for the 2024/24 batch of Economics students.</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-500 text-white"><Calendar className="w-3 h-3"/>2026 Schedule</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-500 text-white"><Clock className="w-3 h-3"/>2024 Batch</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 chinese-gradient-text">Core Courses</h2>
            <div className="grid md:grid-cols-2 gap-6 stagger-animation">
              {courses.map((course, i) => (
                <div key={i} className={`card-chinese p-6 rounded-2xl ${isDark ? "bg-gradient-to-br from-purple-500/5 to-violet-500/5 border border-purple-500/20" : "bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 shadow-md"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700"}`}>{course.code}</span>
                    <span className={`text-sm ${isDark ? "text-white/50" : "text-slate-500"}`}>{course.credits} Credits</span>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{course.name}</h3>
                  <p className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}>{course.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`card-chinese rounded-2xl p-8 ${isDark ? "bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20" : "bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 shadow-md"}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isDark ? "bg-gradient-to-br from-purple-500/20 to-violet-500/20" : "bg-gradient-to-br from-purple-100 to-violet-100"}`}>
                <MapPin className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>About Economics 2024 / 24 Batch</h3>
                <p className={`text-sm ${isDark ? "text-purple-100/60" : "text-slate-600"}`}>The Economics 2024 (24) batch at NCWU represents a cohort of international students pursuing comprehensive programs in finance, accounting, e-commerce, and international economics. This schedule covers core courses including Finance, International Economics, E-Commerce, Accounting, Probability & Statistics, Chinese Culture, and more.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

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

export default function Economics2024Page() {
  return (<ThemeProvider defaultTheme="light" storageKey="ncwu-theme"><Economics2024PageContent /></ThemeProvider>);
}
