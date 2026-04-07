import { useState, useRef } from "react";
import type { ClassSession } from "@/types/schedule";
import {
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Share2,
  Check,
  Heart,
  Bell,
  BellOff,
  EyeOff,
  StickyNote,
  X,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { SharePopup } from "./SharePopup";

interface ClassCardProps {
  classSession: ClassSession;
  isDark: boolean;
  isFavorite?: boolean;
  isHidden?: boolean;
  reminderMinutes?: number | null;
  customNote?: string;
  onToggleFavorite?: (id: string) => void;
  onToggleHidden?: (id: string) => void;
  onSetReminder?: (id: string, minutes: number) => void;
  onRemoveReminder?: (id: string) => void;
  onSetNote?: (id: string, note: string) => void;
  isAuthenticated?: boolean;
}

const reminderOptions = [
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
];

export function ClassCard({
  classSession,
  isDark,
  isFavorite = false,
  isHidden = false,
  reminderMinutes = null,
  customNote = "",
  onToggleFavorite,
  onToggleHidden,
  onSetReminder,
  onRemoveReminder,
  onSetNote,
  isAuthenticated = false,
}: ClassCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(customNote);
  const [sharePosition, setSharePosition] = useState<
    { x: number; y: number } | undefined
  >();
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const reminderButtonRef = useRef<HTMLButtonElement>(null);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📚 ${classSession.subject}
👨‍🏫 ${classSession.instructor}
📍 ${classSession.room}
📅 ${classSession.day} | Week ${classSession.week}
🕐 ${classSession.startTime} - ${classSession.endTime}
🌅 ${classSession.shift}${customNote ? `\n📝 ${customNote}` : ""}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Class details copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shareButtonRef.current) {
      const rect = shareButtonRef.current.getBoundingClientRect();
      setSharePosition({ x: rect.left + rect.width / 2, y: rect.bottom + 10 });
    }
    setShowSharePopup(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please sign in to save favorites");
      return;
    }
    onToggleFavorite?.(classSession.id);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleHiddenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please sign in to hide classes");
      return;
    }
    onToggleHidden?.(classSession.id);
    toast.success(
      isHidden ? "Class is now visible" : "Class hidden from schedule",
    );
  };

  const handleReminderSelect = (minutes: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to set reminders");
      setShowReminderMenu(false);
      return;
    }
    onSetReminder?.(classSession.id, minutes);
    toast.success(`Reminder set for ${minutes} minutes before class`);
    setShowReminderMenu(false);
  };

  const handleRemoveReminder = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to manage reminders");
      setShowReminderMenu(false);
      return;
    }
    onRemoveReminder?.(classSession.id);
    toast.success("Reminder removed");
    setShowReminderMenu(false);
  };

  const handleSaveNote = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save notes");
      return;
    }
    onSetNote?.(classSession.id, noteText);
    toast.success("Note saved");
    setShowNoteInput(false);
  };

  if (isHidden && !isExpanded) {
    return (
      <div
        className={`
          relative overflow-hidden rounded-xl border backdrop-blur-xl
          transition-all duration-300
          ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-100/50 border-slate-200"}
        `}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff
              className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <span
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Hidden: {classSession.subject}
            </span>
          </div>
          <button
            onClick={handleHiddenClick}
            className={`text-xs px-2 py-1 rounded-lg ${
              isDark
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-200 hover:bg-slate-300"
            }`}
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`
          relative overflow-hidden rounded-xl border backdrop-blur-xl
          transition-all duration-300 ease-out
          hover:scale-[1.02] hover:shadow-xl
          ${classSession.bg} ${classSession.border}
          ${isFavorite ? "ring-2 ring-pink-500/50" : ""}
        `}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

        {isFavorite && (
          <div className="absolute top-2 left-2">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          </div>
        )}

        {reminderMinutes && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs">
              <Bell className="w-3 h-3" />
              <span>{reminderMinutes}m</span>
            </div>
          </div>
        )}

        <div className="relative p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${classSession.bg} ring-1 ring-white/20`}
              >
                <BookOpen className={`w-5 h-5 ${classSession.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-base font-bold ${classSession.text} truncate`}
                >
                  {classSession.subject}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock
                    className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <span
                    className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {classSession.startTime} - {classSession.endTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {onToggleFavorite && (
                <button
                  onClick={handleFavoriteClick}
                  className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isFavorite
                      ? "text-pink-500"
                      : isDark
                        ? "hover:bg-white/10 text-slate-400"
                        : "hover:bg-black/5 text-slate-500"
                  }`}
                  title={
                    isAuthenticated
                      ? isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"
                      : "Sign in to save favorites"
                  }
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                </button>
              )}
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
                title="Copy class details"
              >
                {copied ? (
                  <Check className={`w-4 h-4 text-green-500`} />
                ) : (
                  <Copy
                    className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                )}
              </button>
              <button
                ref={shareButtonRef}
                onClick={handleShareClick}
                className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
                title="Share class"
              >
                <Share2
                  className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
                title="Show more details"
              >
                {isExpanded ? (
                  <ChevronUp
                    className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                ) : (
                  <ChevronDown
                    className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <User
                className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              />
              <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                {classSession.instructor}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin
                className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              />
              <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                {classSession.room}
              </span>
            </div>
          </div>

          {customNote && !showNoteInput && (
            <div
              className={`mt-3 p-2 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
            >
              <div className="flex items-start gap-2">
                <StickyNote
                  className={`w-4 h-4 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {customNote}
                </p>
              </div>
            </div>
          )}

          {isExpanded && (
            <div
              className={`mt-4 pt-4 border-t ${isDark ? "border-slate-600" : "border-slate-200"} space-y-3`}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div
                  className={`p-2 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                >
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Week
                  </p>
                  <p
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Week {classSession.week}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                >
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Day
                  </p>
                  <p
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {classSession.day}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                >
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Shift
                  </p>
                  <p
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {classSession.shift}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                >
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Type
                  </p>
                  <p
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {classSession.type || "Lecture"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {onSetReminder && (
                  <div className="relative">
                    <button
                      ref={reminderButtonRef}
                      onClick={() => setShowReminderMenu(!showReminderMenu)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        reminderMinutes
                          ? "bg-amber-500/20 text-amber-600"
                          : isDark
                            ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {reminderMinutes ? (
                        <>
                          <BellOff className="w-4 h-4" />
                          <span>Reminder ({reminderMinutes}m)</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          <span>Set Reminder</span>
                          {!isAuthenticated && (
                            <Lock className="w-3 h-3 ml-1 opacity-50" />
                          )}
                        </>
                      )}
                    </button>
                    {showReminderMenu && (
                      <div
                        className={`absolute top-full left-0 mt-1 z-20 rounded-xl shadow-xl border overflow-hidden ${
                          isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="py-1 min-w-[150px]">
                          {reminderOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleReminderSelect(opt.value)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                isDark
                                  ? "hover:bg-slate-700 text-slate-300"
                                  : "hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                          {reminderMinutes && (
                            <button
                              onClick={handleRemoveReminder}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors text-red-500 ${
                                isDark
                                  ? "hover:bg-slate-700"
                                  : "hover:bg-slate-100"
                              }`}
                            >
                              Remove Reminder
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {onSetNote && (
                  <button
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      customNote
                        ? "bg-blue-500/20 text-blue-600"
                        : isDark
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    <StickyNote className="w-4 h-4" />
                    <span>{customNote ? "Edit Note" : "Add Note"}</span>
                    {!isAuthenticated && !customNote && (
                      <Lock className="w-3 h-3 ml-1 opacity-50" />
                    )}
                  </button>
                )}

                {onToggleHidden && (
                  <button
                    onClick={handleHiddenClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isDark
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Hide Class</span>
                    {!isAuthenticated && (
                      <Lock className="w-3 h-3 ml-1 opacity-50" />
                    )}
                  </button>
                )}
              </div>

              {showNoteInput && (
                <div
                  className={`p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Personal Note
                    </span>
                    <button
                      onClick={() => setShowNoteInput(false)}
                      className={`p-1 rounded-lg ${isDark ? "hover:bg-slate-600" : "hover:bg-slate-200"}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a personal note for this class..."
                    className={`w-full p-2 rounded-lg text-sm resize-none ${
                      isDark
                        ? "bg-slate-600 text-white placeholder-slate-400 border-slate-500"
                        : "bg-white text-slate-900 placeholder-slate-400 border-slate-200"
                    } border`}
                    rows={2}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setNoteText("");
                        onSetNote?.(classSession.id, "");
                        setShowNoteInput(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        isDark
                          ? "bg-slate-600 hover:bg-slate-500"
                          : "bg-slate-200 hover:bg-slate-300"
                      }`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="px-3 py-1 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SharePopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        classSession={classSession}
        position={sharePosition}
      />
    </>
  );
}
