import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRTL } from "@/hooks/useRTL";
import {
  Calendar,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Home,
  Users,
  Clock,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";
import type { DepartmentConfig } from "./createDepartmentPage";

interface DepartmentPageProps {
  config: DepartmentConfig;
}

function DepartmentPageContent({ config }: DepartmentPageProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  useRTL();

  const title = t(config.titleKey);
  const fullName = t(config.fullNameKey);
  const description = t(config.descriptionKey);

  useEffect(() => {
    document.title = `${title} - NCWU International`;
  }, [title]);

  const IconComponent = config.icon;

  const batches = [
    {
      title: title,
      description: t(
        "dept.scheduleDescription",
        `Class Schedule for the ${config.year} batch of ${fullName} students - ${new Date().getFullYear()} Academic Year.`,
        { year: config.year, fullName, currentYear: new Date().getFullYear() },
      ),
      link: config.scheduleLink,
      semester: t("dept.semester", `${new Date().getFullYear()} Schedule`, {
        year: new Date().getFullYear(),
      }),
      year: t("dept.yearBatch", `${config.year} Batch`, { year: config.year }),
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: t("dept.weeklySchedule", "Weekly Schedule"),
      description: t(
        "dept.weeklyScheduleDesc",
        "View classes organized by day and time",
      ),
    },
    {
      icon: BookOpen,
      title: t("dept.subjectDetails", "Subject Details"),
      description: t(
        "dept.subjectDetailsDesc",
        "Access detailed information for each subject",
      ),
    },
    {
      icon: Clock,
      title: t("dept.timeManagement", "Time Management"),
      description: t("dept.timeManagementDesc", "Plan your week effectively"),
    },
    {
      icon: Users,
      title: t("dept.classInformation", "Class Information"),
      description: t(
        "dept.classInformationDesc",
        "Know your classmates and teachers",
      ),
    },
  ];

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"} transition-colors duration-300`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
          isDark
            ? "bg-slate-900/80 border-white/10"
            : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-white/10 text-slate-300"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t("common.backToHome", "Home")}
              </span>
            </Link>
            <ChevronRight
              className={`w-4 h-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}
            />
            <span
              className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 ${config.gradient}`}
          />
          <div
            className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 ${config.gradient}`}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div
                  className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg`}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDark
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t("dept.yearBatch", `${config.year} Batch`, {
                    year: config.year,
                  })}
                </span>
              </div>
              <h1
                className={`text-4xl sm:text-5xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </h1>
              <p
                className={`text-lg mb-8 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {description}
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  to={config.scheduleLink}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${config.gradient} shadow-lg hover:shadow-xl transition-all`}
                >
                  <Calendar className="w-5 h-5" />
                  {t("common.viewSchedule", "View Schedule")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/language-exchange"
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold ${
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  } transition-colors`}
                >
                  <Users className="w-5 h-5" />
                  {t("nav.languageExchange", "Language Exchange")}
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div
                className={`w-64 h-64 rounded-3xl bg-gradient-to-br ${config.gradient} p-1 shadow-2xl`}
              >
                <div
                  className={`w-full h-full rounded-3xl flex items-center justify-center ${
                    isDark ? "bg-slate-900" : "bg-white"
                  }`}
                >
                  <IconComponent className={`w-32 h-32 ${config.color}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className={`text-2xl font-bold mb-8 text-center ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("dept.whatYouFind", "What You'll Find")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
                  isDark
                    ? "bg-slate-800/50 border-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${config.gradient}`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3
                  className={`font-semibold mb-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Batches Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className={`text-2xl font-bold mb-8 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("dept.classSchedule", "Class Schedules")}
          </h2>
          <div className="grid gap-6">
            {batches.map((batch, index) => (
              <Link
                key={index}
                to={batch.link}
                className={`group p-6 rounded-2xl border transition-all hover:shadow-lg ${
                  isDark
                    ? "bg-slate-800/50 border-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isDark
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {batch.semester}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isDark
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {batch.year}
                      </span>
                    </div>
                    <h3
                      className={`text-lg font-semibold mb-1 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {batch.title}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {batch.description}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient} group-hover:shadow-lg transition-shadow`}
                  >
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`py-8 border-t ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={ncwuLogo} alt="NCWU Logo" className="w-8 h-8" />
            <span
              className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              NCWU International
            </span>
          </div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            © {new Date().getFullYear()}{" "}
            {t("footer.rights", "All rights reserved")} -{" "}
            {t("footer.community", "NCWU International Student Community")}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default DepartmentPageContent;
