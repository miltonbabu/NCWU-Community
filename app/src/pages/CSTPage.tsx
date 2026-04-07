import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
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
  MapPin,
  Code,
  Database,
  Brain,
  Globe,
  Layers,
  Cpu,
  Server,
  Cloud,
  GitBranch,
  Boxes,
  Workflow,
  Zap,
  Shield,
  Settings,
  LayoutGrid,
  Binary,
  Network,
  Container,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";

function CSTPageContent() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  useRTL();

  useEffect(() => {
    document.title = `${t("cst.title", "Computer Science 2023")} - NCWU International`;
  }, [t]);

  const batches = [
    {
      title: t("cst.title", "Computer Science 2023"),
      description: t(
        "cst.scheduleDescription",
        "Class Schedule for the 2023 batch of Computer Science students - 2026 Academic Year.",
      ),
      link: "/cst/class-schedule",
      semester: t("cst.semester", "2026 Schedule"),
      year: t("cst.year", "2023 Batch"),
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: t("cst.weeklySchedule", "Weekly Schedule"),
      description: t(
        "cst.weeklyScheduleDesc",
        "View classes organized by day and time",
      ),
    },
    {
      icon: BookOpen,
      title: t("cst.subjectDetails", "Subject Details"),
      description: t(
        "cst.subjectDetailsDesc",
        "Access detailed information for each subject",
      ),
    },
    {
      icon: Clock,
      title: t("cst.timeManagement", "Time Management"),
      description: t("cst.timeManagementDesc", "Plan your week effectively"),
    },
    {
      icon: Users,
      title: t("cst.classInformation", "Class Information"),
      description: t(
        "cst.classInformationDesc",
        "Know your classmates and teachers",
      ),
    },
  ];

  const courses = [
    {
      code: "CS101",
      name: "Introduction to Programming",
      credits: 4,
      description:
        "Fundamentals of programming using modern languages and problem-solving techniques",
    },
    {
      code: "CS201",
      name: "Data Structures & Algorithms",
      credits: 4,
      description:
        "Study of data organization, algorithms, and computational complexity",
    },
    {
      code: "CS301",
      name: "Database Systems",
      credits: 3,
      description: "Design and implementation of database management systems",
    },
    {
      code: "CS401",
      name: "Artificial Intelligence",
      credits: 3,
      description: "Machine learning, neural networks, and intelligent systems",
    },
    {
      code: "CS302",
      name: "Web Development",
      credits: 3,
      description:
        "Full-stack web application development and modern frameworks",
    },
    {
      code: "CS402",
      name: "Software Engineering",
      credits: 3,
      description: "Software development methodologies and project management",
    },
  ];

  const techFrameworks = [
    {
      icon: Layers,
      name: "React",
      category: "Frontend",
      description:
        "Component-based UI library for building interactive interfaces",
      application:
        "Used for building the class schedule dashboard and student portal",
    },
    {
      icon: Server,
      name: "Node.js",
      category: "Backend",
      description: "JavaScript runtime for server-side applications",
      application: "API development and real-time schedule updates",
    },
    {
      icon: Database,
      name: "PostgreSQL",
      category: "Database",
      description: "Advanced open-source relational database system",
      application: "Storing student records, schedules, and academic data",
    },
    {
      icon: Container,
      name: "Docker",
      category: "DevOps",
      description: "Container platform for application deployment",
      application: "Consistent development and production environments",
    },
  ];

  const architecturalPatterns = [
    {
      icon: LayoutGrid,
      name: "MVC Architecture",
      description: "Model-View-Controller pattern separating concerns",
      benefits: ["Separation of concerns", "Maintainability", "Testability"],
      diagram: "Model ↔ Controller ↔ View",
    },
    {
      icon: Boxes,
      name: "Microservices",
      description: "Distributed system of loosely coupled services",
      benefits: [
        "Scalability",
        "Independent deployment",
        "Technology diversity",
      ],
      diagram: "Service → API Gateway → Services",
    },
    {
      icon: Cloud,
      name: "Cloud Native",
      description: "Designed for cloud computing environments",
      benefits: ["Elasticity", "Resilience", "Cost efficiency"],
      diagram: "App → Load Balancer → Cloud Services",
    },
    {
      icon: Network,
      name: "Event-Driven",
      description: "Asynchronous communication via events",
      benefits: ["Loose coupling", "Real-time processing", "Scalability"],
      diagram: "Producer → Event Bus → Consumer",
    },
  ];

  const designPatterns = [
    {
      icon: GitBranch,
      name: "Singleton",
      type: "Creational",
      description: "Ensures a class has only one instance",
      useCase: "Database connection management",
    },
    {
      icon: Workflow,
      name: "Factory",
      type: "Creational",
      description: "Creates objects without specifying exact class",
      useCase: "Creating different notification types",
    },
    {
      icon: Zap,
      name: "Observer",
      type: "Behavioral",
      description: "Defines subscription mechanism for events",
      useCase: "Real-time schedule change notifications",
    },
    {
      icon: Shield,
      name: "Decorator",
      type: "Structural",
      description: "Adds behavior to objects dynamically",
      useCase: "Adding logging and caching layers",
    },
    {
      icon: Settings,
      name: "Strategy",
      type: "Behavioral",
      description: "Defines family of algorithms",
      useCase: "Different sorting methods for schedules",
    },
    {
      icon: Binary,
      name: "Adapter",
      type: "Structural",
      description: "Allows incompatible interfaces to work together",
      useCase: "Integrating third-party calendar APIs",
    },
  ];

  return (
    <div
      className={`min-h-screen relative overflow-hidden chinese-pattern-bg chinese-wave-bg ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-sky-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-cyan-500/5 to-sky-500/5 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <header
        className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-950/80 border-sky-500/20" : "bg-white/80 border-sky-200"} border-b`}
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
                  Computer Science 2023
                </h1>
                <p
                  className={`text-xs font-medium ${isDark ? "text-red-300/60" : "text-red-700"}`}
                >
                  2026 Academic Schedule
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
            <Link to="/" className={`nav-link-chinese flex items-center gap-1`}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <ChevronRight
              className={`w-4 h-4 ${isDark ? "text-red-500/40" : "text-amber-400"}`}
            />
            <span
              className={`font-medium ${isDark ? "text-red-300" : "text-red-900"}`}
            >
              CST
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
                <BookOpen
                  className={`w-16 h-16 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
              </div>
            </div>
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Computer Science 2023
            </h1>
            <p
              className={`text-lg max-w-2xl mx-auto ${isDark ? "text-red-100/70" : "text-slate-600"}`}
            >
              Access class schedules, academic resources, and information for
              Computer Science 2023 batch students at NCWU.
            </p>
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
                      <div
                        className={`p-2.5 rounded-xl ${isDark ? "bg-red-500" : "bg-red-500"}`}
                      >
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3
                          className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {batch.title}
                        </h3>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 ${isDark ? "text-red-400 group-hover:text-red-300" : "text-red-500 group-hover:text-red-600"} transition-colors`}
                    />
                  </div>
                  <p
                    className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {batch.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                        isDark
                          ? "bg-red-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {batch.semester}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                        isDark
                          ? "bg-amber-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
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
              What You'll Find
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-animation">
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
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {course.code}
                      </span>
                    </div>
                    <span
                      className={`text-sm ${isDark ? "text-red-300/50" : "text-red-600"}`}
                    >
                      {course.credits} Credits
                    </span>
                  </div>
                  <h3
                    className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {course.name}
                  </h3>
                  <p
                    className={`text-sm ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                  >
                    {course.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 chinese-gradient-text`}>
              Technologies & Skills
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
              <div
                className={`card-chinese p-6 rounded-2xl text-center ${
                  isDark
                    ? "bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/20"
                    : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"
                }`}
              >
                <Code
                  className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
                <h3
                  className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Programming
                </h3>
                <p
                  className={`text-xs ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                >
                  Python, Java, C++
                </p>
              </div>
              <div
                className={`card-chinese p-6 rounded-2xl text-center ${
                  isDark
                    ? "bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/20"
                    : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"
                }`}
              >
                <Database
                  className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
                <h3
                  className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Databases
                </h3>
                <p
                  className={`text-xs ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                >
                  MySQL, MongoDB, Redis
                </p>
              </div>
              <div
                className={`card-chinese p-6 rounded-2xl text-center ${
                  isDark
                    ? "bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/20"
                    : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"
                }`}
              >
                <Brain
                  className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
                <h3
                  className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  AI & ML
                </h3>
                <p
                  className={`text-xs ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                >
                  TensorFlow, PyTorch
                </p>
              </div>
              <div
                className={`card-chinese p-6 rounded-2xl text-center ${
                  isDark
                    ? "bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/20"
                    : "bg-gradient-to-br from-white to-amber-50/50 border border-red-100 shadow-md"
                }`}
              >
                <Globe
                  className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
                <h3
                  className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Web Tech
                </h3>
                <p
                  className={`text-xs ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                >
                  React, Node.js, Docker
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Cpu
                className={`w-8 h-8 ${isDark ? "text-sky-400" : "text-sky-600"}`}
              />
              <h2 className={`text-2xl font-bold chinese-gradient-text`}>
                Technology Patterns & Frameworks
              </h2>
            </div>

            <div className="mb-10">
              <h3
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <Layers
                  className={`w-5 h-5 ${isDark ? "text-sky-400" : "text-sky-600"}`}
                />
                Framework Stack
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
                {techFrameworks.map((framework, index) => {
                  const Icon = framework.icon;
                  return (
                    <div
                      key={index}
                      className={`card-chinese p-6 rounded-2xl ${
                        isDark
                          ? "bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/20"
                          : "bg-gradient-to-br from-white to-sky-50/50 border border-sky-100 shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-sky-500/20" : "bg-sky-100"}`}
                        >
                          <Icon
                            className={`w-5 h-5 ${isDark ? "text-sky-400" : "text-sky-600"}`}
                          />
                        </div>
                        <div>
                          <h4
                            className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {framework.name}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDark
                                ? "bg-sky-500/20 text-sky-300"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {framework.category}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-sm mb-2 ${isDark ? "text-sky-100/70" : "text-slate-600"}`}
                      >
                        {framework.description}
                      </p>
                      <p
                        className={`text-xs ${isDark ? "text-sky-300/60" : "text-sky-600"}`}
                      >
                        <span className="font-medium">Application:</span>{" "}
                        {framework.application}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-10">
              <h3
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <LayoutGrid
                  className={`w-5 h-5 ${isDark ? "text-sky-400" : "text-sky-600"}`}
                />
                Architectural Patterns
              </h3>
              <div className="grid md:grid-cols-2 gap-6 stagger-animation">
                {architecturalPatterns.map((pattern, index) => {
                  const Icon = pattern.icon;
                  return (
                    <div
                      key={index}
                      className={`card-chinese p-6 rounded-2xl ${
                        isDark
                          ? "bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/20"
                          : "bg-gradient-to-br from-white to-sky-50/50 border border-sky-100 shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${isDark ? "bg-sky-500/20" : "bg-sky-100"}`}
                        >
                          <Icon
                            className={`w-6 h-6 ${isDark ? "text-sky-400" : "text-sky-600"}`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {pattern.name}
                          </h4>
                          <p
                            className={`text-sm mb-3 ${isDark ? "text-sky-100/70" : "text-slate-600"}`}
                          >
                            {pattern.description}
                          </p>
                          <div
                            className={`p-3 rounded-lg mb-3 font-mono text-xs text-center ${
                              isDark
                                ? "bg-slate-800/50 text-sky-300 border border-sky-500/20"
                                : "bg-slate-100 text-sky-700 border border-sky-200"
                            }`}
                          >
                            {pattern.diagram}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pattern.benefits.map((benefit, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isDark
                                    ? "bg-cyan-500/20 text-cyan-300"
                                    : "bg-cyan-100 text-cyan-700"
                                }`}
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <GitBranch
                  className={`w-5 h-5 ${isDark ? "text-sky-400" : "text-sky-600"}`}
                />
                Design Patterns
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-animation">
                {designPatterns.map((pattern, index) => {
                  const Icon = pattern.icon;
                  return (
                    <div
                      key={index}
                      className={`card-chinese p-5 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/20"
                          : "bg-gradient-to-br from-white to-sky-50/50 border border-sky-100 shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-sky-500/20" : "bg-sky-100"}`}
                        >
                          <Icon
                            className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`}
                          />
                        </div>
                        <div>
                          <h4
                            className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {pattern.name}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              isDark
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-cyan-100 text-cyan-700"
                            }`}
                          >
                            {pattern.type}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-sm mb-2 ${isDark ? "text-sky-100/70" : "text-slate-600"}`}
                      >
                        {pattern.description}
                      </p>
                      <div
                        className={`text-xs p-2 rounded-lg ${
                          isDark
                            ? "bg-slate-800/30 text-sky-300/80"
                            : "bg-slate-50 text-sky-600"
                        }`}
                      >
                        <span className="font-medium">Use Case:</span>{" "}
                        {pattern.useCase}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  About Computer Science 2023
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-red-100/60" : "text-slate-600"}`}
                >
                  The Computer Science 2023 batch at NCWU represents a cohort of
                  students pursuing comprehensive programs designed to prepare
                  them for careers in software development, data science,
                  artificial intelligence, and other cutting-edge technology
                  fields. This schedule covers the 2026 academic year.
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

export default function CSTPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <CSTPageContent />
    </ThemeProvider>
  );
}
