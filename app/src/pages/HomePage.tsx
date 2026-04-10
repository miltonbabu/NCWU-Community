import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { SocialFeedSection } from "@/components/SocialFeedSection";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import HomeEventsSection from "@/components/HomeEventsSection";
import HomeMarketSection from "@/components/HomeMarketSection";
import HomePhotoGallerySection from "@/components/HomePhotoGallerySection";
import { useRTL } from "@/hooks/useRTL";
import {
  Calendar,
  BookOpen,
  Users,
  Globe,
  ArrowRight,
  Clock,
  MapPin,
  AlertTriangle,
  Bell,
  Smartphone,
  Car,
  CreditCard,
  Building2,
  Zap,
  Cog,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import heroImage2 from "@/assets/hero-image-2.jpg";

function HomePageContent() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  useRTL();

  useEffect(() => {
    document.title = "NCWU International - Student Community";
  }, []);

  const huashuiAiLink = "/xingyuan-ai";

  const sections = [
    {
      title: t("home.cstTitle", "Computer Science & Technology"),
      description: t(
        "home.cstDesc",
        "CST class schedules, resources, and academic information. Access your course timetables, lab sessions, and department announcements.",
      ),
      icon: BookOpen,
      link: "/cst",
      color: "from-blue-500 to-cyan-500",
      stats: "Undergraduate • 2023",
      bgColor: isDark
        ? "bg-blue-600 hover:bg-blue-500 border-blue-400"
        : "bg-blue-500 hover:bg-blue-600 border-blue-400",
      iconBg: "from-blue-400 to-cyan-400",
    },
    {
      title: t("home.economicsTitle", "Economics"),
      description: t(
        "home.economicsDesc",
        "Economics department schedules and resources. View your class timetables, exam schedules, and academic materials.",
      ),
      icon: Calendar,
      link: "/economics-2025",
      color: "from-purple-500 to-pink-500",
      stats: "Undergraduate • 2025",
      bgColor: isDark
        ? "bg-purple-600 hover:bg-purple-500 border-purple-400"
        : "bg-purple-500 hover:bg-purple-600 border-purple-400",
      iconBg: "from-purple-400 to-pink-400",
    },
    {
      title: t("home.civil23Title", "Civil Engineering 2023"),
      description: t(
        "home.civil23Desc",
        "Civil Engineering 2023 class schedules, lab sessions, and department resources.",
      ),
      icon: Building2,
      link: "/civil-engineering-2023",
      color: "from-amber-500 to-orange-500",
      stats: "Undergraduate • 2023",
      bgColor: isDark
        ? "bg-amber-600 hover:bg-amber-500 border-amber-400"
        : "bg-amber-500 hover:bg-amber-600 border-amber-400",
      iconBg: "from-amber-400 to-orange-400",
    },
    {
      title: t("home.civil24Title", "Civil Engineering 2024"),
      description: t(
        "home.civil24Desc",
        "Civil Engineering 2024 class schedules, lab sessions, and department resources.",
      ),
      icon: Building2,
      link: "/civil-engineering-2024",
      color: "from-orange-500 to-red-500",
      stats: "Undergraduate • 2024",
      bgColor: isDark
        ? "bg-orange-600 hover:bg-orange-500 border-orange-400"
        : "bg-orange-500 hover:bg-orange-600 border-orange-400",
      iconBg: "from-orange-400 to-red-400",
    },
    {
      title: t("home.civil25Title", "Civil Engineering 2025"),
      description: t(
        "home.civil25Desc",
        "Civil Engineering 2025 class schedules, lab sessions, and department resources.",
      ),
      icon: Building2,
      link: "/civil-engineering-2025",
      color: "from-red-500 to-rose-500",
      stats: "Undergraduate • 2025",
      bgColor: isDark
        ? "bg-red-600 hover:bg-red-500 border-red-400"
        : "bg-red-500 hover:bg-red-600 border-red-400",
      iconBg: "from-red-400 to-rose-400",
    },
    {
      title: t("home.electrical23Title", "Electrical Engineering 2023"),
      description: t(
        "home.electrical23Desc",
        "Electrical Engineering 2023 class schedules, lab sessions, and department resources.",
      ),
      icon: Zap,
      link: "/electrical-engineering-2023",
      color: "from-yellow-500 to-amber-500",
      stats: "Undergraduate • 2023",
      bgColor: isDark
        ? "bg-yellow-600 hover:bg-yellow-500 border-yellow-400"
        : "bg-yellow-500 hover:bg-yellow-600 border-yellow-400",
      iconBg: "from-yellow-400 to-amber-400",
    },
    {
      title: t("home.electrical24Title", "Electrical Engineering 2024"),
      description: t(
        "home.electrical24Desc",
        "Electrical Engineering 2024 class schedules, lab sessions, and department resources.",
      ),
      icon: Zap,
      link: "/electrical-engineering-2024",
      color: "from-lime-500 to-green-500",
      stats: "Undergraduate • 2024",
      bgColor: isDark
        ? "bg-lime-600 hover:bg-lime-500 border-lime-400"
        : "bg-lime-500 hover:bg-lime-600 border-lime-400",
      iconBg: "from-lime-400 to-green-400",
    },
    {
      title: t("home.electrical25Title", "Electrical Engineering 2025"),
      description: t(
        "home.electrical25Desc",
        "Electrical Engineering 2025 class schedules, lab sessions, and department resources.",
      ),
      icon: Zap,
      link: "/electrical-engineering-2025",
      color: "from-emerald-500 to-teal-500",
      stats: "Undergraduate • 2025",
      bgColor: isDark
        ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-400"
        : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400",
      iconBg: "from-emerald-400 to-teal-400",
    },
    {
      title: t("home.mechanical23Title", "Mechanical Engineering 2023"),
      description: t(
        "home.mechanical23Desc",
        "Mechanical Engineering 2023 class schedules, lab sessions, and department resources.",
      ),
      icon: Cog,
      link: "/mechanical-engineering-2023",
      color: "from-slate-500 to-gray-600",
      stats: "Undergraduate • 2023",
      bgColor: isDark
        ? "bg-slate-600 hover:bg-slate-500 border-slate-400"
        : "bg-slate-500 hover:bg-slate-600 border-slate-400",
      iconBg: "from-slate-400 to-gray-500",
    },
    {
      title: t("home.mechanical24Title", "Mechanical Engineering 2024"),
      description: t(
        "home.mechanical24Desc",
        "Mechanical Engineering 2024 class schedules, lab sessions, and department resources.",
      ),
      icon: Cog,
      link: "/mechanical-engineering-2024",
      color: "from-zinc-500 to-neutral-600",
      stats: "Undergraduate • 2024",
      bgColor: isDark
        ? "bg-zinc-600 hover:bg-zinc-500 border-zinc-400"
        : "bg-zinc-500 hover:bg-zinc-600 border-zinc-400",
      iconBg: "from-zinc-400 to-neutral-500",
    },
    {
      title: t("home.mechanical25Title", "Mechanical Engineering 2025"),
      description: t(
        "home.mechanical25Desc",
        "Mechanical Engineering 2025 class schedules, lab sessions, and department resources.",
      ),
      icon: Cog,
      link: "/mechanical-engineering-2025",
      color: "from-stone-500 to-warmGray-600",
      stats: "Undergraduate • 2025",
      bgColor: isDark
        ? "bg-stone-600 hover:bg-stone-500 border-stone-400"
        : "bg-stone-500 hover:bg-stone-600 border-stone-400",
      iconBg: "from-stone-400 to-warmGray-500",
    },
    {
      title: t("home.economics23Title", "Economics 2023"),
      description: t(
        "home.economics23Desc",
        "Economics 2023 class schedules, courses, and department resources.",
      ),
      icon: GraduationCap,
      link: "/economics-2023",
      color: "from-red-500 to-amber-600",
      stats: "Undergraduate • 2023",
      bgColor: isDark
        ? "bg-red-600 hover:bg-red-500 border-red-400"
        : "bg-red-500 hover:bg-red-600 border-red-400",
      iconBg: "from-red-400 to-amber-500",
    },
    {
      title: t("home.economics24Title", "Economics 2024"),
      description: t(
        "home.economics24Desc",
        "Economics 2024 class schedules, courses, and department resources.",
      ),
      icon: GraduationCap,
      link: "/economics-2024",
      color: "from-purple-500 to-violet-600",
      stats: "Undergraduate • 2024",
      bgColor: isDark
        ? "bg-purple-600 hover:bg-purple-500 border-purple-400"
        : "bg-purple-500 hover:bg-purple-600 border-purple-400",
      iconBg: "from-purple-400 to-violet-500",
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: t("home.featureSchedules", "Class Schedules"),
      description: t(
        "home.featureSchedulesDesc",
        "View and manage your class schedules with ease",
      ),
      link: "/",
    },
    {
      icon: Users,
      title: t("home.featureCommunity", "Community"),
      description: t(
        "home.featureCommunityDesc",
        "Connect with fellow international students",
      ),
      link: "/social",
    },
    {
      icon: Globe,
      title: t("home.featureResources", "Resources"),
      description: t(
        "home.featureResourcesDesc",
        "Access academic resources and information",
      ),
      link: "/student-guides",
    },
    {
      icon: Clock,
      title: t("home.featureUpdates", "Real-time Updates"),
      description: t(
        "home.featureUpdatesDesc",
        "Stay informed with the latest schedule changes",
      ),
      link: "/events",
    },
  ];

  return (
    <div
      className={`min-h-screen chinese-pattern-bg chinese-wave-bg bg-gradient-to-br ${isDark ? "from-slate-900 via-red-950/30 to-slate-900" : "from-slate-50 via-amber-50/30 to-slate-50"}`}
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

      <Navigation />

      <main className="relative z-10 dragon-phoenix-hero">
        <HeroSection
          backgroundImages={[heroImage, heroImage2]}
          slideInterval={5000}
          subtitle={t("home.subtitle", "Welcome Home")}
          title={
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              {t("home.welcome", "Welcome to NCWU")}
              <span className="block chinese-red-gold-text">
                {t("home.community", "International Student Community")}
              </span>
            </h1>
          }
          description={t(
            "home.description",
            "A helpful hub for class schedules, academic resources, and community connections. Explore departments and find information to support your studies and campus life at NCWU.",
          )}
          primaryButtonText={t("home.cstBtn", "CST Schedule")}
          primaryButtonLink="/cst/class-schedule"
          secondaryButtonText={t("home.econBtn", "Economics 25 Schedule")}
          secondaryButtonLink="/economics-2025/class-schedule"
          tertiaryButtonText={t("home.hskBtn", "HSK")}
          tertiaryButtonLink="/hsk-2026"
          quaternaryButtonText={t("home.aiBtn", "Huashui AI")}
          quaternaryButtonLink={huashuiAiLink}
          quinaryButtonText={t("home.discordBtn", "Discord")}
          quinaryButtonLink="/discord"
          senaryButtonText={t("home.languageExchangeBtn", "Language Exchange")}
          senaryButtonLink="/language-exchange"
          septenaryButtonText={t("home.econ23Btn", "Economics 23 Schedule")}
          septenaryButtonLink="/economics-2023/class-schedule"
          octonaryButtonText={t("home.econ24Btn", "Economics 24 Schedule")}
          octonaryButtonLink="/economics-2024/class-schedule"
          nonaryButtonText={t("home.guidesBtn", "Student Guides")}
          nonaryButtonLink="/student-guides"
          denaryButtonText={t("home.socialBtn", "Social")}
          denaryButtonLink="/social"
          undecimButtonText={t("home.aiNcwuBtn", "AI NCWU")}
          undecimButtonLink="https://ai.ncwu.site"
        >
          <GlobalSearchBar />
        </HeroSection>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2
                className={`text-2xl sm:text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {t("home.academicDepartments", "Academic Departments")}
              </h2>
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {t(
                  "home.selectDepartment",
                  "Select your department to access class schedules and resources",
                )}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {(showAllDepartments ? sections : sections.slice(0, 4)).map(
                (section, index) => {
                  const Icon = section.icon;
                  return (
                    <Link
                      key={index}
                      to={section.link}
                      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-2xl border-2 ${
                        isDark
                          ? `bg-gradient-to-br ${section.color}/10 border-${section.color.split(" ")[1].replace("to-", "")}/30`
                          : `bg-gradient-to-br ${section.color.split(" ")[0]}/20 border-${section.color.split(" ")[0]}/30`
                      }`}
                    >
                      {/* Background effects */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                      <div
                        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${section.color}`}
                      />

                      {/* Content */}
                      <div className="relative p-5">
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ring-2 ring-white/30`}
                          >
                            <Icon className="w-7 h-7" />
                          </div>

                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {/* Title */}
                              <h3
                                className={`text-lg font-bold ${isDark ? "text-white drop-shadow-md" : "text-slate-900 drop-shadow-sm"}`}
                              >
                                {section.title}
                              </h3>

                              {/* Stats badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md ${
                                  isDark
                                    ? `bg-${section.color.split(" ")[1].replace("to-", "")}/30 text-${section.color.split(" ")[1].replace("to-", "")}/30 border border-${section.color.split(" ")[1].replace("to-", "")}/40`
                                    : `bg-${section.color.split(" ")[0]}/30 text-${section.color.split(" ")[0]}/80 border border-${section.color.split(" ")[0]}/40`
                                }`}
                              >
                                {section.stats}
                              </span>
                            </div>

                            {/* Description */}
                            <p
                              className={`text-sm ${isDark ? "text-slate-200 drop-shadow-sm" : "text-slate-700 drop-shadow-sm"}`}
                            >
                              {section.description}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ArrowRight
                            className={`w-5 h-5 flex-shrink-0 transition-all group-hover:translate-x-2 group-hover:scale-110 ${
                              isDark
                                ? `text-${section.color.split(" ")[1].replace("to-", "")}/40 group-hover:text-${section.color.split(" ")[1].replace("to-", "")}/60`
                                : `text-${section.color.split(" ")[0]}/60 group-hover:text-${section.color.split(" ")[0]}/80`
                            }`}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>

            {/* View All / Show Less Button */}
            {sections.length > 4 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAllDepartments(!showAllDepartments)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isDark
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                  }`}
                >
                  {showAllDepartments ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less Departments
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All {sections.length} Departments
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mb-16">
            <SocialFeedSection isDark={isDark} />
            <div className="flex justify-center mt-6">
              <Link
                to="/social"
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/30"
                    : "bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/30"
                }`}
              >
                <Globe className="w-5 h-5" />
                Go to Social Media
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Photo Gallery Section */}
          <HomePhotoGallerySection isDark={isDark} />

          {/* Events Section */}
          <HomeEventsSection isDark={isDark} />

          {/* Market Section */}
          <HomeMarketSection isDark={isDark} />

          <div className="mb-16">
            <h2
              className={`text-2xl sm:text-3xl font-bold text-center mb-8 chinese-gradient-text`}
            >
              {t("home.everythingYouNeed", "Everything You Need")}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    to={feature.link}
                    className={`group relative overflow-hidden p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800/70"
                        : "bg-white/70 border-slate-200 shadow-sm hover:bg-white/90"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-amber-500/10 to-red-500/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative">
                      <div
                        className={`p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110 ${
                          isDark
                            ? "bg-gradient-to-br from-red-500/30 to-amber-500/30 ring-1 ring-red-500/20"
                            : "bg-gradient-to-br from-red-100 to-amber-100 ring-1 ring-red-200/50"
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
                        className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mb-16">
            <h2
              className={`text-2xl sm:text-3xl font-bold text-center mb-8 chinese-gradient-text`}
            >
              {t("home.studentResources", "Student Resources")}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                to="/apps-guide"
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-xl border ${
                  isDark
                    ? "bg-green-500/10 hover:bg-green-500/20 border-green-400/30"
                    : "bg-white/70 hover:bg-white/90 border-green-200 shadow-sm"
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("home.essentialApps", "Essential Apps")}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {t("home.mustHaveApps", "Must-have apps in China")}
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/transportation"
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-xl border ${
                  isDark
                    ? "bg-teal-500/10 hover:bg-teal-500/20 border-teal-400/30"
                    : "bg-white/70 hover:bg-white/90 border-teal-200 shadow-sm"
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("home.transportation", "Transportation")}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {t("home.gettingAround", "Getting around Zhengzhou")}
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/payment-guide"
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-xl border ${
                  isDark
                    ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/30"
                    : "bg-white/70 hover:bg-white/90 border-amber-200 shadow-sm"
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("home.paymentGuide", "Payment Guide")}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {t("home.wechatAlipay", "WeChat Pay, Alipay & banking")}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="mb-16">
            <h2
              className={`text-2xl sm:text-3xl font-bold text-center mb-8 chinese-gradient-text`}
            >
              {t("home.quickLinks", "Quick Links")}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                to="/emergency"
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-xl border ${
                  isDark
                    ? "bg-red-500/10 hover:bg-red-500/20 border-red-400/30"
                    : "bg-white/70 hover:bg-white/90 border-red-200 shadow-sm"
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("home.emergencyContacts", "Emergency Contacts")}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {t(
                        "home.importantNumbers",
                        "Important numbers & safety tips",
                      )}
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/campus-map"
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-xl border ${
                  isDark
                    ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-400/30"
                    : "bg-white/70 hover:bg-white/90 border-blue-200 shadow-sm"
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("home.campusMap", "Campus Map")}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {t("home.findYourWay", "Find your way around campus")}
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/events"
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-xl border ${
                  isDark
                    ? "bg-purple-500/10 hover:bg-purple-500/20 border-purple-400/30"
                    : "bg-white/70 hover:bg-white/90 border-purple-200 shadow-sm"
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("home.eventsAnnouncements", "Events & Announcements")}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {t("home.stayUpdated", "Stay updated with campus news")}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl border transition-all duration-300 hover:shadow-xl ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white/70 border-slate-200 shadow-sm"
            }`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-red-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex items-start gap-4">
              <div
                className={`p-3 rounded-xl transition-transform duration-300 hover:scale-110 ${
                  isDark
                    ? "bg-gradient-to-br from-red-500/30 to-amber-500/30 ring-1 ring-red-500/20"
                    : "bg-gradient-to-br from-red-100 to-amber-100 ring-1 ring-red-200/50"
                }`}
              >
                <MapPin
                  className={`w-6 h-6 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  North China University of Water Resources and Electric Power
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Located in Zhengzhou, Henan Province, China. NCWU welcomes
                  international students from around the world, offering quality
                  education in engineering, economics, and various other
                  disciplines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <HomePageContent />
    </ThemeProvider>
  );
}
