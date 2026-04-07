import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  LogIn,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { login, isLoading, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
  const [isLocked, setIsLocked] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    new URLSearchParams(location.search).get("redirect") ||
    "/";

  const [particleStyles] = useState(() => 
    [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 4}s`,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setRemainingAttempts(null);

    if (!loginField || !password) {
      return;
    }

    const result = await login({ login: loginField, password });
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      if (result.remainingMinutes) {
        setIsLocked(true);
        setLoginError(
          `Too many failed attempts. Please try again in ${result.remainingMinutes} minute(s).`,
        );
      } else if (result.remainingAttempts !== undefined) {
        setRemainingAttempts(result.remainingAttempts);
        setLoginError(
          `Invalid credentials. ${result.remainingAttempts} attempt(s) remaining.`,
        );
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await googleSignIn();
    setIsGoogleLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
        isDark
          ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950"
          : "bg-gradient-to-br from-slate-100 via-indigo-100 to-purple-100"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-indigo-500/20" : "bg-indigo-300/40"
          }`}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000 ${
            isDark ? "bg-purple-500/20" : "bg-purple-300/40"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse delay-500 ${
            isDark ? "bg-pink-500/10" : "bg-pink-200/30"
          }`}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particleStyles.map((style, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-float ${
              isDark ? "bg-white/20" : "bg-indigo-400/30"
            }`}
            style={style}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className={`relative inline-block mb-4`}>
            <div
              className={`absolute inset-0 blur-xl rounded-full ${
                isDark ? "bg-indigo-500/30" : "bg-indigo-400/30"
              }`}
            />
            <img
              src={ncwuLogo}
              alt="NCWU Logo"
              className="w-20 h-20 mx-auto rounded-2xl object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
          <h1
            className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {t("auth.welcomeBack", "Welcome Back")}
          </h1>
          <p
            className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {t("auth.loginSubtitle", "Sign in to continue your journey")}
          </p>
        </div>

        {/* Glass Card */}
        <div className={`relative group ${isDark ? "" : ""}`}>
          {/* Glow effect */}
          <div
            className={`absolute -inset-1 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500 ${
              isDark
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                : "bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300"
            }`}
          />

          <div
            className={`relative rounded-2xl p-8 ${
              isDark
                ? "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50"
                : "bg-white/80 backdrop-blur-xl border border-white/50"
            } shadow-2xl`}
          >
            {/* Google Sign In Button */}
            <div className="mb-6">
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                isLoading={isGoogleLoading}
              />
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className={`absolute inset-0 flex items-center`}>
                <div
                  className={`w-full border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                />
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className={`px-4 ${isDark ? "bg-slate-900/80 text-slate-400" : "bg-white/80 text-slate-500"}`}
                >
                  {t("auth.orContinueWith", "or continue with email")}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student ID / Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="login"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.studentIdOrEmail", "Student ID or Email")}
                </Label>
                <div className="relative group/input">
                  <div
                    className={`absolute inset-0 rounded-lg blur-sm transition duration-300 ${
                      isDark ? "bg-indigo-500/20" : "bg-indigo-200/50"
                    } opacity-0 group-focus-within/input:opacity-100`}
                  />
                  <div className="relative">
                    <User
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      } group-focus-within/input:text-indigo-500`}
                    />
                    <Input
                      id="login"
                      type="text"
                      placeholder={t(
                        "auth.enterStudentIdOrEmail",
                        "Enter your Student ID or Email",
                      )}
                      value={loginField}
                      onChange={(e) => setLoginField(e.target.value)}
                      className={`pl-12 h-12 rounded-xl transition-all duration-300 ${
                        isDark
                          ? "bg-slate-800/50 border-slate-600/50 focus:border-indigo-500 focus:ring-indigo-500/20 text-white placeholder:text-slate-500"
                          : "bg-white/50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {t("auth.password", "Password")}
                </Label>
                <div className="relative group/input">
                  <div
                    className={`absolute inset-0 rounded-lg blur-sm transition duration-300 ${
                      isDark ? "bg-indigo-500/20" : "bg-indigo-200/50"
                    } opacity-0 group-focus-within/input:opacity-100`}
                  />
                  <div className="relative">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      } group-focus-within/input:text-indigo-500`}
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t(
                        "auth.enterPassword",
                        "Enter your password",
                      )}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-12 pr-12 h-12 rounded-xl transition-all duration-300 ${
                        isDark
                          ? "bg-slate-800/50 border-slate-600/50 focus:border-indigo-500 focus:ring-indigo-500/20 text-white placeholder:text-slate-500"
                          : "bg-white/50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                        isDark
                          ? "text-slate-500 hover:text-slate-300"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl ${
                    isDark
                      ? "bg-red-500/10 border border-red-500/30"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-500"}`}
                  />
                  <p
                    className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}
                  >
                    {loginError}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/forgot-password"
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors shrink-0 ${
                    isDark
                      ? "text-indigo-400 hover:text-indigo-300"
                      : "text-indigo-600 hover:text-indigo-500"
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  {t("auth.forgotPassword", "Forgot?")}
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading || !loginField || !password || isLocked}
                  className={`h-12 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none ${
                    isDark
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t("auth.signingIn", "Signing in...")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      {t("auth.signIn", "Sign In")}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-2">
              <p
                className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {t("auth.noAccount", "Don't have an account?")}
              </p>
              <Link
                to="/signup"
                state={{ from: { pathname: from === "/" ? "/xingyuan-ai" : from } }}
                className={`inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  isDark
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-indigo-500/30"
                    : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
                }`}
              >
                <Sparkles className="w-5 h-5" />
                {t("auth.createAccount", "Create New Account")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <p
          className={`text-center mt-8 text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          <Link
            to="/"
            className={`inline-flex items-center gap-1 transition-colors ${
              isDark ? "hover:text-indigo-400" : "hover:text-indigo-500"
            }`}
          >
            <span>←</span>
            {t("auth.backToHome", "Back to Home")}
          </Link>
        </p>
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
