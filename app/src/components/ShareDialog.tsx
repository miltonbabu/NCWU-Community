import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { ClassSession } from "@/types/schedule";
import { useTheme } from "./ThemeProvider";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classSession: ClassSession | null;
}

// Social media platforms
const socialPlatforms = [
  {
    name: "WeChat",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
      </svg>
    ),
    color: "bg-green-500 hover:bg-green-600",
    getUrl: (text: string, url: string) =>
      `weixin://dl/chat?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
    color: "bg-green-600 hover:bg-green-700",
    getUrl: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "bg-blue-600 hover:bg-blue-700",
    getUrl: (text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    name: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    color:
      "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getUrl: (_text: string, _url: string) => `https://www.instagram.com/`,
  },
  {
    name: "Messenger",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.744 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.559 6.963z" />
      </svg>
    ),
    color: "bg-blue-500 hover:bg-blue-600",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getUrl: (_text: string, _url: string) => `https://www.messenger.com/`,
  },
];

export function ShareDialog({
  isOpen,
  onClose,
  classSession,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!classSession) return null;

  const shareText = `${classSession.subject} - ${classSession.day}, Week ${classSession.week} | ${classSession.startTime}-${classSession.endTime}`;

  // Generate shareable link
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "";
  const shareUrl = `${baseUrl}?class=${classSession.id}`;

  const handleCopyInfo = async () => {
    const fullText = `${shareText}\n👤 ${classSession.instructor}\n📍 ${classSession.room}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Class info copied!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("Link copied!", { duration: 2000 });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (platform: (typeof socialPlatforms)[0]) => {
    const url = platform.getUrl(shareText, shareUrl);
    window.open(url, "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-md ${isDark ? "bg-slate-900/95 border-white/20" : "bg-white/95 border-slate-200"} backdrop-blur-xl`}
      >
        <DialogHeader>
          <DialogTitle
            className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center gap-3`}
          >
            <Share2
              className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
            />
            Share Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Class Info Preview */}
          <div
            className={`p-4 rounded-2xl ${classSession.bg} ${classSession.border} border`}
          >
            <h4 className={`font-bold text-lg mb-2 ${classSession.text}`}>
              {classSession.subject}
            </h4>
            <div className={`space-y-1 text-sm ${classSession.text}`}>
              <p>
                {classSession.day}, Week {classSession.week}
              </p>
              <p>
                {classSession.startTime} - {classSession.endTime}
              </p>
              <p>{classSession.instructor}</p>
              <p>{classSession.room}</p>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <label
              className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}
            >
              Copy Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className={`flex-1 ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} text-sm`}
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className={`shrink-0 ${isDark ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"}`}
              >
                {linkCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <label
              className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}
            >
              Share to
            </label>
            <div className="grid grid-cols-5 gap-2">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl
                    transition-all duration-200 hover:scale-105 active:scale-95
                    ${platform.color} text-white
                  `}
                  title={platform.name}
                >
                  {platform.icon}
                  <span className="text-[10px] font-medium">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Full Info Button */}
          <Button
            onClick={handleCopyInfo}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Full Class Info
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
