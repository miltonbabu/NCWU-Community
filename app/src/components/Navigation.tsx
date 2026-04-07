import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { WeatherWidgetCompact } from "@/components/WeatherWidget";
import {
  Calendar,
  BookOpen,
  Globe,
  ChevronDown,
  Menu,
  X,
  MapPin,
  AlertTriangle,
  Bell,
  Smartphone,
  Car,
  CreditCard,
  FileText,
  ChevronRight,
  User,
  LogOut,
  LogIn,
  Shield,
  Users,
  MessageSquare,
  ShoppingCart,
  GraduationCap,
  Languages,
  PenTool,
  Building2,
  Wrench,
  Zap,
  HardHat,
  Camera,
  ArrowRightLeft,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";

interface NavItem {
  label: string;
  icon?: React.ElementType;
  href?: string;
  external?: boolean;
  children?: NavItem[];
}

export function Navigation() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems: NavItem[] = [
    {
      label: t("nav.departments", "Departments"),
      icon: BookOpen,
      children: [
        {
          label: t("nav.cst", "Computer Science"),
          icon: BookOpen,
          children: [
            {
              label: t("nav.cstOverview", "Overview"),
              icon: BookOpen,
              href: "/cst",
            },
            {
              label: t("nav.cstSchedule", "Class Schedule"),
              icon: Calendar,
              href: "/cst/class-schedule",
            },
          ],
        },
        {
          label: t("nav.economics", "Economics"),
          icon: Calendar,
          children: [
            {
              label: t("nav.economicsOverview", "Overview"),
              icon: Calendar,
              href: "/economics-2025",
            },
            {
              label: t("nav.economicsSchedule", "Class Schedule"),
              icon: Calendar,
              href: "/economics-2025/class-schedule",
            },
          ],
        },
        {
          label: t("nav.civilEngineering", "Civil Engineering"),
          icon: HardHat,
          children: [
            {
              label: t("nav.civil2023", "2023 Batch"),
              icon: GraduationCap,
              href: "/civil-engineering-2023",
            },
            {
              label: t("nav.civil2024", "2024 Batch"),
              icon: GraduationCap,
              href: "/civil-engineering-2024",
            },
            {
              label: t("nav.civil2025", "2025 Batch"),
              icon: GraduationCap,
              href: "/civil-engineering-2025",
            },
          ],
        },
        {
          label: t("nav.electricalEngineering", "Electrical Engineering"),
          icon: Zap,
          children: [
            {
              label: t("nav.electrical2023", "2023 Batch"),
              icon: GraduationCap,
              href: "/electrical-engineering-2023",
            },
            {
              label: t("nav.electrical2024", "2024 Batch"),
              icon: GraduationCap,
              href: "/electrical-engineering-2024",
            },
            {
              label: t("nav.electrical2025", "2025 Batch"),
              icon: GraduationCap,
              href: "/electrical-engineering-2025",
            },
          ],
        },
        {
          label: t("nav.mechanicalEngineering", "Mechanical Engineering"),
          icon: Wrench,
          children: [
            {
              label: t("nav.mechanical2023", "2023 Batch"),
              icon: GraduationCap,
              href: "/mechanical-engineering-2023",
            },
            {
              label: t("nav.mechanical2024", "2024 Batch"),
              icon: GraduationCap,
              href: "/mechanical-engineering-2024",
            },
            {
              label: t("nav.mechanical2025", "2025 Batch"),
              icon: GraduationCap,
              href: "/mechanical-engineering-2025",
            },
          ],
        },
      ],
    },
    {
      label: t("nav.learning", "Learning"),
      icon: Globe,
      children: [
        {
          label: t("nav.hsk", "HSK Chinese"),
          icon: Languages,
          href: "/hsk",
        },
        {
          label: t("nav.hsk2026", "HSK 2026"),
          icon: GraduationCap,
          href: "/hsk-2026",
        },
        {
          label: t("nav.hskGrammar", "HSK Grammar"),
          icon: PenTool,
          href: "/hsk/grammar",
        },
        {
          label: t("nav.hskApp", "HSK App"),
          href: "https://xuetong-chinese-learning-app.onrender.com/",
          external: true,
        },
        {
          label: t("nav.languageExchange", "Language Exchange"),
          icon: Languages,
          href: "/language-exchange",
        },
        {
          label: t("nav.social", "Community"),
          icon: Users,
          href: "/social",
        },
        {
          label: t("nav.photoGallery", "Photo Gallery"),
          href: "/gallery",
          icon: Camera,
        },
        {
          label: t("nav.discord", "Discord"),
          icon: MessageSquare,
          href: "/discord",
        },
        {
          label: t("nav.studentGuides", "Student Guides"),
          icon: FileText,
          href: "/student-guides",
        },
      ],
    },
    {
      label: t("nav.resources", "Resources"),
      icon: FileText,
      children: [
        {
          label: t("nav.essentialApps", "Essential Apps"),
          icon: Smartphone,
          href: "/apps-guide",
        },
        {
          label: t("nav.transportation", "Transportation"),
          icon: Car,
          href: "/transportation",
        },
        {
          label: t("nav.paymentGuide", "Payment Guide"),
          icon: CreditCard,
          href: "/payment-guide",
        },
        {
          label: t("nav.pdfTools", "PDF Tools"),
          icon: ArrowRightLeft,
          href: "/pdf-tools",
        },
      ],
    },
    {
      label: t("nav.campus", "Campus"),
      icon: MapPin,
      children: [
        {
          label: t("nav.campusMap", "Campus Map"),
          icon: MapPin,
          href: "/campus-map",
        },
        { label: t("nav.events", "Events"), icon: Bell, href: "/events" },
        {
          label: t("nav.market", "Market"),
          icon: ShoppingCart,
          href: "/market",
        },
        {
          label: t("nav.emergency", "Emergency"),
          icon: AlertTriangle,
          href: "/emergency",
        },
      ],
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const openDropdownMenu = (label: string) => {
    setOpenDropdown(label);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const isDropdownActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some((child) => child.href && isActive(child.href));
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark
          ? "bg-slate-900/90 border-slate-700"
          : "bg-white/90 border-slate-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={ncwuLogo}
              alt="NCWU Logo"
              className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 hover:scale-110"
            />
            <div className="hidden sm:block">
              <h1
                className={`text-lg font-bold ${
                  isDark
                    ? "bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent"
                    : "text-slate-900"
                }`}
              >
                NCWU International
              </h1>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Student Community
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isItemActive = item.href
                ? isActive(item.href)
                : isDropdownActive(item.children);
              const isDropdownOpen = openDropdown === item.label;

              if (hasChildren) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openDropdownMenu(item.label)}
                    onMouseLeave={closeDropdown}
                  >
                    <button
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isItemActive
                          ? isDark
                            ? "bg-red-500/20 text-red-400"
                            : "bg-red-50 text-red-600"
                          : isDark
                            ? "text-slate-300 hover:text-white hover:bg-slate-800"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {item.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`absolute top-full left-0 mt-0 pt-2 w-56 rounded-xl shadow-xl border transition-all duration-200 origin-top ${
                        isDropdownOpen
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      } ${
                        isDark
                          ? "bg-slate-800 border-slate-700"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="py-2">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = child.href
                            ? isActive(child.href)
                            : false;
                          const isExternal = child.href?.startsWith("http");
                          const hasNestedChildren =
                            child.children && child.children.length > 0;
                          const isSubOpen = openSubDropdown === child.label;

                          if (hasNestedChildren) {
                            return (
                              <div
                                key={child.label}
                                className="relative"
                                onMouseEnter={() =>
                                  setOpenSubDropdown(child.label)
                                }
                                onMouseLeave={() => setOpenSubDropdown(null)}
                              >
                                <button
                                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                                    isDark
                                      ? "text-slate-300 hover:text-white hover:bg-slate-700"
                                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {ChildIcon && (
                                      <ChildIcon className="w-4 h-4" />
                                    )}
                                    {child.label}
                                  </div>
                                  <ChevronRight
                                    className={`w-4 h-4 transition-transform duration-200 ${isSubOpen ? "rotate-90" : ""}`}
                                  />
                                </button>

                                <div
                                  className={`absolute top-0 left-full ml-1 w-48 rounded-xl shadow-xl border transition-all duration-200 origin-left ${
                                    isSubOpen
                                      ? "opacity-100 scale-100"
                                      : "opacity-0 scale-95 pointer-events-none"
                                  } ${
                                    isDark
                                      ? "bg-slate-800 border-slate-700"
                                      : "bg-white border-slate-200"
                                  }`}
                                >
                                  <div className="py-2">
                                    {child.children?.map((nestedChild) => {
                                      const NestedIcon = nestedChild.icon;
                                      const nestedActive = nestedChild.href
                                        ? isActive(nestedChild.href)
                                        : false;

                                      return (
                                        <Link
                                          key={nestedChild.label}
                                          to={nestedChild.href || "#"}
                                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                            nestedActive
                                              ? isDark
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-red-50 text-red-600"
                                              : isDark
                                                ? "text-slate-300 hover:text-white hover:bg-slate-700"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                          }`}
                                        >
                                          {NestedIcon && (
                                            <NestedIcon className="w-4 h-4" />
                                          )}
                                          {nestedChild.label}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (isExternal) {
                            return (
                              <a
                                key={child.label}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  isDark
                                    ? "text-slate-300 hover:text-white hover:bg-slate-700"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                              >
                                {ChildIcon && <ChildIcon className="w-4 h-4" />}
                                {child.label}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={child.label}
                              to={child.href || "#"}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                childActive
                                  ? isDark
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-red-50 text-red-600"
                                  : isDark
                                    ? "text-slate-300 hover:text-white hover:bg-slate-700"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              }`}
                            >
                              {ChildIcon && <ChildIcon className="w-4 h-4" />}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href || "#"}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isItemActive
                      ? isDark
                        ? "bg-red-500/20 text-red-400"
                        : "bg-red-50 text-red-600"
                      : isDark
                        ? "text-slate-300 hover:text-white hover:bg-slate-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <WeatherWidgetCompact />
            </div>
            <LanguageSelector isDark={isDark} />
            <ThemeToggle />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      isDark
                        ? "hover:bg-slate-800 text-white"
                        : "hover:bg-slate-100 text-slate-900"
                    }`}
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user.full_name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.full_name}</span>
                      <span
                        className={`text-xs font-normal ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator
                    className={isDark ? "bg-slate-700" : ""}
                  />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      className={`flex items-center gap-2 cursor-pointer ${
                        isDark ? "focus:bg-slate-700" : ""
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {t("nav.profile", "Profile")}
                    </Link>
                  </DropdownMenuItem>
                  {(user.is_admin ||
                    user.role === "admin" ||
                    user.role === "superadmin") && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className={`flex items-center gap-2 cursor-pointer ${
                          isDark ? "focus:bg-slate-700" : ""
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        {t("nav.adminPanel", "Admin Panel")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator
                    className={isDark ? "bg-slate-700" : ""}
                  />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className={`flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500 ${
                      isDark ? "focus:bg-slate-700" : ""
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    {t("nav.logout", "Logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-1" />
                    {t("nav.login", "Login")}
                  </Link>
                </Button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`lg:hidden border-t transition-all duration-300 overflow-hidden ${
          isDark ? "border-slate-700" : "border-slate-200"
        } ${mobileMenuOpen ? "max-h-[700px] overflow-y-auto" : "max-h-0"}`}
      >
        <div className="px-4 py-4 space-y-2">
          {isAuthenticated && user && (
            <div
              className={`flex items-center gap-3 px-3 py-2 mb-2 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={user.avatar_url || ""}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {user.full_name}
                </p>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {user.email}
                </p>
              </div>
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isItemActive = item.href
              ? isActive(item.href)
              : isDropdownActive(item.children);
            const isDropdownOpen = openDropdown === item.label;

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isItemActive
                          ? isDark
                            ? "bg-red-500/20 text-red-400"
                            : "bg-red-50 text-red-600"
                          : isDark
                            ? "text-slate-300 hover:text-white hover:bg-slate-800"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        {item.label}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isDropdownOpen ? "max-h-96 mt-1" : "max-h-0"
                      }`}
                    >
                      <div
                        className={`ml-4 pl-3 border-l ${
                          isDark ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = child.href
                            ? isActive(child.href)
                            : false;
                          const hasNestedChildren =
                            child.children && child.children.length > 0;
                          const isSubOpen = openSubDropdown === child.label;

                          if (hasNestedChildren) {
                            return (
                              <div key={child.label}>
                                <button
                                  onClick={() =>
                                    setOpenSubDropdown(
                                      isSubOpen ? null : child.label,
                                    )
                                  }
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isDark
                                      ? "text-slate-400 hover:text-white hover:bg-slate-800"
                                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {ChildIcon && (
                                      <ChildIcon className="w-4 h-4" />
                                    )}
                                    {child.label}
                                  </div>
                                  <ChevronRight
                                    className={`w-4 h-4 transition-transform duration-200 ${isSubOpen ? "rotate-90" : ""}`}
                                  />
                                </button>
                                <div
                                  className={`overflow-hidden transition-all duration-200 ${
                                    isSubOpen ? "max-h-48" : "max-h-0"
                                  }`}
                                >
                                  <div
                                    className={`ml-4 pl-3 border-l ${isDark ? "border-slate-700" : "border-slate-200"}`}
                                  >
                                    {child.children?.map((nestedChild) => {
                                      const NestedIcon = nestedChild.icon;
                                      const nestedActive = nestedChild.href
                                        ? isActive(nestedChild.href)
                                        : false;

                                      return (
                                        <Link
                                          key={nestedChild.label}
                                          to={nestedChild.href || "#"}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                            nestedActive
                                              ? isDark
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-red-50 text-red-600"
                                              : isDark
                                                ? "text-slate-500 hover:text-white hover:bg-slate-800"
                                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                          }`}
                                        >
                                          {NestedIcon && (
                                            <NestedIcon className="w-4 h-4" />
                                          )}
                                          {nestedChild.label}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={child.label}
                              to={child.href || "#"}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                childActive
                                  ? isDark
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-red-50 text-red-600"
                                  : isDark
                                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              {ChildIcon && <ChildIcon className="w-4 h-4" />}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.href || "#"}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isItemActive
                        ? isDark
                          ? "bg-red-500/20 text-red-400"
                          : "bg-red-50 text-red-600"
                        : isDark
                          ? "text-slate-300 hover:text-white hover:bg-slate-800"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}

          <div
            className={`pt-2 mt-2 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
          >
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t("nav.profile", "Profile")}
                </Link>
                {(user.is_admin ||
                  user.role === "admin" ||
                  user.role === "superadmin") && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDark
                        ? "text-slate-300 hover:text-white hover:bg-slate-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    {t("nav.adminPanel", "Admin Panel")}
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-red-500 ${
                    isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {t("nav.logout", "Logout")}
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  {t("nav.login", "Login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
