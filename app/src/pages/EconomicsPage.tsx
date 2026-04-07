import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRTL } from "@/hooks/useRTL";
import {
  Calendar,
  BookOpen,
  ChevronRight,
  Home,
  Users,
  MapPin,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Clock,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";

function EconomicsPageContent() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  useRTL();

  useEffect(() => {
    document.title = `${t("economics.title", "Economics 2025")} - NCWU International`;
  }, [t]);

  const features = [
    {
      icon: Calendar,
      title: t("economics.classSchedule", "Class Schedule"),
      description: t("economics.classScheduleDesc", "View your weekly class timetable"),
    },
    {
      icon: BookOpen,
      title: t("economics.courseMaterials", "Course Materials"),
      description: t("economics.courseMaterialsDesc", "Access study resources and materials"),
    },
    {
      icon: TrendingUp,
      title: t("economics.economicAnalysis", "Economic Analysis"),
      description: t("economics.economicAnalysisDesc", "Learn economic theories and applications"),
    },
    {
      icon: BarChart3,
      title: t("economics.dataStatistics", "Data & Statistics"),
      description: t("economics.dataStatisticsDesc", "Work with economic data and models"),
    },
  ];

  const courses = [
    {
      code: "ECON101",
      name: "Principles of Economics",
      credits: 4,
      description: "Introduction to fundamental economic concepts and theories",
    },
    {
      code: "ECON201",
      name: "Microeconomics",
      credits: 3,
      description: "Study of individual economic units and market structures",
    },
    {
      code: "ECON202",
      name: "Macroeconomics",
      credits: 3,
      description: "Analysis of national and global economic systems",
    },
    {
      code: "ECON301",
      name: "International Economics",
      credits: 3,
      description: "Global trade, finance, and economic policies",
    },
  ];

  const batches = [
    {
      title: t("economics.title", "Economics 2025"),
      description: t("economics.scheduleDescription", "Class Schedule for the 2025 batch of Economics students."),
      link: "/economics-2025/class-schedule",
      semester: t("economics.semester", "2025 Schedule"),
      year: t("economics.year", "2025 Batch"),
    },
  ];

  return (
    <div
      className={`min-h-screen chinese-pattern-bg chinese-wave-bg bg-gradient-to-br ${isDark ? "from-slate-900 via-sky-950/30 to-slate-900" : "from-slate-50 via-sky-50/30 to-slate-50"}`}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-sky-500/10 via-transparent to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-sky-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-cyan-500/5 to-sky-500/5 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <header
        className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-900/80 border-sky-500/20" : "bg-white/80 border-sky-200/50"} border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src={ncwuLogo}
                alt="NCWU Logo"
                className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 hover:scale-110"
              />
              <div>
                <h1 className={`text-lg font-bold chinese-gradient-text`}>
                  Economics 2025
                </h1>
                <p
                  className={`text-xs font-medium ${isDark ? "text-red-300/60" : "text-red-700"}`}
                >
                  Department of Economics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="nav-link-chinese text-sm">
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
            <span
              className={`font-medium ${isDark ? "text-red-300" : "text-red-900"}`}
            >
              Economics 2025
            </span>
          </nav>
        </div>
      </div>

      <main className="relative z-10 dragon-phoenix-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div
                className={`p-4 rounded-2xl ${isDark ? "bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30" : "bg-gradient-to-br from-red-100 to-amber-100 border border-red-200"} shadow-xl transition-transform duration-300 hover:scale-105`}
              >
                <TrendingUp
                  className={`w-16 h-16 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
              </div>
            </div>
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Economics Department
            </h1>
            <p
              className={`text-lg max-w-2xl mx-auto mb-6 ${isDark ? "text-white/70" : "text-slate-600"}`}
            >
              2025 Academic Year - Class schedules, resources, and information
              for Economics international students at NCWU.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                  isDark
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                <Calendar className="w-4 h-4" />
                2025 Batch
              </span>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                  isDark
                    ? "bg-pink-500/20 text-pink-300"
                    : "bg-pink-100 text-pink-700"
                }`}
              >
                <Users className="w-4 h-4" />
                International Students
              </span>
            </div>
          </div>

          <div className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 chinese-gradient-text`}>
              Class Schedule
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {batches.map((batch, index) => (
                <Link
                  key={index}
                  to={batch.link}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 border-2 border-red-500 hover:border-red-400"
                      : "bg-white hover:bg-red-50 border-2 border-red-500 hover:border-red-600 shadow-lg hover:shadow-xl"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isDark ? "bg-red-500" : "bg-red-500"}`}>
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {batch.title}
                        </h3>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 ${isDark ? "text-red-400 group-hover:text-red-300" : "text-red-500 group-hover:text-red-600"} transition-colors`}
                    />
                  </div>
                  <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {batch.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                      isDark ? "bg-red-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      <Calendar className="w-3 h-3" />
                      {batch.semester}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                      isDark ? "bg-amber-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {batch.year}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 chinese-gradient-text`}>
              Quick Access
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`card-chinese p-6 rounded-2xl ${
                      isDark
                        ? "bg-gradient-to-br from-red-500/5 to-amber-500/5 border border-red-500/20"
                        : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl w-fit mb-4 transition-transform duration-300 hover:scale-110 ${
                        isDark
                          ? "bg-gradient-to-br from-red-500/20 to-amber-500/20"
                          : "bg-gradient-to-br from-red-100 to-amber-100"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isDark ? "text-red-400" : "text-red-600"}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                    >
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 chinese-gradient-text`}>
              Sample Courses
            </h2>
            <div className="grid md:grid-cols-2 gap-6 stagger-animation">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className={`card-chinese p-6 rounded-2xl ${
                    isDark
                      ? "bg-gradient-to-br from-red-500/5 to-amber-500/5 border border-red-500/20"
                      : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span
                        className={`text-xs font-mono px-2 py-1 rounded ${
                          isDark
                            ? "bg-red-500/20 text-red-300"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {course.code}
                      </span>
                    </div>
                    <span
                      className={`text-sm ${isDark ? "text-white/50" : "text-slate-500"}`}
                    >
                      {course.credits} Credits
                    </span>
                  </div>
                  <h3
                    className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {course.name}
                  </h3>
                  <p
                    className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}
                  >
                    {course.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`card-chinese rounded-2xl p-8 ${isDark ? "bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/20" : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl transition-transform duration-300 hover:scale-110 ${isDark ? "bg-gradient-to-br from-red-500/20 to-amber-500/20" : "bg-gradient-to-br from-red-100 to-amber-100"}`}
              >
                <MapPin
                  className={`w-6 h-6 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  About Economics Department
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                >
                  The Economics Department at NCWU provides comprehensive
                  education in economic theory, quantitative methods, and
                  applied economics. Our program prepares international students
                  for careers in finance, government, research, and
                  international organizations. Students gain practical skills in
                  data analysis, economic modeling, and policy evaluation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

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

export default function EconomicsPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <EconomicsPageContent />
    </ThemeProvider>
  );
}
