import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../components/ThemeProvider";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useRestriction } from "../hooks/useRestriction";
import { discordApi } from "../lib/api";
import { RestrictionPopup } from "../components/RestrictionPopup";
import type {
  DiscordGroup,
  DiscordMessage,
  DiscordGroupMember,
} from "../types/discord";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  MessageSquare,
  Send,
  Users,
  Hash,
  Eye,
  Trash2,
  Reply,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Circle,
  Shield,
  Home,
  User,
  Palette,
  Sparkles,
  Settings,
  X,
  Check,
  Globe,
  Image,
  Loader2,
  Share2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ImageViewer } from "../components/ImageViewer";

type ThemeColor = "blue" | "purple" | "green" | "orange" | "pink" | "teal";
type BackgroundType = "gradient" | "image1" | "image2" | "image3" | "image4";

interface ThemeSettings {
  color: ThemeColor;
  background: BackgroundType;
}

const themeColors: Record<
  ThemeColor,
  { primary: string; secondary: string; accent: string; gradient: string }
> = {
  blue: {
    primary: "bg-blue-600",
    secondary: "bg-blue-100 dark:bg-blue-900/30",
    accent: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-cyan-500",
  },
  purple: {
    primary: "bg-purple-600",
    secondary: "bg-purple-100 dark:bg-purple-900/30",
    accent: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500 to-pink-500",
  },
  green: {
    primary: "bg-emerald-600",
    secondary: "bg-emerald-100 dark:bg-emerald-900/30",
    accent: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500 to-teal-500",
  },
  orange: {
    primary: "bg-orange-600",
    secondary: "bg-orange-100 dark:bg-orange-900/30",
    accent: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-500 to-amber-500",
  },
  pink: {
    primary: "bg-pink-600",
    secondary: "bg-pink-100 dark:bg-pink-900/30",
    accent: "text-pink-600 dark:text-pink-400",
    gradient: "from-pink-500 to-rose-500",
  },
  teal: {
    primary: "bg-teal-600",
    secondary: "bg-teal-100 dark:bg-teal-900/30",
    accent: "text-teal-600 dark:text-teal-400",
    gradient: "from-teal-500 to-cyan-500",
  },
};

const backgroundImages: Record<BackgroundType, { url: string; name: string }> =
  {
    gradient: {
      url: "",
      name: "Gradient",
    },
    image1: {
      url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80",
      name: "Rainbow",
    },
    image2: {
      url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80",
      name: "Purple Gradient",
    },
    image3: {
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80",
      name: "Abstract",
    },
    image4: {
      url: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80",
      name: "Space",
    },
  };

