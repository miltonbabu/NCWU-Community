import { useState, useEffect } from "react";
import { Shield, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EconomicsStudentVerificationProps {
  isDark: boolean;
  onVerified: () => void;
}

const VALID_ECONOMICS_STUDENT_IDS = [
  "2025LXSB0002",
  "2025LXSB0003",
  "2025LXSB0004",
  "2025LXSB0005",
  "2025LXSB0006",
  "2025LXSB0007",
  "2025LXSB0008",
  "2025LXSB0009",
  "2025LXSB0010",
  "2025LXSB0011",
  "2025LXSB0012",
  "2025LXSB0013",
  "2025LXSB0014",
  "2025LXSB0015",
  "2025LXSB0016",
  "2025LXSB0017",
  "2025LXSB0018",
  "2025LXSB0019",
  "2025LXSB0020",
  "2025LXSB0021",
  "2025LXSB0022",
  "2025LXSB0023",
  "2025LXSB0024",
  "2025LXSB0025",
  "2025LXSB0026",
  "2025LXSB0027",
  "2025LXSB0028",
  "2025LXSB0029",
  "2025LXSB0030",
  "2025LXSB0031",
  "2025LXSB0032",
  "2025LXSB0033",
  "2025LXSB0034",
  "2025LXSB0035",
  "2025LXSB0036",
  "2025LXSB0037",
  "2025LXSB0038",
  "2025LXSB0039",
  "2025LXSB0040",
  "2025LXSB0041",
  "2025LXSB0042",
  "2025LXSB0043",
  "2025LXSB0044",
  "2025LXSB0045",
];

const STORAGE_KEY = "ncwu_economics2025_verified_student";

export function isEconomicsStudentVerified(): boolean {
  try {
    const verified = localStorage.getItem(STORAGE_KEY);
    return verified === "true";
  } catch {
    return false;
  }
}

export function EconomicsStudentVerification({
  isDark,
  onVerified,
}: EconomicsStudentVerificationProps) {
  const { isAuthenticated } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onVerified();
    }
  }, [isAuthenticated, onVerified]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const normalizedId = studentId.trim().toUpperCase();

      if (!normalizedId) {
        setError("Please enter your student ID");
        setIsLoading(false);
        return;
      }

      if (VALID_ECONOMICS_STUDENT_IDS.includes(normalizedId)) {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
          onVerified();
        } catch {
          setError("Failed to save verification. Please try again.");
        }
      } else {
        setError("Invalid student ID. Please check and try again.");
      }
      setIsLoading(false);
    }, 800);
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${isDark ? "bg-slate-950/80" : "bg-slate-900/60"} backdrop-blur-sm`}
      />

      <div
        className={`relative w-full max-w-md p-8 rounded-2xl shadow-2xl ${
          isDark
            ? "bg-slate-900 border border-red-500/20"
            : "bg-white border border-amber-200"
        }`}
      >
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              isDark
                ? "bg-gradient-to-br from-red-500/20 to-amber-500/20"
                : "bg-gradient-to-br from-red-100 to-amber-100"
            }`}
          >
            <Shield
              className={`w-8 h-8 ${isDark ? "text-red-400" : "text-red-600"}`}
            />
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Student Verification
          </h2>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Enter your student ID to access the Economics 2025 class schedule
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="studentId"
              className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Student ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User
                  className={`w-5 h-5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                />
              </div>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your student ID"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-red-500/20"
                } focus:outline-none focus:ring-4`}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                isDark ? "bg-red-500/10" : "bg-red-50"
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-500"}`}
              />
              <p
                className={`text-sm ${isDark ? "text-red-300" : "text-red-600"}`}
              >
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !studentId.trim()}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading || !studentId.trim()
                ? "bg-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 shadow-lg hover:shadow-xl"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Verify & Access Schedule
              </>
            )}
          </button>
        </form>

        <div
          className={`mt-6 p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-green-400" : "text-green-500"}`}
            />
            <div>
              <p
                className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Your data is secure
              </p>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Your verification is saved locally in your browser. You won't
                need to verify again on this device.
              </p>
            </div>
          </div>
        </div>

        <p
          className={`text-center text-xs mt-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          Valid for Economics 2025 Batch students only
        </p>
      </div>
    </div>
  );
}
