import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  KeyRound,
  Mail,
  Hash,
  ArrowLeft,
  CheckCircle,
  Send,
  Copy,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [useSameEmail, setUseSameEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const particleStyles = useMemo(() => {
    return [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 4}s`,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !studentId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(
        email,
        studentId,
        useSameEmail ? undefined : recoveryEmail
      );

      if (response.success) {
        setIsSubmitted(true);
        toast.success("Password recovery request submitted!");
      } else {
        toast.error(response.message || "Failed to submit request");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
      </div>

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
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
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
            {t("auth.forgotPassword", "Forgot Password")}
          </h1>
          <p
            className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {t(
              "auth.forgotPasswordSubtitle",
              "Enter your details to request a password reset"
            )}
          </p>
        </div>

        <div className={`relative group`}>
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
            {isSubmitted ? (
              <div className="text-center py-8">
                <div
                  className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                    isDark ? "bg-green-500/20" : "bg-green-100"
                  }`}
                >
                  <CheckCircle
                    className={`w-8 h-8 ${isDark ? "text-green-400" : "text-green-600"}`}
                  />
                </div>
                <h2
                  className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Request Submitted
                </h2>
                <p
                  className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Your password recovery request has been submitted. An admin
                  will review your request and send you a new password to your
                  email.
                </p>
                <Link
                  to="/login"
                  className={`inline-flex items-center gap-2 font-semibold transition-colors ${
                    isDark
                      ? "text-indigo-400 hover:text-indigo-300"
                      : "text-indigo-600 hover:text-indigo-500"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {t("auth.email", "Email")}{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative group/input">
                    <div className="relative">
                      <Mail
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        } group-focus-within/input:text-indigo-500`}
                      />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.enterEmail", "Enter your email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

                <div className="space-y-2">
                  <Label
                    htmlFor="studentId"
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {t("auth.studentId", "Student ID")}{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative group/input">
                    <div className="relative">
                      <Hash
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        } group-focus-within/input:text-indigo-500`}
                      />
                      <Input
                        id="studentId"
                        type="text"
                        placeholder={t(
                          "auth.enterStudentId",
                          "Enter your Student ID"
                        )}
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
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

                <div className="space-y-3">
                  <Label
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Recovery Email (where you want to receive new password)
                  </Label>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useSameEmail"
                      checked={useSameEmail}
                      onChange={(e) => setUseSameEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="useSameEmail"
                      className={`text-sm cursor-pointer ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Use the same email for receiving password
                    </label>
                  </div>

                  {!useSameEmail && (
                    <div className="relative group/input">
                      <div className="relative">
                        <Mail
                          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          } group-focus-within/input:text-indigo-500`}
                        />
                        <Input
                          type="email"
                          placeholder="Enter recovery email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className={`pl-12 h-12 rounded-xl transition-all duration-300 ${
                            isDark
                              ? "bg-slate-800/50 border-slate-600/50 focus:border-indigo-500 focus:ring-indigo-500/20 text-white placeholder:text-slate-500"
                              : "bg-white/50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                          }`}
                          required={!useSameEmail}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUseSameEmail(true);
                      setRecoveryEmail(email);
                    }}
                    className={`text-xs flex items-center gap-1 ${
                      isDark
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-600 hover:text-indigo-500"
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    Copy account email to recovery email
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email || !studentId}
                  className={`w-full h-12 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none ${
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
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Submit Request
                    </span>
                  )}
                </Button>
              </form>
            )}

            {!isSubmitted && (
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className={`inline-flex items-center gap-1 text-sm transition-colors ${
                    isDark
                      ? "text-slate-400 hover:text-indigo-400"
                      : "text-slate-500 hover:text-indigo-500"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("auth.backToLogin", "Back to Login")}
                </Link>
              </div>
            )}
          </div>
        </div>

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
