import { useEffect, useState } from "react";
import { X, User, Sparkles, Settings } from "lucide-react";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  type: "login" | "signup";
}

export function WelcomePopup({
  isOpen,
  onClose,
  userName,
  type,
}: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const duration = type === "signup" ? 2500 : 1000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, type]);

  if (!isOpen) return null;

  const isLogin = type === "login";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "bg-black/30 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 transform ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        } bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-white/20`}
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

        <div className="relative p-8 text-center">
          <div
            className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
              isLogin
                ? "bg-white/20"
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            }`}
          >
            {isLogin ? (
              <User className="w-8 h-8 text-white" />
            ) : (
              <Sparkles className="w-8 h-8 text-white" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back!" : "Welcome to NCWU!"}
          </h2>

          <p className="text-white/90 text-sm">
            {isLogin
              ? userName
                ? `Great to see you again, ${userName}!`
                : "Great to see you again!"
              : userName
                ? `Nice to meet you, ${userName}!`
                : "Your account has been created!"}
          </p>

          {!isLogin && (
            <a
              href="/profile"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Settings className="w-4 h-4" />
              Go to Profile to Setup Your Account
            </a>
          )}

          <div className="mt-4 flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