export default function DiscordPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.28);
    } catch {
      // ignore audio errors
    }
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isRestricted, restriction, checkFeature } = useRestriction();
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const {
    socket,
    isConnected,
    typingUsers,
    joinGroup,
    leaveGroup,
    startTyping,
    stopTyping,
    markViewed,
  } = useSocket();

  const [groups, setGroups] = useState<DiscordGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DiscordGroup | null>(null);
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [members, setMembers] = useState<DiscordGroupMember[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [replyingTo, setReplyingTo] = useState<DiscordMessage | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [showGroupList, setShowGroupList] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [nickname, setNickname] = useState("");
  const [displayStudentId, setDisplayStudentId] = useState(false);
  const [nicknameGroupId, setNicknameGroupId] = useState<string | null>(null);

  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem("discord-theme");
    return saved
      ? JSON.parse(saved)
      : { color: "blue", background: "gradient" };
  });

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareContent, setShareContent] = useState<string>("");
  const [shareImages, setShareImages] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewedMessagesRef = useRef<Set<string>>(new Set());
  const groupsLoadedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("discord-theme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    const shareParam = searchParams.get("share");
    const contentParam = searchParams.get("content");
    const imagesParam = searchParams.get("images");

    if (shareParam === "true" && contentParam) {
      setShareContent(decodeURIComponent(contentParam));
      if (imagesParam) {
        try {
          const images = JSON.parse(decodeURIComponent(imagesParam));
          setShareImages(images);
        } catch {
          setShareImages([]);
        }
      }
      setShowShareDialog(true);
      searchParams.delete("share");
      searchParams.delete("content");
      searchParams.delete("images");
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await discordApi.getGroups();
      if (response.success) {
        setGroups(response.data);
        if (
          response.data.length > 0 &&
          !selectedGroup &&
          !groupsLoadedRef.current
        ) {
          groupsLoadedRef.current = true;
          setSelectedGroup(response.data[0]);
        }
      }
    } catch {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  const loadMessages = useCallback(async (groupId: string) => {
    try {
      setMessagesLoading(true);
      const response = await discordApi.getMessages(groupId);
      if (response.success) {
        setMessages(response.data);
        setHasMoreMessages(response.pagination?.hasMore);
        viewedMessagesRef.current.clear();
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (groupId: string) => {
    try {
      const response = await discordApi.getMembers(groupId);
      if (response.success) {
        setMembers(response.data);
      }
    } catch {
      toast.error("Failed to load members");
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user, loadGroups]);

  useEffect(() => {
    if (!selectedGroup) return;

    joinGroup(selectedGroup.id);

    loadMessages(selectedGroup.id);
    loadMembers(selectedGroup.id);

    discordApi.markAsRead(selectedGroup.id).then(() => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id ? { ...g, unread_count: 0 } : g,
        ),
      );
    });
  }, [selectedGroup, loadMessages, loadMembers, joinGroup]);

  useEffect(() => {
    if (!selectedGroup || !socket) return;

    socket.on("new_message", (message: DiscordMessage) => {
      if (message.group_id === selectedGroup.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        markViewed(selectedGroup.id, [message.id]);
        setTimeout(() => scrollToBottom("smooth"), 100);
        if (message.user_id !== user?.id) {
          playNotificationSound();
        }
      }
    });

    socket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on("user_joined", () => {
      loadMembers(selectedGroup.id);
    });

    socket.on("user_left", () => {
      loadMembers(selectedGroup.id);
    });

    return () => {
      leaveGroup(selectedGroup.id);
      socket.off("new_message");
      socket.off("message_deleted");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, [selectedGroup, socket, leaveGroup, markViewed, loadMembers, user]);

  useEffect(() => {
    // Scroll to bottom when messages change, with a small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Scroll to bottom when messages finish loading (instant scroll for initial load)
  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messagesLoading, messages.length]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMoreMessages) {
        loadMoreMessages();
      }

      const visibleMessages = container.querySelectorAll("[data-message-id]");
      visibleMessages.forEach((msgEl) => {
        const rect = msgEl.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const messageId = msgEl.getAttribute("data-message-id");
          if (messageId && !viewedMessagesRef.current.has(messageId)) {
            viewedMessagesRef.current.add(messageId);
            markViewed(selectedGroup?.id || "", [messageId]);
          }
        }
      });
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedGroup, hasMoreMessages]);

  const loadMoreMessages = async () => {
    if (!selectedGroup || messages.length === 0) return;
    try {
      const response = await discordApi.getMessages(
        selectedGroup.id,
        50,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages[0]?.created_at as any,
      );
      if (response.success) {
        setMessages((prev) => [...response.data, ...prev]);
        setHasMoreMessages(response.pagination?.hasMore);
      }
    } catch {
      toast.error("Failed to load more messages");
    }
  };

  const handleSaveNickname = async () => {
    if (!nicknameGroupId) return;
    try {
      await discordApi.updateNickname(
        nicknameGroupId,
        nickname,
        displayStudentId,
      );
      setShowNicknameDialog(false);
      setNicknameGroupId(null);
      setNickname("");
      setDisplayStudentId(false);
      toast.success("Settings saved!");
      if (selectedGroup) {
        loadMembers(selectedGroup.id);
      }
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!selectedGroup || (!messageInput.trim() && !selectedImage) || !user)
      return;

    if (isRestricted && checkFeature("discord")) {
      setShowRestrictionPopup(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);

        const token = localStorage.getItem("auth_token");

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const uploadResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/upload/discord-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!uploadResponse.ok) {
          toast.error("Failed to upload image");
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData.success || !uploadData.data?.url) {
          toast.error(uploadData.message || "Image upload failed");
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
        imageUrl = uploadData.data.url;
      }

      const response = await discordApi.sendMessage(
        selectedGroup.id,
        messageInput,
        isAnonymous,
        replyingTo?.id,
        imageUrl,
      );

      if (!response.success) {
        toast.error(response.message || "Failed to send message");
        return;
      }

      setMessageInput("");
      setReplyingTo(null);
      setSelectedImage(null);
      setImagePreview(null);
      stopTyping(selectedGroup.id);

      if (response.data?.flagged) {
        toast.warning("Message was flagged for review");
        return;
      }

      if (response.data?.id) {
        setMessages((prev) => [...prev, response.data]);
        setTimeout(() => scrollToBottom("smooth"), 100);
      }
    } catch (err) {
      console.error("[Discord] Send message error:", err);
      toast.error("Failed to send message");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await discordApi.deleteMessage(messageId);
      if (response.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message deleted");
      }
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (selectedGroup) {
      startTyping(selectedGroup.id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedGroup.id);
      }, 2000);
    }
  };

  const formatTime = (dateString: string) => {
    // SQLite stores datetime as "YYYY-MM-DD HH:MM:SS" in UTC
    // We need to explicitly parse it as UTC by appending 'Z'
    const utcDateString = dateString.includes("T")
      ? dateString
      : dateString.replace(" ", "T") + "Z";

    const date = new Date(utcDateString);
    const now = new Date();

    // Calculate difference in milliseconds
    const diff = now.getTime() - date.getTime();

    // Debug: log if difference seems wrong
    if (diff < 0 || diff > 86400000 * 365) {
      // More than a year difference indicates parsing issue
      console.log("Date parse issue:", dateString, "parsed as:", date);
      return "Just now";
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const parseContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: { text: string; isUrl: boolean; url?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: content.slice(lastIndex, match.index),
          isUrl: false,
        });
      }
      parts.push({ text: match[0], isUrl: true, url: match[0] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), isUrl: false });
    }

    return parts.length > 0 ? parts : [{ text: content, isUrl: false }];
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const currentTheme = themeColors[theme.color];
  const currentBg = backgroundImages[theme.background];

  const getBackgroundStyle = () => {
    if (theme.background === "gradient") {
      return {
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        backgroundImage: `linear-gradient(135deg, 
          hsl(var(--background)) 0%, 
          hsl(var(--muted)) 50%, 
          hsl(var(--background)) 100%)`,
      };
    }
    return {
      backgroundImage: `url(${currentBg.url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400">Loading Discord...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className={`flex h-screen relative overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 z-0 transition-all duration-500"
        style={getBackgroundStyle()}
      />
      {theme.background !== "gradient" && (
        <div
          className={`absolute inset-0 z-0 ${isDark ? "bg-black/40" : "bg-black/20"} backdrop-blur-sm`}
        />
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex w-full h-full">
        {/* Mobile Overlay - click to close sidebar */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
        )}
        {/* Sidebar */}
        <div
          className={cn(
            showSidebar ? "w-72" : "w-0 overflow-hidden",
            "backdrop-blur-xl flex flex-col transition-all duration-300 h-full relative z-50",
            isDark ? "border-r border-white/10" : "border-r border-slate-200",
            theme.background === "gradient"
              ? isDark
                ? "bg-card/80"
                : "bg-white/80"
              : isDark
                ? "bg-slate-900/80"
                : "bg-white/80",
            !showGroupList && !showSidebar && "hidden md:flex",
          )}
        >
          <div
            className={cn(
              "p-4 border-b flex-shrink-0",
              isDark ? "border-white/10" : "border-slate-200",
            )}
          >
            <div className="flex items-center justify-between">
              <h2
                className={cn(
                  "text-lg font-semibold flex items-center gap-2",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg relative",
                    currentTheme.primary,
                  )}
                >
                  <MessageSquare className="h-5 w-5 text-white" />
                  {(() => {
                    const totalUnread = groups.reduce(
                      (sum, g) => sum + (g.unread_count || 0),
                      0,
                    );
                    return totalUnread > 0 ? (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </div>
                    ) : null;
                  })()}
                </div>
                Discord
              </h2>
              <div className="flex items-center gap-1">
                <Link to="/language-exchange">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200",
                    )}
                    title="Language Exchange"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThemeDialog(true)}
                  className={cn(
                    isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200",
                  )}
                >
                  <Palette className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setShowSidebar(false)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isDark
                      ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200"
                      : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-700",
                  )}
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 h-full overflow-hidden">
            <div className="p-2 space-y-1">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowGroupList(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200",
                    selectedGroup?.id === group.id
                      ? `${currentTheme.primary} text-white shadow-lg`
                      : isDark
                        ? "hover:bg-white/10 text-slate-300"
                        : "hover:bg-slate-200 text-slate-700",
                  )}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center relative",
                        selectedGroup?.id === group.id
                          ? "bg-white/20"
                          : currentTheme.secondary,
                      )}
                    >
                      <Hash
                        className={cn(
                          "h-5 w-5",
                          selectedGroup?.id === group.id
                            ? "text-white"
                            : currentTheme.accent,
                        )}
                      />
                      {group.unread_count && group.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          {group.unread_count > 99 ? "99+" : group.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{group.name}</span>
                      {group.type === "all" && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs border-0",
                            isDark
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-700",
                          )}
                        >
                          All
                        </Badge>
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-xs truncate flex items-center gap-2",
                        isDark ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {group.online_count || 0} online
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{group.member_count} members</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {selectedGroup ? (
            <>
              {/* Header */}
              <div
                className={cn(
                  "h-14 backdrop-blur-xl flex items-center px-4 gap-4 border-b",
                  isDark ? "border-white/10" : "border-slate-200",
                  theme.background === "gradient"
                    ? isDark
                      ? "bg-card/80"
                      : "bg-white/80"
                    : isDark
                      ? "bg-slate-900/80"
                      : "bg-white/80",
                )}
              >
                <button
                  onClick={() => setShowSidebar(showSidebar ? false : true)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDark
                      ? "hover:bg-white/10 text-white"
                      : "hover:bg-slate-200 text-slate-900",
                  )}
                  title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                  {showSidebar ? (
                    <ChevronLeft className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/")}
                    className={
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className={
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <div
                    className={cn("p-1.5 rounded-lg", currentTheme.secondary)}
                  >
                    <Hash className={cn("h-4 w-4", currentTheme.accent)} />
                  </div>
                  <span
                    className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-slate-900",
                    )}
                  >
                    {selectedGroup.name}
                  </span>
                </div>

                <div className="flex-1" />

                {selectedGroup.type === "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNicknameGroupId(selectedGroup.id);
                      setShowNicknameDialog(true);
                    }}
                    className={
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMembers(!showMembers)}
                  className={cn(
                    "hidden md:flex",
                    isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200",
                  )}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {members.length}
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <>
                    <div
                      ref={messagesContainerRef}
                      className={cn(
                        "flex-1 p-4 overflow-y-auto min-h-0",
                        theme.background === "gradient"
                          ? "bg-transparent"
                          : isDark
                            ? "bg-slate-900/50"
                            : "bg-white/50",
                      )}
                    >
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div
                            className={cn(
                              "p-4 rounded-2xl mb-4",
                              currentTheme.secondary,
                            )}
                          >
                            <Sparkles
                              className={cn("h-12 w-12", currentTheme.accent)}
                            />
                          </div>
                          <h3
                            className={cn(
                              "text-lg font-semibold mb-2",
                              isDark ? "text-white" : "text-slate-900",
                            )}
                          >
                            Start the conversation!
                          </h3>
                          <p
                            className={
                              isDark ? "text-slate-400" : "text-slate-500"
                            }
                          >
                            Be the first to send a message
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {hasMoreMessages && (
                            <div
                              className={cn(
                                "text-center text-sm py-2",
                                isDark ? "text-slate-400" : "text-slate-500",
                              )}
                            >
                              ↑ Scroll up for more messages
                            </div>
                          )}
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              data-message-id={msg.id}
                              className={cn(
                                "group flex gap-3 p-2 rounded-xl transition-colors",
                                isDark
                                  ? "hover:bg-white/5"
                                  : "hover:bg-slate-100",
                              )}
                            >
                              <Avatar
                                className={cn(
                                  "h-10 w-10 flex-shrink-0 ring-2",
                                  isDark ? "ring-white/10" : "ring-slate-200",
                                )}
                              >
                                {msg.author?.avatar_url ? (
                                  <AvatarImage src={msg.author.avatar_url} />
                                ) : (
                                  <AvatarFallback
                                    className={cn(
                                      currentTheme.secondary,
                                      currentTheme.accent,
                                    )}
                                  >
                                    {msg.author?.display_name?.[0] || "?"}
                                  </AvatarFallback>
                                )}
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span
                                    className={cn(
                                      "font-semibold text-sm flex items-center gap-1",
                                      isDark ? "text-white" : "text-slate-900",
                                    )}
                                  >
                                    {msg.author?.display_name || "Unknown"}
                                    {msg.author?.show_as_admin && (
                                      <Badge
                                        variant="default"
                                        className={cn(
                                          "text-xs",
                                          currentTheme.primary,
                                        )}
                                      >
                                        <Shield className="h-3 w-3 mr-1" />
                                        Verified
                                      </Badge>
                                    )}
                                  </span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className={cn(
                                          "text-xs cursor-help",
                                          isDark
                                            ? "text-slate-500"
                                            : "text-slate-400",
                                        )}
                                      >
                                        {formatTime(msg.created_at)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {new Date(
                                        msg.created_at,
                                      ).toLocaleString()}
                                    </TooltipContent>
                                  </Tooltip>
                                  {msg.is_anonymous && (
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 border-0",
                                        isDark
                                          ? "bg-indigo-500/20 text-indigo-300"
                                          : "bg-indigo-100 text-indigo-600",
                                      )}
                                    >
                                      Anonymous
                                    </Badge>
                                  )}
                                  <div className="flex-1" />
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                    {msg.view_count > 0 && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div
                                            className={cn(
                                              "flex items-center gap-1 text-xs",
                                              isDark
                                                ? "text-slate-500"
                                                : "text-slate-400",
                                            )}
                                          >
                                            <Eye className="h-3 w-3" />
                                            {msg.view_count}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Viewed {msg.view_count} times
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setReplyingTo(msg)}
                                      className={cn(
                                        "h-7 w-7 p-0",
                                        isDark
                                          ? "text-slate-400 hover:text-white hover:bg-white/10"
                                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
                                      )}
                                    >
                                      <Reply className="h-4 w-4" />
                                    </Button>
                                    {msg.author?.id === user.id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                              "h-7 w-7 p-0",
                                              isDark
                                                ? "text-slate-400 hover:text-white hover:bg-white/10"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
                                            )}
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          className="bg-slate-800 border-slate-700"
                                        >
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleDeleteMessage(msg.id)
                                            }
                                            className="text-red-400 focus:bg-red-500/20 focus:text-red-400"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>

                                {msg.reply_to_message && (
                                  <div
                                    className={cn(
                                      "mb-2 pl-3 border-l-2 text-sm rounded-r py-1",
                                      isDark
                                        ? "border-slate-600 text-slate-400 bg-white/5"
                                        : "border-slate-300 text-slate-500 bg-slate-100",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "font-medium",
                                        isDark
                                          ? "text-slate-300"
                                          : "text-slate-700",
                                      )}
                                    >
                                      {msg.reply_to_message.author?.full_name}:
                                    </span>{" "}
                                    {msg.reply_to_message.content.slice(0, 100)}
                                    {msg.reply_to_message.content.length >
                                      100 && "..."}
                                  </div>
                                )}

                                {msg.content && (
                                  <p
                                    className={cn(
                                      "text-sm break-words mb-2",
                                      isDark
                                        ? "text-slate-300"
                                        : "text-slate-700",
                                    )}
                                  >
                                    {parseContentWithLinks(msg.content).map(
                                      (part, index) => {
                                        if (part.isUrl && part.url) {
                                          return (
                                            <a
                                              key={index}
                                              href={part.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={cn(
                                                "hover:underline break-all",
                                                isDark
                                                  ? "text-blue-400 hover:text-blue-300"
                                                  : "text-blue-600 hover:text-blue-700",
                                              )}
                                            >
                                              {part.text}
                                            </a>
                                          );
                                        }
                                        return (
                                          <span key={index}>{part.text}</span>
                                        );
                                      },
                                    )}
                                  </p>
                                )}
                                {msg.image_url && (
                                  <div className="mt-2">
                                    <img
                                      src={msg.image_url}
                                      alt="Shared image"
                                      className="max-w-full max-h-80 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                      onClick={() =>
                                        setViewerImage(msg.image_url!)
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div
                      className={cn(
                        "border-t p-4 backdrop-blur-xl flex-shrink-0",
                        isDark ? "border-white/10" : "border-slate-200",
                        theme.background === "gradient"
                          ? isDark
                            ? "bg-card/80"
                            : "bg-white/80"
                          : isDark
                            ? "bg-slate-900/80"
                            : "bg-white/80",
                      )}
                    >
                      {(() => {
                        const groupTypingUsers = selectedGroup
                          ? typingUsers.get(selectedGroup.id)
                          : null;
                        if (!groupTypingUsers || groupTypingUsers.size === 0)
                          return null;

                        const typingNames = Array.from(groupTypingUsers)
                          .filter((id) => id !== user?.id)
                          .map((id) => {
                            const member = members.find(
                              (m) => m.user_id === id,
                            );
                            return (
                              member?.display_name ||
                              member?.full_name ||
                              "Someone"
                            );
                          });

                        if (typingNames.length === 0) return null;

                        return (
                          <div
                            className={cn(
                              "text-xs mb-2 flex items-center gap-2",
                              isDark ? "text-slate-400" : "text-slate-500",
                            )}
                          >
                            <Circle className="h-2 w-2 fill-current animate-pulse text-green-400" />
                            {typingNames.join(", ")}{" "}
                            {typingNames.length === 1 ? "is" : "are"} typing...
                          </div>
                        );
                      })()}

                      {replyingTo && (
                        <div
                          className={cn(
                            "mb-2 p-2 rounded-lg flex items-center justify-between",
                            isDark ? "bg-white/10" : "bg-slate-100",
                          )}
                        >
                          <div className="text-sm">
                            <span
                              className={
                                isDark ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              Replying to:{" "}
                            </span>
                            <span
                              className={cn(
                                "font-medium",
                                isDark ? "text-white" : "text-slate-900",
                              )}
                            >
                              {replyingTo.author?.display_name || "Unknown"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className={cn(
                              isDark
                                ? "text-slate-400 hover:text-white hover:bg-white/10"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
                            )}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Image Preview */}
                      {imagePreview && (
                        <div
                          className={cn(
                            "mb-3 p-3 rounded-lg",
                            isDark ? "bg-white/10" : "bg-slate-100",
                          )}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Selected"
                                className="h-16 w-16 object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-medium truncate",
                                  isDark ? "text-white" : "text-slate-900",
                                )}
                              >
                                {selectedImage?.name}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDark ? "text-slate-400" : "text-slate-500",
                                )}
                              >
                                {(selectedImage?.size || 0) / 1024 < 1024
                                  ? `${Math.round((selectedImage?.size || 0) / 1024)} KB`
                                  : `${((selectedImage?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                              </p>
                            </div>
                            {!isUploading && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveImage}
                                className={cn(
                                  isDark
                                    ? "text-slate-400 hover:text-white hover:bg-white/10"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
                                )}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Upload Progress */}
                          {isUploading && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={cn(
                                    "font-medium",
                                    isDark
                                      ? "text-indigo-400"
                                      : "text-indigo-600",
                                  )}
                                >
                                  Uploading image...
                                </span>
                                <span
                                  className={cn(
                                    isDark
                                      ? "text-slate-400"
                                      : "text-slate-500",
                                  )}
                                >
                                  {uploadProgress}%
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "h-2 rounded-full overflow-hidden",
                                  isDark ? "bg-white/20" : "bg-slate-200",
                                )}
                              >
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p
                                className={cn(
                                  "text-xs text-center",
                                  isDark ? "text-slate-400" : "text-slate-500",
                                )}
                              >
                                Please wait a moment...
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-2.5 py-1 border",
                            isDark
                              ? "bg-white/10 border-white/10"
                              : "bg-slate-100 border-slate-200",
                          )}
                        >
                          <Switch
                            checked={isAnonymous}
                            onCheckedChange={setIsAnonymous}
                            id="anonymous-mode"
                            className="data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-slate-600 scale-75"
                          />
                          <Label
                            htmlFor="anonymous-mode"
                            className={cn(
                              "text-xs font-medium cursor-pointer select-none",
                              isDark ? "text-slate-300" : "text-slate-600",
                            )}
                          >
                            Anon
                          </Label>
                        </div>

                        {/* Image Upload Button */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            isDark
                              ? "text-slate-400 hover:text-white hover:bg-white/10"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
                          )}
                          title="Add image"
                        >
                          <Image className="h-5 w-5" />
                        </Button>

                        <Input
                          value={messageInput}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={`Message ${selectedGroup.name}`}
                          className={cn(
                            "flex-1",
                            isDark
                              ? "bg-white/10 border-white/10 text-white placeholder:text-slate-500 focus:border-white/20"
                              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-300",
                          )}
                          maxLength={5000}
                        />

                        <Button
                          onClick={handleSendMessage}
                          disabled={
                            (!messageInput.trim() && !selectedImage) ||
                            isUploading
                          }
                          className={cn(
                            currentTheme.primary,
                            "hover:opacity-90",
                          )}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                </div>

                {/* Members Sidebar */}
                {showMembers && (
                  <div
                    className={cn(
                      "w-64 backdrop-blur-xl border-l hidden md:flex flex-col",
                      isDark ? "border-white/10" : "border-slate-200",
                      theme.background === "gradient"
                        ? isDark
                          ? "bg-card/80"
                          : "bg-white/80"
                        : isDark
                          ? "bg-slate-900/80"
                          : "bg-white/80",
                    )}
                  >
                    <div
                      className={cn(
                        "p-4 border-b flex-shrink-0",
                        isDark ? "border-white/10" : "border-slate-200",
                      )}
                    >
                      <h3
                        className={cn(
                          "font-semibold flex items-center gap-2",
                          isDark ? "text-white" : "text-slate-900",
                        )}
                      >
                        <Users className="h-4 w-4" />
                        Members ({members.length})
                      </h3>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {members.map((member) => (
                          <div
                            key={member.user_id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
                              isDark
                                ? "hover:bg-white/5"
                                : "hover:bg-slate-100",
                            )}
                          >
                            <div className="relative">
                              <Avatar
                                className={cn(
                                  "h-8 w-8 ring-2",
                                  isDark ? "ring-white/10" : "ring-slate-200",
                                )}
                              >
                                {member.avatar_url ? (
                                  <AvatarImage src={member.avatar_url} />
                                ) : (
                                  <AvatarFallback
                                    className={cn(
                                      currentTheme.secondary,
                                      currentTheme.accent,
                                    )}
                                  >
                                    {member.full_name?.[0] || "?"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              {member.is_online && (
                                <div
                                  className={cn(
                                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2",
                                    isDark
                                      ? "border-slate-900"
                                      : "border-white",
                                  )}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "text-sm font-medium truncate flex items-center gap-1",
                                  isDark ? "text-white" : "text-slate-900",
                                )}
                              >
                                {member.display_name || member.full_name}
                                {member.show_as_admin && (
                                  <Badge
                                    variant="default"
                                    className={cn(
                                      "text-xs ml-1",
                                      currentTheme.primary,
                                    )}
                                  >
                                    <Shield className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>
                              {member.is_online && (
                                <div className="text-xs text-green-400">
                                  Online
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
              <div className="text-center p-4">
                <div
                  className={cn(
                    "p-4 rounded-2xl mb-4 inline-block",
                    currentTheme.secondary,
                  )}
                >
                  <MessageSquare
                    className={cn("h-16 w-16", currentTheme.accent)}
                  />
                </div>
                <h3
                  className={cn(
                    "text-xl font-semibold mb-2",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  Welcome to Discord
                </h3>
                <p
                  className={cn(
                    "mb-6",
                    isDark ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  Select a group to start chatting
                </p>
                <Button
                  onClick={() => setShowThemeDialog(true)}
                  className={cn(currentTheme.primary, "hover:opacity-90")}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Customize Theme
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theme Dialog */}
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent
          className={cn(
            "sm:max-w-md",
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200",
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn(
                "flex items-center gap-2",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              <Palette className="h-5 w-5" />
              Customize Theme
            </DialogTitle>
            <DialogDescription
              className={isDark ? "text-slate-400" : "text-slate-500"}
            >
              Choose your favorite color theme and background
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Color Theme */}
            <div className="space-y-3">
              <Label className={isDark ? "text-white" : "text-slate-900"}>
                Color Theme
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {(Object.keys(themeColors) as ThemeColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => setTheme((prev) => ({ ...prev, color }))}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all",
                      themeColors[color].primary,
                      theme.color === color &&
                        cn(
                          "ring-2 ring-offset-2",
                          isDark
                            ? "ring-white ring-offset-slate-900"
                            : "ring-slate-900 ring-offset-white",
                        ),
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="space-y-3">
              <Label className={isDark ? "text-white" : "text-slate-900"}>
                Background
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(backgroundImages) as BackgroundType[]).map(
                  (bg) => (
                    <button
                      key={bg}
                      onClick={() =>
                        setTheme((prev) => ({ ...prev, background: bg }))
                      }
                      className={cn(
                        "h-16 rounded-xl overflow-hidden transition-all relative",
                        theme.background === bg &&
                          cn(
                            "ring-2 ring-offset-2",
                            isDark
                              ? "ring-white ring-offset-slate-900"
                              : "ring-slate-900 ring-offset-white",
                          ),
                      )}
                    >
                      {bg === "gradient" ? (
                        <div
                          className={cn(
                            "h-full w-full",
                            isDark
                              ? "bg-gradient-to-br from-slate-700 to-slate-900"
                              : "bg-gradient-to-br from-slate-200 to-slate-300",
                          )}
                        />
                      ) : (
                        <img
                          src={backgroundImages[bg].url}
                          alt={backgroundImages[bg].name}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {theme.background === bg && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowThemeDialog(false)}
              className={cn(currentTheme.primary, "hover:opacity-90")}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nickname Dialog */}
      <Dialog open={showNicknameDialog} onOpenChange={setShowNicknameDialog}>
        <DialogContent
          className={cn(
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200",
          )}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-slate-900"}>
              Customize Your Display
            </DialogTitle>
            <DialogDescription
              className={isDark ? "text-slate-400" : "text-slate-500"}
            >
              Set a nickname for the All Students group. This will be shown
              instead of your real name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="nickname"
                className={isDark ? "text-white" : "text-slate-900"}
              >
                Nickname (optional)
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter a nickname..."
                className={cn(
                  isDark
                    ? "bg-white/10 border-white/10 text-white placeholder:text-slate-500"
                    : "bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400",
                )}
              />
            </div>

            <div
              className={cn(
                "flex items-center justify-between rounded-lg p-3",
                isDark ? "bg-white/5" : "bg-slate-100",
              )}
            >
              <div className="space-y-0.5">
                <Label
                  htmlFor="display-student-id"
                  className={isDark ? "text-white" : "text-slate-900"}
                >
                  Display Student ID
                </Label>
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  Show your student ID instead of your name
                </p>
              </div>
              <Switch
                id="display-student-id"
                checked={displayStudentId}
                onCheckedChange={setDisplayStudentId}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNicknameDialog(false)}
              className={cn(
                isDark
                  ? "border-slate-600 text-slate-300 hover:bg-white/10"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100",
              )}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNickname}
              className={cn(currentTheme.primary, "hover:opacity-90")}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <ImageViewer
        imageUrl={viewerImage || ""}
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
        alt="Discord chat image"
      />

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent
          className={cn(
            "sm:max-w-md",
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200",
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn(
                "flex items-center gap-2",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              <Share2 className="h-5 w-5" />
              Share to Discord
            </DialogTitle>
            <DialogDescription
              className={isDark ? "text-slate-400" : "text-slate-500"}
            >
              Select a group to share this market post
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {shareImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {shareImages.slice(0, 3).map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Share image ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
                {shareImages.length > 3 && (
                  <div
                    className={cn(
                      "h-16 w-16 rounded-lg flex items-center justify-center flex-shrink-0",
                      isDark ? "bg-slate-700" : "bg-slate-100",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isDark ? "text-slate-300" : "text-slate-600",
                      )}
                    >
                      +{shareImages.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div
              className={cn(
                "p-3 rounded-lg max-h-32 overflow-y-auto",
                isDark ? "bg-slate-800" : "bg-slate-50",
              )}
            >
              <p
                className={cn(
                  "text-sm whitespace-pre-wrap",
                  isDark ? "text-slate-300" : "text-slate-600",
                )}
              >
                {shareContent}
              </p>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-white" : "text-slate-900"}>
                Select Group
              </Label>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={async () => {
                      let imageUrl = null;
                      if (shareImages.length > 0) {
                        try {
                          const response = await fetch(shareImages[0]);
                          const blob = await response.blob();
                          const file = new File([blob], "share.jpg", {
                            type: blob.type,
                          });
                          const formData = new FormData();
                          formData.append("image", file);
                          const token = localStorage.getItem("auth_token");
                          const uploadResponse = await fetch(
                            `${
                              import.meta.env.VITE_API_URL ||
                              "http://localhost:3001/api"
                            }/upload/discord-image`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              body: formData,
                            },
                          );
                          if (uploadResponse.ok) {
                            const uploadData = await uploadResponse.json();
                            if (uploadData.success) {
                              imageUrl = uploadData.data.url;
                            }
                          }
                        } catch (e) {
                          console.error("Failed to upload share image:", e);
                        }
                      }

                      const response = await discordApi.sendMessage(
                        group.id,
                        shareContent,
                        false,
                        undefined,
                        imageUrl,
                      );
                      if (response.success) {
                        toast.success("Shared to " + group.name);
                        setShowShareDialog(false);
                        setSelectedGroup(
                          groups.find((g) => g.id === group.id) || null,
                        );
                      } else {
                        toast.error("Failed to share");
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200",
                      isDark
                        ? "hover:bg-white/10 text-slate-300"
                        : "hover:bg-slate-100 text-slate-700",
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        currentTheme.secondary,
                      )}
                    >
                      <Hash className={cn("h-4 w-4", currentTheme.accent)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{group.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(false)}
              className={cn(
                isDark
                  ? "border-slate-600 text-slate-300 hover:bg-white/10"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100",
              )}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RestrictionPopup
        isOpen={showRestrictionPopup}
        onClose={() => setShowRestrictionPopup(false)}
        restriction={restriction}
        feature="discord"
        restrictedFeatures={restriction ? ["discord"] : []}
      />
    </div>
  );
}
 
