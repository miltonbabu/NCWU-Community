import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import type { ClassSession } from "@/types/schedule";
import {
  X,
  Link2,
  Check,
  MessageCircle,
  Facebook,
  Instagram,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  classSession: ClassSession | null;
  position?: { x: number; y: number };
}

interface ShareStats {
  wechat: number;
  facebook: number;
  messenger: number;
  instagram: number;
  copyLink: number;
}

const STORAGE_KEY = "ncwu_share_stats";

function getShareStats(): ShareStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error("Failed to load share stats");
  }
  return { wechat: 0, facebook: 0, messenger: 0, instagram: 0, copyLink: 0 };
}

function saveShareStats(stats: ShareStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    console.error("Failed to save share stats");
  }
}

function trackShare(platform: keyof ShareStats): void {
  const stats = getShareStats();
  stats[platform]++;
  saveShareStats(stats);
  console.log(`[Share Tracking] ${platform} shared. Total: ${stats[platform]}`);
}

export function SharePopup({
  isOpen,
  onClose,
  classSession,
  position,
}: SharePopupProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [copied, setCopied] = useState(() => false);
  const popupRef = useRef<HTMLDivElement>(null);

  const shareUrl = classSession
    ? `${window.location.origin}${window.location.pathname}?class=${classSession.id}`
    : window.location.href;

  const shareText = classSession
    ? `📚 ${classSession.subject}\n👨‍🏫 ${classSession.instructor}\n📍 ${classSession.room}\n📅 ${classSession.day} | Week ${classSession.week}\n🕐 ${classSession.startTime} - ${classSession.endTime}\n\nCheck out this class schedule!`
    : "Check out NCWU Community Class Schedule!";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare("copyLink");
      toast.success("Link copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWeChatShare = () => {
    trackShare("wechat");

    try {
      const newWindow = window.open("weixin://", "_blank");
      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed === "undefined"
      ) {
        navigator.clipboard.writeText(shareText + "\n\n" + shareUrl);
        toast.success("Link copied! Open WeChat to share.", { duration: 4000 });
      }
    } catch {
      navigator.clipboard.writeText(shareText + "\n\n" + shareUrl);
      toast.success("Link copied! Open WeChat to share.", { duration: 4000 });
    }
    onClose();
  };

  const handleFacebookShare = () => {
    trackShare("facebook");
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, "_blank", "width=600,height=400,scrollbars=yes");
    onClose();
  };

  const handleMessengerShare = () => {
    trackShare("messenger");
    const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}`;

    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      )
    ) {
      const mobileMessengerUrl = `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`;
      window.location.href = mobileMessengerUrl;
    } else {
      window.open(
        messengerUrl,
        "_blank",
        "width=600,height=400,scrollbars=yes",
      );
    }
    onClose();
  };

  const handleInstagramShare = () => {
    trackShare("instagram");
    navigator.clipboard.writeText(shareText + "\n\n" + shareUrl);
    toast.success("Content copied! Open Instagram to paste and share.", {
      duration: 4000,
    });

    const instagramUrl = "https://www.instagram.com/";
    window.open(instagramUrl, "_blank");
    onClose();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: classSession
            ? `${classSession.subject} - NCWU Schedule`
            : "NCWU Community",
          text: shareText,
          url: shareUrl,
        });
        trackShare("copyLink");
        toast.success("Shared successfully!");
        onClose();
      } catch {
        console.log("Share cancelled or failed");
      }
    }
  };

  const shareOptions = [
    {
      name: "WeChat",
      icon: MessageCircle,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      textColor: "text-white",
      onClick: handleWeChatShare,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
      textColor: "text-white",
      onClick: handleFacebookShare,
    },
    {
      name: "Messenger",
      icon: MessageCircle,
      color: "bg-gradient-to-br from-blue-500 to-purple-600",
      hoverColor: "hover:from-blue-600 hover:to-purple-700",
      textColor: "text-white",
      onClick: handleMessengerShare,
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      hoverColor:
        "hover:from-purple-600 hover:via-pink-600 hover:to-orange-500",
      textColor: "text-white",
      onClick: handleInstagramShare,
    },
  ];

  if (!isOpen) return null;

  const popupStyle: React.CSSProperties = position
    ? {
        position: "fixed",
        top: position.y,
        left: position.x,
        transform: "translate(-50%, 0)",
        zIndex: 100,
      }
    : {};

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className={`
        ${!position ? "fixed inset-0 z-50 flex items-center justify-center p-4" : "z-50"}
      `}
    >
      {!position && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      <div
        className={`
          relative overflow-hidden rounded-2xl backdrop-blur-xl border shadow-2xl
          animate-scale-in
          ${
            isDark
              ? "bg-slate-900/95 border-slate-700"
              : "bg-white/95 border-slate-200"
          }
          ${position ? "w-64" : "w-full max-w-sm"}
        `}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-4">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Share
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-white/10 text-slate-400"
                  : "hover:bg-slate-100 text-slate-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {classSession && (
            <div
              className={`mb-4 p-3 rounded-xl ${
                isDark ? "bg-white/5" : "bg-slate-50"
              }`}
            >
              <p
                className={`text-sm font-semibold truncate ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {classSession.subject}
              </p>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {classSession.day} | {classSession.startTime} -{" "}
                {classSession.endTime}
              </p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-4">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.name}
                  onClick={option.onClick}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl
                    transition-all duration-200 hover:scale-105
                    ${option.color} ${option.hoverColor}
                  `}
                  title={option.name}
                >
                  <Icon className={`w-6 h-6 ${option.textColor}`} />
                  <span
                    className={`text-[10px] mt-1 font-medium ${option.textColor}`}
                  >
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopyLink}
            className={`
              w-full flex items-center justify-center gap-2 p-3 rounded-xl
              transition-all duration-200 hover:scale-[1.02]
              ${
                copied
                  ? "bg-green-500 text-white"
                  : isDark
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span className="font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5" />
                <span className="font-medium">Copy Link</span>
              </>
            )}
          </button>

          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className={`
                w-full flex items-center justify-center gap-2 p-3 rounded-xl mt-2
                transition-all duration-200 hover:scale-[1.02]
                ${
                  isDark
                    ? "bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-300"
                    : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                }
              `}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">More Options</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: ${position ? "translate(-50%, 0) scale(0.9)" : "scale(0.9)"};
          }
          to {
            opacity: 1;
            transform: ${position ? "translate(-50%, 0) scale(1)" : "scale(1)"};
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export function useShareStats() {
  return {
    getStats: getShareStats,
    resetStats: () =>
      saveShareStats({
        wechat: 0,
        facebook: 0,
        messenger: 0,
        instagram: 0,
        copyLink: 0,
      }),
  };
}
