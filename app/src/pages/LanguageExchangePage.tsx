import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import {
  Users,
  Search,
  Clock,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Home,
  X,
  LogIn,
  Lock,
  Sparkles,
  Globe,
  MessageSquare,
  Zap,
  Heart,
  Hash,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { HSKLevel } from "@/types/hsk";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface ExchangeUser {
  profile_id: string;
  user_id: string;
  native_language: string;
  target_language: string;
  proficiency_level: number;
  bio: string | null;
  interests: string[];
  availability: string[];
  full_name: string;
  student_id: string;
  avatar_url: string | null;
  department: string | null;
  current_year: number | null;
  country: string | null;
  connection_status: string | null;
  connection_id: string | null;
  chat_id: string | null;
  is_online?: boolean;
  last_active?: string;
  activity_level?: number; // 1-10 activity level
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  requester_full_name: string;
  requester_avatar_url: string | null;
  requester_department: string | null;
  requester_native_language: string;
  requester_target_language: string;
}

const hskLevelData = [
  {
    level: 1 as HSKLevel,
    label: "HSK 1",
    color: "from-emerald-400 to-teal-500",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    glowColor: "shadow-emerald-500/30",
  },
  {
    level: 2 as HSKLevel,
    label: "HSK 2",
    color: "from-blue-400 to-cyan-500",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    glowColor: "shadow-blue-500/30",
  },
  {
    level: 3 as HSKLevel,
    label: "HSK 3",
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-500/20",
    textColor: "text-violet-400",
    glowColor: "shadow-violet-500/30",
  },
  {
    level: 4 as HSKLevel,
    label: "HSK 4",
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-400",
    glowColor: "shadow-amber-500/30",
  },
  {
    level: 5 as HSKLevel,
    label: "HSK 5",
    color: "from-rose-400 to-pink-500",
    bgColor: "bg-rose-500/20",
    textColor: "text-rose-400",
    glowColor: "shadow-rose-500/30",
  },
  {
    level: 6 as HSKLevel,
    label: "HSK 6",
    color: "from-red-400 to-rose-500",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
    glowColor: "shadow-red-500/30",
  },
];

// Activity Level Badges (1-10)
const activityBadges = [
  {
    level: 1,
    name: "Newbie",
    icon: "🌱",
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
  },
  {
    level: 2,
    name: "Rookie",
    icon: "🌿",
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
  },
  {
    level: 3,
    name: "Learner",
    icon: "🍃",
    color: "from-emerald-400 to-teal-500",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
  },
  {
    level: 4,
    name: "Explorer",
    icon: "🌲",
    color: "from-teal-400 to-cyan-500",
    bgColor: "bg-teal-500/20",
    textColor: "text-teal-400",
  },
  {
    level: 5,
    name: "Practitioner",
    icon: "⭐",
    color: "from-cyan-400 to-blue-500",
    bgColor: "bg-cyan-500/20",
    textColor: "text-cyan-400",
  },
  {
    level: 6,
    name: "Speaker",
    icon: "🌟",
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  {
    level: 7,
    name: "Conversationalist",
    icon: "💫",
    color: "from-indigo-400 to-violet-500",
    bgColor: "bg-indigo-500/20",
    textColor: "text-indigo-400",
  },
  {
    level: 8,
    name: "Fluent",
    icon: "🔥",
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-500/20",
    textColor: "text-violet-400",
  },
  {
    level: 9,
    name: "Master",
    icon: "👑",
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-400",
  },
  {
    level: 10,
    name: "Legend",
    icon: "🚀",
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-400",
  },
];

// Activity Badge Component
const ActivityBadge = ({
  level,
  isDark,
}: {
  level: number;
  isDark: boolean;
}) => {
  const badge =
    activityBadges.find((b) => b.level === level) || activityBadges[0];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bgColor} ${badge.textColor} ${isDark ? "border-white/10" : "border-black/5"} shadow-sm`}
      title={`Activity Level ${level}: ${badge.name}`}
    >
      <span>{badge.icon}</span>
      <span className="hidden sm:inline">{badge.name}</span>
      <span className="sm:hidden">{level}</span>
    </div>
  );
};

export default function LanguageExchangePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated } = useAuth();

  const [users, setUsers] = useState<ExchangeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOwnProfile, setHasOwnProfile] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<
    ConnectionRequest[]
  >([]);
  const [showRequests, setShowRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { onlineUsers: socketOnlineUsers } = useSocket();

  useEffect(() => {
    fetchUsers();
    fetchRequests();
    fetchOwnProfile();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/language-exchange/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwnProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const response = await fetch(
        `${API_BASE_URL}/language-exchange/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success && data.data && data.data.is_active) {
        setHasOwnProfile(true);
      }
    } catch (error) {
      console.error("Error fetching own profile:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      console.log("Fetch requests response:", data);
      if (data.success) {
        setConnectionRequests(data.data);
      } else {
        console.error("Failed to fetch requests:", data.message);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleConnect = async (userId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    console.log("Connecting to user:", userId);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token for connect");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/connect/${userId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      console.log("Connect response:", data);
      if (data.success) {
        toast.success("Connection request sent!");
        fetchUsers();
      } else {
        console.error("Connect failed:", data.message || "Unknown error");
        toast.error(data.message || "Failed to send request");
      }
    } catch (error: any) {
      console.error("Error connecting:", error?.message || error);
      toast.error(
        "Failed to send connection request: " +
          (error?.message || "Unknown error"),
      );
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    console.log("Accepting request:", requestId);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token for accept");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/requests/${requestId}/accept`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      console.log("Accept response:", data);
      if (data.success) {
        toast.success("Connection accepted!");
        fetchRequests();
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to accept request");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    console.log("Rejecting request:", requestId);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token for reject");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/requests/${requestId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      console.log("Reject response:", data);
      if (data.success) {
        toast.success("Connection rejected");
        fetchRequests();
      } else {
        toast.error(data.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const filteredUsers = users.filter((user) => {
    let matchesSearch = true;
    let matchesLevel = true;
    let matchesActive = true;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch =
        user.full_name.toLowerCase().includes(query) ||
        user.native_language.toLowerCase().includes(query) ||
        user.target_language.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query);
    }

    if (selectedLevel !== null) {
      matchesLevel = user.proficiency_level === selectedLevel;
    }

    if (showActiveOnly) {
      matchesActive = socketOnlineUsers.has(user.user_id);
    }

    return matchesSearch && matchesLevel && matchesActive;
  });

  const getConnectButton = (user: ExchangeUser) => {
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => setShowLoginPrompt(true)}
          className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
            isDark
              ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              : "bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 border border-slate-900/20"
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Connect
            <Lock className="w-3 h-3 opacity-50" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      );
    }

    if (user.connection_status === "connected") {
      return (
        <Link
          to={`/language-exchange/chat/${user.chat_id || user.connection_id}`}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat
          </span>
        </Link>
      );
    }

    if (user.connection_status === "sent") {
      return (
        <span
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${
            isDark
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-amber-100 text-amber-600 border border-amber-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending
        </span>
      );
    }

    if (user.connection_status === "received") {
      return (
        <span
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${
            isDark
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-blue-100 text-blue-600 border border-blue-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          Requested
        </span>
      );
    }

    return (
      <button
        onClick={() => handleConnect(user.user_id)}
        className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Connect
        </span>
      </button>
    );
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        {/* Static Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Glass Header */}
          <div
            className={`sticky top-4 z-50 mb-8 ${isDark ? "bg-slate-900/60" : "bg-indigo-50/80"} backdrop-blur-xl rounded-2xl border ${isDark ? "border-white/10" : "border-indigo-100"} p-3 sm:p-4 shadow-xl`}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Logo & Title */}
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl blur-lg opacity-50" />
                  <div className="relative p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1
                    className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Language Exchange
                  </h1>
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Connect & Learn Together
                  </p>
                </div>
              </div>

              {/* Navigation Links - Scrollable on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
                <Link
                  to="/discord"
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Discord</span>
                  <span className="sm:hidden">Chat</span>
                </Link>
                <Link
                  to="/hsk-2026"
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-600 border border-blue-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">HSK 2026</span>
                  <span className="sm:hidden">2026</span>
                </Link>
                <Link
                  to="/social"
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/30"
                      : "bg-pink-100 hover:bg-pink-200 text-pink-600 border border-pink-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Social</span>
                </Link>
                <Link
                  to="/market"
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                      : "bg-emerald-100 hover:bg-emerald-200 text-emerald-600 border border-emerald-200"
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Market</span>
                </Link>
                <Link
                  to="/"
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                {/* Dark/Light Mode Toggle */}
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200"
                  }`}
                  aria-label={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                  title={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDark ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span
                className={`text-sm font-medium ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
              >
                Find Your Language Partner
              </span>
            </div>
            <h2
              className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Connect with{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Global Learners
              </span>
            </h2>
            <p
              className={`text-lg max-w-2xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Practice languages with native speakers, make friends from around
              the world, and accelerate your learning journey together.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { icon: Users, label: "Total Learners", value: users.length },
              ...(isAuthenticated
                ? [
                    {
                      icon: () => (
                        <span className="relative flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
                        </span>
                      ),
                      label: "Online Now",
                      value: socketOnlineUsers.size,
                      highlight: true,
                    },
                  ]
                : []),
              {
                icon: MessageSquare,
                label: "Connections",
                value: users.filter((u) => u.connection_status === "connected")
                  .length,
              },
              { icon: Zap, label: "HSK Levels", value: "6" },
            ].map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={idx}
                  className={`p-3 sm:p-4 rounded-2xl backdrop-blur-xl border ${
                    stat.highlight
                      ? isDark
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-emerald-50 border-emerald-200"
                      : isDark
                        ? "bg-white/5 border-white/10"
                        : "bg-indigo-50/80 border-indigo-100"
                  } shadow-lg`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl ${
                        stat.highlight
                          ? isDark
                            ? "bg-emerald-500/20"
                            : "bg-emerald-100"
                          : isDark
                            ? "bg-white/10"
                            : "bg-slate-100"
                      }`}
                    >
                      {typeof IconComponent === "function" &&
                      IconComponent.length === 0 ? (
                        <IconComponent />
                      ) : (
                        <IconComponent
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            stat.highlight
                              ? "text-emerald-500"
                              : isDark
                                ? "text-indigo-400"
                                : "text-indigo-600"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xl sm:text-2xl font-bold ${
                          stat.highlight
                            ? "text-emerald-500"
                            : isDark
                              ? "text-white"
                              : "text-slate-900"
                        }`}
                      >
                        {stat.value}
                      </p>
                      <p
                        className={`text-[10px] sm:text-xs ${
                          stat.highlight
                            ? isDark
                              ? "text-emerald-400"
                              : "text-emerald-600"
                            : isDark
                              ? "text-slate-400"
                              : "text-slate-500"
                        }`}
                      >
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isAuthenticated && (
            <div
              className={`p-6 rounded-2xl border backdrop-blur-xl mb-8 flex items-center justify-between gap-4 ${
                isDark
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`}
                >
                  <LogIn
                    className={`w-6 h-6 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                  />
                </div>
                <div>
                  <p
                    className={`font-medium ${isDark ? "text-amber-300" : "text-amber-700"}`}
                  >
                    Sign in to Connect
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-amber-400/70" : "text-amber-600/70"}`}
                  >
                    Join language partners and start chatting with learners
                    worldwide
                  </p>
                </div>
              </div>
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Connection Requests */}
          {connectionRequests.length > 0 && (
            <div
              className={`p-5 rounded-2xl border backdrop-blur-xl mb-8 ${
                isDark
                  ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30"
                  : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
              }`}
            >
              <button
                onClick={() => setShowRequests(!showRequests)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"}`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                    />
                  </div>
                  <span
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {connectionRequests.length} pending connection request
                    {connectionRequests.length > 1 ? "s" : ""}
                  </span>
                </div>
                {showRequests ? (
                  <ChevronUp
                    className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                ) : (
                  <ChevronDown
                    className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                )}
              </button>

              {showRequests && (
                <div className="mt-4 space-y-3">
                  {connectionRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-4 rounded-xl backdrop-blur-sm ${
                        isDark ? "bg-white/5" : "bg-white/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {request.requester_full_name
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-900" />
                          </div>
                          <div>
                            <p
                              className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {request.requester_full_name}
                            </p>
                            <p
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {request.requester_native_language} →{" "}
                              {request.requester_target_language}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-green-500/40 border border-green-400/30"
                          >
                            <span className="flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Accept
                            </span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-500/40 border border-red-400/30"
                          >
                            <span className="flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Reject
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div
            className={`p-3 sm:p-4 rounded-xl border backdrop-blur-xl mb-6 ${
              isDark
                ? "bg-white/5 border-white/10"
                : "bg-indigo-50/80 border-indigo-100"
            } shadow-lg`}
          >
            {/* Search Row */}
            <div className="flex gap-2 items-center mb-3">
              <div className="relative flex-1">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search name, language, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-white/10"
                      : "bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  } border focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                />
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => setShowActiveOnly(!showActiveOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 flex-shrink-0 ${
                    showActiveOnly
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                      : isDark
                        ? "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div
                    className={`relative w-5 h-2.5 rounded-full transition-colors ${showActiveOnly ? "bg-white/30" : isDark ? "bg-slate-600" : "bg-slate-300"}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white transition-transform ${showActiveOnly ? "translate-x-2.5" : "translate-x-0"}`}
                    />
                  </div>
                  <span>Active</span>
                  {socketOnlineUsers.size > 0 && (
                    <span
                      className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                        showActiveOnly
                          ? "bg-white/20 text-white"
                          : isDark
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {socketOnlineUsers.size}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* HSK Level Filter Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                HSK:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedLevel === null
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30"
                      : isDark
                        ? "bg-white/10 text-slate-300 hover:bg-white/20"
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  }`}
                >
                  All
                </button>
                {hskLevelData.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => setSelectedLevel(level.level)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedLevel === level.level
                        ? `bg-gradient-to-r ${level.color} text-white shadow-md ${level.glowColor}`
                        : isDark
                          ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                          : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {level.level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Users Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                <div
                  className="absolute inset-0 w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.5s",
                  }}
                />
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              className={`p-12 rounded-2xl border text-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-indigo-50/80 border-indigo-100"
              }`}
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-30" />
                <Users
                  className={`relative w-16 h-16 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                />
              </div>
              <p
                className={`text-lg mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {hasOwnProfile
                  ? "No other language exchange users yet"
                  : users.length === 0
                    ? "No language exchange users yet"
                    : "No users found matching your search"}
              </p>
              <p
                className={`text-sm mb-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                {hasOwnProfile
                  ? "You've joined! Invite your classmates to start connecting."
                  : users.length === 0
                    ? "Be the first to join and start connecting!"
                    : "Try adjusting your filters or search terms"}
              </p>
              {!hasOwnProfile && users.length === 0 && (
                <Link
                  to="/profile?tab=language-exchange"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  <Sparkles className="w-4 h-4" />
                  Join Language Exchange
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user, index) => {
                const levelData =
                  hskLevelData.find(
                    (l) => l.level === user.proficiency_level,
                  ) || hskLevelData[0];

                return (
                  <div
                    key={user.profile_id}
                    className={`group relative rounded-xl border transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 ${
                      isDark
                        ? "bg-gradient-to-br from-slate-800/80 to-indigo-950/30 border-white/10 hover:border-white/20"
                        : "bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 border-indigo-100/60 hover:border-indigo-300"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Card Content */}
                    <div className="p-4">
                      {/* Header Row: Avatar + Name + HSK Badge */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                          >
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className={levelData.textColor}>
                                {user.full_name?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </span>
                            )}
                          </div>
                          {isAuthenticated && socketOnlineUsers.has(user.user_id) && (
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 ${isDark ? "border-slate-800" : "border-white"} animate-pulse`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3
                              className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-800"}`}
                            >
                              {user.full_name}
                            </h3>
                            {user.activity_level && (
                              <ActivityBadge
                                level={user.activity_level}
                                isDark={isDark}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {user.department}
                            </p>
                            {user.current_year && (
                              <>
                                <span
                                  className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}
                                >
                                  ·
                                </span>
                                <span
                                  className={`text-xs flex items-center gap-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  <GraduationCap className="w-3 h-3" /> Year{" "}
                                  {user.current_year}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span
                          className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${levelData.bgColor} ${levelData.textColor} ${levelData.glowColor} shadow-sm`}
                        >
                          {levelData.label}
                        </span>
                      </div>

                      {/* Languages Row */}
                      <div className="flex items-center gap-2 mb-2.5 p-2 rounded-lg bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-dashed border-indigo-200/50 dark:border-indigo-500/20">
                        <Globe
                          className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                        />
                        <span
                          className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {user.native_language}
                        </span>
                        <span
                          className={`${isDark ? "text-indigo-400" : "text-indigo-500"} text-xs`}
                        >
                          →
                        </span>
                        <span
                          className={`text-xs font-semibold ${levelData.textColor}`}
                        >
                          {user.target_language}
                        </span>
                        {user.country && (
                          <span
                            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                          >
                            📍 {user.country}
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      {user.bio && (
                        <p
                          className={`text-xs mb-2.5 line-clamp-2 italic leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          "{user.bio}"
                        </p>
                      )}

                      {/* Availability */}
                      {user.availability && user.availability.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                          <Clock
                            className={`w-3 h-3 flex-shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          />
                          {user.availability.slice(0, 3).map((slot) => (
                            <span
                              key={slot}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md ${isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-600"}`}
                            >
                              {slot.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          ))}
                          {user.availability.length > 3 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50/50 text-blue-400"}`}
                            >
                              +{user.availability.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Interests */}
                      {user.interests && user.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Hash
                            className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isDark ? "text-purple-400" : "text-purple-600"}`}
                          />
                          {user.interests.map((interest) => (
                            <span
                              key={interest}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                                isDark
                                  ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                                  : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                              }`}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Connect Button */}
                      <div className="flex justify-end pt-2 border-t border-dashed border-slate-200/60 dark:border-slate-700/40">
                        {getConnectButton(user)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Login Prompt Modal */}
          {showLoginPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div
                className={`relative w-full max-w-md rounded-2xl border p-8 ${
                  isDark
                    ? "bg-slate-900/90 border-white/10"
                    : "bg-white/90 border-slate-200"
                } backdrop-blur-xl shadow-2xl`}
              >
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <X
                    className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                </button>

                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-50" />
                    <div
                      className={`relative w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isDark ? "bg-white/10" : "bg-indigo-100"}`}
                    >
                      <LogIn
                        className={`w-10 h-10 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      />
                    </div>
                  </div>

                  <h3
                    className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Sign in Required
                  </h3>
                  <p
                    className={`text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Create an account or sign in to connect with language
                    partners and start your learning journey.
                  </p>

                  <div className="flex gap-3">
                    <Link
                      to="/login"
                      className={`flex-1 py-3 rounded-xl text-center font-medium transition-all duration-300 ${
                        isDark
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                      }`}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="flex-1 py-3 rounded-xl text-center font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
