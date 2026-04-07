import { useState, useEffect } from "react";
import { Shield, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StudentVerificationProps {
  isDark: boolean;
  onVerified: () => void;
}

const VALID_STUDENT_IDS = [
  "2023LXSB0301",
  "2023LXSB0302",
  "2023LXSB0303",
  "2023LXSB0304",
  "2023LXSB0305",
  "2023LXSB0306",
  "2023LXSB0307",
  "2023LXSB0308",
  "2023LXSB0309",
  "2023LXSB0310",
  "2023LXSB0311",
  "2023LXSB0312",
  "2023LXSB0313",
  "2023LXSB0314",
  "2023LXSB0315",
  "2023LXSB0316",
  "2023LXSB0317",
  "2023LXSB0318",
  "2023LXSB0319",
  "2023LXSB0320",
  "2023LXSB0321",
  "2023LXSB0322",
  "2023LXSB0323",
  "2023LXSB0324",
  "2023LXSB0325",
  "2023LXSB0326",
];

const STORAGE_KEY = "ncwu_cst2023_verified_student";

export function isStudentVerified(): boolean {
  try {
    const verified = localStorage.getItem(STORAGE_KEY);
    return verified === "true";
  } catch {
    return false;
  }
}

export function StudentVerification({
  isDark,
  onVerified,
}: StudentVerificationProps) {
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
      const trimmedId = studentId.trim().toUpperCase();

      if (!trimmedId) {
        setError("Please enter your student ID");
        setIsLoading(false);
        return;
      }

      if (VALID_STUDENT_IDS.includes(trimmedId)) {
        localStorage.setItem(STORAGE_KEY, "true");
        localStorage.setItem("ncwu_student_id", trimmedId);
        onVerified();
      } else {
        setError(
          "Invalid Student ID. This schedule is only for CST 2023 Batch students.",
        );
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
        className={`absolute inset-0 ${isDark ? "bg-slate-950/95" : "bg-slate-900/95"} backdrop-blur-xl`}
      />

      <div
        className={`relative w-full max-w-md ${
          isDark
            ? "bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/30"
            : "bg-gradient-to-br from-white to-slate-50 border border-red-200"
        } rounded-3xl shadow-2xl overflow-hidden`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl ${
              isDark ? "bg-red-500/20" : "bg-red-200/50"
            }`}
          />
          <div
            className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl ${
              isDark ? "bg-amber-500/20" : "bg-amber-200/50"
            }`}
          />
        </div>

        <div className="relative p-8">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
                isDark
                  ? "bg-gradient-to-br from-red-500/30 to-amber-500/30 border border-red-500/40"
                  : "bg-gradient-to-br from-red-100 to-amber-100 border border-red-200"
              }`}
            >
              <Shield
                className={`w-10 h-10 ${isDark ? "text-red-400" : "text-red-600"}`}
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
              This schedule is restricted to CST 2023 Batch students only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Enter your Student ID
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none`}
                >
                  <User
                    className={`w-5 h-5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your student ID"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                    isDark
                      ? "bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  } outline-none`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl ${
                  isDark
                    ? "bg-red-500/20 border border-red-500/30"
                    : "bg-red-50 border border-red-200"
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
                  : isDark
                    ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25"
                    : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
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
            Valid for CST 2023 Batch students only
          </p>
        </div>
      </div>
    </div>
  );
}
