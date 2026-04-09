import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  UserPlus,
  User,
  Lock,
  Mail,
  Hash,
  Globe,
  Sparkles,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";

const departments = [
  "Computer Science & Technology",
  "Economics",
  "Civil Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Water Resources",
  "Business Administration",
  "Other",
];

const currentYears = [
  { value: "1", label: "1st Year (Freshman)" },
  { value: "2", label: "2nd Year (Sophomore)" },
  { value: "3", label: "3rd Year (Junior)" },
  { value: "4", label: "4th Year (Senior)" },
  { value: "5", label: "5th Year" },
  { value: "6", label: "6th Year" },
];

const enrollmentYears = Array.from({ length: 10 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

export default function SignupPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    new URLSearchParams(location.search).get("redirect") ||
    "/";

  const [formData, setFormData] = useState({
    student_id: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
    department: "",
    enrollment_year: "",
    current_year: "",
    country: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [particleStyles] = useState(() => 
    [...Array(20)].map(() => ({
      width: `${Math.random() * 6 + 2}px`,
      height: `${Math.random() * 6 + 2}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 10 + 10}s`,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.student_id.trim()) {
      newErrors.student_id = t(
        "auth.errors.studentIdRequired",
        "Student ID is required",
      );
    }

    if (!formData.email.trim()) {
      newErrors.email = t("auth.errors.emailRequired", "Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("auth.errors.emailInvalid", "Invalid email format");
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = t(
        "auth.errors.nameRequired",
        "Full name is required",
      );
    }

    if (!formData.password) {
      newErrors.password = t(
        "auth.errors.passwordRequired",
        "Password is required",
      );
    } else if (formData.password.length < 6) {
      newErrors.password = t(
        "auth.errors.passwordLength",
        "Password must be at least 6 characters",
      );
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.errors.passwordMismatch",
        "Passwords do not match",
      );
    }

    if (!agreedToTerms) {
      newErrors.terms = t(
        "auth.errors.termsRequired",
        "You must agree to the terms and privacy policy",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await signup({
      student_id: formData.student_id,
      email: formData.email,
      full_name: formData.full_name,
      password: formData.password,
      department: formData.department || undefined,
      enrollment_year: formData.enrollment_year
        ? parseInt(formData.enrollment_year)
        : undefined,
      current_year: formData.current_year
        ? parseInt(formData.current_year)
        : undefined,
      country: formData.country || undefined,
      agreed_to_terms: agreedToTerms,
    });

    if (success) {
      navigate(from, { replace: true });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500 ${
        isDark
          ? "bg-slate-950"
          : "bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-indigo-600/20" : "bg-indigo-400/30"
          }`}
        ></div>
        <div
          className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${
            isDark ? "bg-purple-600/20" : "bg-purple-400/30"
          }`}
        ></div>
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-30 ${
            isDark ? "bg-pink-600/10" : "bg-pink-300/20"
          }`}
        ></div>

        <div className="absolute inset-0">
          {particleStyles.map((style, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-float ${isDark ? "bg-white/10" : "bg-indigo-400/20"}`}
              style={style}
            />
          ))}
        </div>
      </div>

      <div
        className={`relative z-10 w-full max-w-2xl transition-all duration-700 transform ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div
              className={`absolute inset-0 blur-xl rounded-full ${
                isDark ? "bg-indigo-500/30" : "bg-indigo-400/40"
              }`}
            ></div>
            <img
              src={ncwuLogo}
              alt="NCWU Logo"
              className="relative w-20 h-20 mx-auto mb-4 rounded-2xl object-contain drop-shadow-2xl"
            />
          </div>
          <h1
            className={`text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent`}
          >
            {t("auth.createAccount", "Create Account")}
          </h1>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {t("auth.signupSubtitle", "Join the NCWU International Community")}
          </p>
          <div
            className={`mt-3 p-3 rounded-xl text-xs ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
          >
            <p
              className={`flex items-center gap-2 ${isDark ? "text-amber-400" : "text-amber-700"}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t(
                "auth.verificationNotice",
                "New accounts require admin verification before full access.",
              )}
            </p>
          </div>
        </div>

        <div
          className={`relative rounded-3xl p-8 ${
            isDark
              ? "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50"
              : "bg-white/80 backdrop-blur-xl border border-white/50"
          } shadow-2xl`}
        >
          <div
            className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl -z-10`}
          ></div>

          <div className="flex items-center gap-3 mb-6">
            <div
              className={`p-2 rounded-xl ${
                isDark ? "bg-indigo-500/20" : "bg-indigo-100"
              }`}
            >
              <Sparkles
                className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
            </div>
            <div>
              <h2
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {t("auth.signUp", "Sign Up")}
              </h2>
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {t(
                  "auth.signupDesc",
                  "Fill in your details to create an account",
                )}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="student_id"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.studentId", "Student ID")}{" "}
                  <span className="text-red-400">*</span>
                </Label>
                <div className="relative group">
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition-opacity pointer-events-none`}
                  ></div>
                  <Hash
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                      isDark
                        ? "text-slate-500 group-focus-within:text-indigo-400"
                        : "text-slate-400 group-focus-within:text-indigo-500"
                    }`}
                  />
                  <Input
                    id="student_id"
                    name="student_id"
                    type="text"
                    autoComplete="off"
                    placeholder="2023LXSBXXXX"
                    value={formData.student_id}
                    onChange={(e) => updateField("student_id", e.target.value)}
                    className={`pl-11 h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900 placeholder:text-slate-400"
                    } ${errors.student_id ? "border-red-500/50 focus:border-red-500" : ""}`}
                  />
                </div>
                {errors.student_id && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.student_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.email", "Email")}{" "}
                  <span className="text-red-400">*</span>
                </Label>
                <div className="relative group">
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition-opacity pointer-events-none`}
                  ></div>
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                      isDark
                        ? "text-slate-500 group-focus-within:text-indigo-400"
                        : "text-slate-400 group-focus-within:text-indigo-500"
                    }`}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`pl-11 h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900 placeholder:text-slate-400"
                    } ${errors.email ? "border-red-500/50 focus:border-red-500" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {t("auth.fullName", "Full Name")}{" "}
                <span className="text-red-400">*</span>
              </Label>
              <div className="relative group">
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition-opacity pointer-events-none`}
                ></div>
                <User
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                    isDark
                      ? "text-slate-500 group-focus-within:text-indigo-400"
                      : "text-slate-400 group-focus-within:text-indigo-500"
                  }`}
                />
                <Input
                  id="full_name"
                  type="text"
                  placeholder={t("auth.enterFullName", "Enter your full name")}
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  className={`pl-11 h-12 rounded-xl transition-all duration-300 ${
                    isDark
                      ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                      : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900 placeholder:text-slate-400"
                  } ${errors.full_name ? "border-red-500/50 focus:border-red-500" : ""}`}
                />
              </div>
              {errors.full_name && (
                <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.password", "Password")}{" "}
                  <span className="text-red-400">*</span>
                </Label>
                <div className="relative group">
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition-opacity pointer-events-none`}
                  ></div>
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                      isDark
                        ? "text-slate-500 group-focus-within:text-indigo-400"
                        : "text-slate-400 group-focus-within:text-indigo-500"
                    }`}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={`pl-11 pr-11 h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900 placeholder:text-slate-400"
                    } ${errors.password ? "border-red-500/50 focus:border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDark
                        ? "text-slate-500 hover:text-indigo-400"
                        : "text-slate-400 hover:text-indigo-500"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.confirmPassword", "Confirm Password")}{" "}
                  <span className="text-red-400">*</span>
                </Label>
                <div className="relative group">
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition-opacity pointer-events-none`}
                  ></div>
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                      isDark
                        ? "text-slate-500 group-focus-within:text-indigo-400"
                        : "text-slate-400 group-focus-within:text-indigo-500"
                    }`}
                  />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    className={`pl-11 h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900 placeholder:text-slate-400"
                    } ${errors.confirmPassword ? "border-red-500/50 focus:border-red-500" : ""}`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="department"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.department", "Department")}
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => updateField("department", v)}
                >
                  <SelectTrigger
                    className={`h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900"
                    }`}
                  >
                    <SelectValue
                      placeholder={t(
                        "auth.selectDepartment",
                        "Select department",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent
                    className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept}
                        value={dept}
                        className={
                          isDark
                            ? "text-white hover:bg-slate-700"
                            : "text-slate-900 hover:bg-slate-100"
                        }
                      >
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="current_year"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.currentYear", "Current Year")}
                </Label>
                <Select
                  value={formData.current_year}
                  onValueChange={(v) => updateField("current_year", v)}
                >
                  <SelectTrigger
                    className={`h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900"
                    }`}
                  >
                    <SelectValue
                      placeholder={t("auth.selectYear", "Select year")}
                    />
                  </SelectTrigger>
                  <SelectContent
                    className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    {currentYears.map((year) => (
                      <SelectItem
                        key={year.value}
                        value={year.value}
                        className={
                          isDark
                            ? "text-white hover:bg-slate-700"
                            : "text-slate-900 hover:bg-slate-100"
                        }
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="enrollment_year"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.enrollmentYear", "Enrollment Year")}
                </Label>
                <Select
                  value={formData.enrollment_year}
                  onValueChange={(v) => updateField("enrollment_year", v)}
                >
                  <SelectTrigger
                    className={`h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900"
                    }`}
                  >
                    <SelectValue
                      placeholder={t("auth.selectYear", "Select year")}
                    />
                  </SelectTrigger>
                  <SelectContent
                    className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    {enrollmentYears.map((year) => (
                      <SelectItem
                        key={year}
                        value={year}
                        className={
                          isDark
                            ? "text-white hover:bg-slate-700"
                            : "text-slate-900 hover:bg-slate-100"
                        }
                      >
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.country", "Country")}
                </Label>
                <div className="relative group">
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition-opacity pointer-events-none`}
                  ></div>
                  <Globe
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                      isDark
                        ? "text-slate-500 group-focus-within:text-indigo-400"
                        : "text-slate-400 group-focus-within:text-indigo-500"
                    }`}
                  />
                  <Input
                    id="country"
                    type="text"
                    placeholder={t("auth.enterCountry", "Your country")}
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className={`pl-11 h-12 rounded-xl transition-all duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                        : "bg-white/50 border-slate-200/50 focus:bg-white focus:border-indigo-400 text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (errors.terms) {
                    setErrors((prev) => ({ ...prev, terms: "" }));
                  }
                }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className={`text-sm cursor-pointer ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                📋 {t("auth.agreeToTerms", "I have read and agree to the")}{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-indigo-500 hover:text-indigo-400 underline font-medium"
                >
                  {t("auth.termsOfService", "Terms of Service")}
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-indigo-500 hover:text-indigo-400 underline font-medium"
                >
                  {t("auth.privacyPolicy", "Privacy Policy")}
                </Link>
                .
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-400 text-xs">{errors.terms}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`relative w-full h-12 rounded-xl font-medium text-white overflow-hidden group transition-all duration-300 ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="animate-spin text-lg">⏳</span>
                      {t("auth.creatingAccount", "Creating account...")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      {t("auth.createAccountBtn", "Create Account")}
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="text-center pt-2">
              <span
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {t("auth.haveAccount", "Already have an account?")}
              </span>{" "}
              <Link
                to="/login"
                className={`text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent hover:from-indigo-400 hover:to-purple-400 transition-all`}
              >
                {t("auth.signIn", "Sign In")}
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className={`text-sm inline-flex items-center gap-1 transition-colors ${
              isDark
                ? "text-slate-500 hover:text-indigo-400"
                : "text-slate-500 hover:text-indigo-500"
            }`}
          >
            ← {t("auth.backToHome", "Back to Home")}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
