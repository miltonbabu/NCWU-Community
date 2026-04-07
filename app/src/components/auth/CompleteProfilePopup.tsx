import { useEffect, useState } from "react";
import { X, UserCircle, AlertTriangle } from "lucide-react";

interface CompleteProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userPhoto?: string;
}

const PROFILE_POPUP_DISMISSED = "profile_popup_dismissed";

export function CompleteProfilePopup({
  isOpen,
  onClose,
  userName,
  userPhoto,
}: CompleteProfilePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const dismissed = localStorage.getItem(PROFILE_POPUP_DISMISSED);
      if (!dismissed) {
        setTimeout(() => setIsVisible(true), 100);
      } else {
        onClose();
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    localStorage.setItem(PROFILE_POPUP_DISMISSED, "true");
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative max-w-sm w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-1 shadow-2xl transition-all duration-300 transform ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-10 h-10 text-white" />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white">
              Complete Your Profile
            </h2>
          </div>

          <p className="text-white/90 text-sm mb-2">
            Welcome{userName ? `, ${userName}` : ""}!
          </p>

          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            You signed in with Google successfully! Please complete your profile
            to unlock all features of this platform.
          </p>

          <a
            href="/profile"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-indigo-600 font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <UserCircle className="w-5 h-5" />
            Go to Profile
          </a>

          <button
            onClick={handleClose}
            className="block w-full mt-3 text-white/70 hover:text-white text-sm transition-colors"
          >
            I'll do it later
          </button>
        </div>
      </div>
    </div>
  );
}
