import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  X,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

interface RestrictionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  restriction: {
    id: string;
    reason: string;
    source: string;
    detected_words?: string[];
    restriction_days: number;
    restriction_ends_at: string | null;
    created_at: string;
  } | null;
  restrictedFeatures: string[];
  isDark?: boolean;
}

export function RestrictionPopup({
  isOpen,
  onClose,
  restriction,
  restrictedFeatures,
  isDark = false,
}: RestrictionPopupProps) {
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !restriction) return null;

  const handleSubmitAppeal = async () => {
    if (!appealMessage.trim() || appealMessage.trim().length < 10) {
      toast.error("Appeal must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.submitAppeal(restriction.id, appealMessage);
      if (response.success) {
        toast.success("Appeal submitted successfully!");
        setShowAppealForm(false);
        setAppealMessage("");
        onClose();
      } else {
        toast.error(response.message || "Failed to submit appeal");
      }
    } catch (error) {
      toast.error("Failed to submit appeal");
    }
    setSubmitting(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Lifetime";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          isDark
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3
              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Access Restricted
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div
            className={`p-4 rounded-xl ${isDark ? "bg-red-500/10" : "bg-red-50"}`}
          >
            <p
              className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-600"}`}
            >
              Your account has been restricted from this action.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <p
              className={`text-sm font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Reason:
            </p>
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              {restriction.reason}
            </p>

            <div className="flex items-center gap-2 mt-3 text-xs">
              <span
                className={isDark ? "text-slate-400" : "text-slate-500"}
              >
                Source: {restriction.source.replace("_", " ")}
              </span>
              <span
                className={isDark ? "text-slate-400" : "text-slate-500"}
              >
                • {restriction.restriction_days} days
              </span>
            </div>

            {restriction.detected_words &&
              restriction.detected_words.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {restriction.detected_words.slice(0, 5).map((word, index) => (
                    <span
                      key={index}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isDark
                          ? "bg-red-500/20 text-red-300"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              )}

            <div
              className={`flex items-center gap-2 mt-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {restriction.restriction_ends_at
                  ? `Expires: ${formatDate(restriction.restriction_ends_at)}`
                  : "Permanent restriction"}
              </span>
            </div>

            {restrictedFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {restrictedFeatures.map((feature) => (
                  <Badge
                    key={feature}
                    variant="outline"
                    className={`text-xs ${
                      isDark
                        ? "border-red-500/30 text-red-400"
                        : "border-red-200 text-red-600"
                    }`}
                  >
                    {feature.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {!showAppealForm ? (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAppealForm(true)}
                className={`w-full ${
                  isDark
                    ? "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                    : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Submit an Appeal
              </Button>
              <Link
                to="/profile"
                className="text-center text-sm text-indigo-500 hover:text-indigo-600"
              >
                View all restrictions in profile →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Explain why you believe this restriction should be lifted..."
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                className={`${isDark ? "bg-slate-700 border-slate-600" : ""}`}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitAppeal}
                  disabled={submitting || appealMessage.trim().length < 10}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Appeal
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAppealForm(false);
                    setAppealMessage("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
