import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, LogIn, Shield, User, Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (isAuthenticated && (user?.is_admin || user?.role === "admin" || user?.role === "superadmin")) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!loginField || !password) {
      return;
    }

    const success = await login({ login: loginField, password });
    if (success) {
      navigate("/admin");
    } else {
      setErrorMessage("Invalid credentials");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-amber-50 to-slate-100"
      }`}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              isDark ? "bg-amber-500/20" : "bg-amber-100"
            }`}
          >
            <Shield
              className={`w-10 h-10 ${isDark ? "text-amber-400" : "text-amber-600"}`}
            />
          </div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {t("admin.adminLogin", "Admin Login")}
          </h1>
          <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("admin.adminLoginDesc", "Sign in to access the admin panel")}
          </p>
        </div>

        <Card
          className={`backdrop-blur-xl ${
            isDark
              ? "bg-slate-800/50 border-slate-700"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : "text-slate-900"}>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  {t("admin.secureLogin", "Secure Login")}
                </div>
              </CardTitle>
              <CardDescription>
                {t("admin.enterCredentials", "Enter your admin credentials")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-500">{errorMessage}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login">
                  {t("auth.studentIdOrEmail", "Student ID or Email")}
                </Label>
                <div className="relative">
                  <User
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
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
                    className={`pl-10 ${isDark ? "bg-slate-700/50 border-slate-600" : ""}`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t("auth.password", "Password")}
                </Label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.enterPassword", "Enter your password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${isDark ? "bg-slate-700/50 border-slate-600" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-slate-400 hover:text-slate-300"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={isLoading || !loginField || !password}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {t("auth.signingIn", "Signing in...")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t("admin.loginToPanel", "Login to Admin Panel")}
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p
          className={`text-center mt-6 text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          <a href="/" className="hover:text-indigo-500">
            ← {t("auth.backToHome", "Back to Home")}
          </a>
        </p>
      </div>
    </div>
  );
}
