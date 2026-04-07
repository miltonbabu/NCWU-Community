import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { adminSocialApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/AuthGuard";
import type {
  Post,
  Comment,
  AdminAuditLog,
  AdminPostStats,
} from "@/types/social";
import {
  MessageCircle,
  Heart,
  Share2,
  Pin,
  Lock,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Globe,
  Users,
  GraduationCap,
  FileText,
  Activity,
  Shield,
  Loader2,
  Filter,
  RefreshCw,
  Eye,
  TrendingUp,
  Sparkles,
  LogOut,
  Crown,
  Search,
  Settings,
  Zap,
  Calendar,
  EyeOff,
  VolumeX,
  UserX,
  PartyPopper,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type CommentWithAuthor = Comment & {
  author_name: string | null;
  author_student_id: string | null;
  post_content: string | null;
};

function AnimatedCounter({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(
        startValue + (endValue - startValue) * easeOut,
      );
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconBg,
  trend,
  trendValue,
  isLive = false,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isLive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 ${gradient} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBg} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            )}
            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  trend === "up"
                    ? "text-green-300"
                    : trend === "down"
                      ? "text-red-300"
                      : "text-white/70"
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`}
                />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-4xl font-bold text-white mb-1">
          <AnimatedCounter value={value} />
        </p>
        {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}

function AdminSocialContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user: currentUser, logout } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [activeTab, setActiveTab] = useState<
    "overview" | "posts" | "comments" | "hidden" | "logs"
  >("overview");
  const [stats, setStats] = useState<AdminPostStats | null>(null);
  const [posts, setPosts] = useState<
    (Post & { author_name?: string; author_student_id?: string })[]
  >([]);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "post" | "comment";
    id: string;
  } | null>(null);

  const [hiddenPostsData, setHiddenPostsData] = useState<
    {
      postId: string;
      userId: string;
      userName: string;
      postContent: string;
      hiddenAt: string;
    }[]
  >([]);
  const [mutedUsersData, setMutedUsersData] = useState<
    {
      mutedUserId: string;
      mutedUserName: string;
      mutedByUserId: string;
      mutedByUserName: string;
      mutedAt: string;
    }[]
  >([]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const response = await adminSocialApi.getStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
    setIsLoading(false);
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const visibility =
      visibilityFilter === "all" ? undefined : visibilityFilter;
    const response = await adminSocialApi.getPosts(
      postsPage,
      10,
      visibility,
      searchQuery || undefined,
    );
    if (response.success && response.data) {
      setPosts(response.data.posts);
      setTotalPosts(response.data.pagination.total);
    }
    setIsLoading(false);
  }, [visibilityFilter, postsPage, searchQuery]);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const response = await adminSocialApi.getComments(commentsPage, 10);
    if (response.success && response.data) {
      setComments(response.data.comments);
      setTotalComments(response.data.pagination.total);
    }
    setIsLoading(false);
  }, [commentsPage]);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    const response = await adminSocialApi.getAuditLogs(logsPage, 20);
    if (response.success && response.data) {
      setAuditLogs(response.data.logs);
      setTotalLogs(response.data.pagination.total);
    }
    setIsLoading(false);
  }, [logsPage]);

  const fetchHiddenAndMutedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminSocialApi.getHiddenAndMutedData();
      if (response.success && response.data) {
        setHiddenPostsData(response.data.hiddenPosts || []);
        setMutedUsersData(response.data.mutedUsers || []);
      }
    } catch (error) {
      toast.error("Failed to load hidden posts and muted users data");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "comments") {
      fetchComments();
    } else if (activeTab === "hidden") {
      fetchHiddenAndMutedData();
    } else if (activeTab === "logs") {
      fetchAuditLogs();
    }
  }, [
    activeTab,
    postsPage,
    commentsPage,
    logsPage,
    visibilityFilter,
    searchQuery,
    fetchPosts,
    fetchComments,
    fetchHiddenAndMutedData,
    fetchAuditLogs,
  ]);

  const handleDeletePost = async (postId: string) => {
    const response = await adminSocialApi.deletePost(postId);
    if (response.success) {
      toast.success("Post deleted successfully");
      fetchPosts();
      fetchStats();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const response = await adminSocialApi.deleteComment(commentId);
    if (response.success) {
      toast.success("Comment deleted successfully");
      fetchComments();
      fetchStats();
    }
  };

  const handleTogglePin = async (postId: string) => {
    const response = await adminSocialApi.pinPost(postId);
    if (response.success) {
      toast.success(response.data?.is_pinned ? "Post pinned" : "Post unpinned");
      fetchPosts();
    }
  };

  const handleToggleLock = async (postId: string) => {
    const response = await adminSocialApi.lockPost(postId);
    if (response.success) {
      toast.success(response.data?.is_locked ? "Post locked" : "Post unlocked");
      fetchPosts();
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-3 h-3" />;
      case "department":
        return <Users className="w-3 h-3" />;
      case "department_year":
        return <GraduationCap className="w-3 h-3" />;
      case "emergency":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      gradient: "from-violet-500 to-purple-600",
      activeGradient: "bg-gradient-to-r from-violet-500 to-purple-600",
    },
    {
      id: "posts",
      label: "Posts",
      icon: MessageCircle,
      gradient: "from-cyan-500 to-blue-600",
      activeGradient: "bg-gradient-to-r from-cyan-500 to-blue-600",
    },
    {
      id: "comments",
      label: "Comments",
      icon: FileText,
      gradient: "from-pink-500 to-rose-600",
      activeGradient: "bg-gradient-to-r from-pink-500 to-rose-600",
    },
    {
      id: "hidden",
      label: "Hidden & Muted",
      icon: EyeOff,
      gradient: "from-slate-500 to-gray-600",
      activeGradient: "bg-gradient-to-r from-slate-500 to-gray-600",
    },
    {
      id: "logs",
      label: "Audit Logs",
      icon: Activity,
      gradient: "from-amber-500 to-orange-600",
      activeGradient: "bg-gradient-to-r from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex">
        <aside
          className={`w-72 h-screen sticky top-0 flex flex-col ${
            isDark
              ? "bg-slate-900/80 border-r border-slate-800"
              : "bg-white border-r border-slate-200"
          } backdrop-blur-xl`}
        >
          <div className="p-6 flex-1 overflow-y-auto">
            <Link
              to="/admin"
              className={`flex items-center gap-3 mb-10 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Social Admin</h1>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  NCWU Community
                </p>
              </div>
            </Link>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? `${item.activeGradient} text-white shadow-lg`
                        : isDark
                          ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 space-y-2">
              <Link
                to="/admin/events"
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <PartyPopper className="w-5 h-5" />
                <span className="font-medium">Manage Events</span>
              </Link>
              <Link
                to="/admin"
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
          </div>

          <div
            className={`shrink-0 p-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
          >
            <div
              className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              <Avatar className="w-10 h-10 ring-2 ring-rose-500/30">
                <AvatarImage src={currentUser?.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-red-500 text-white">
                  {currentUser?.full_name
                    ? getInitials(currentUser.full_name)
                    : "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {currentUser?.full_name}
                </p>
                <p
                  className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {isSuperAdmin ? (
                    <>
                      <Crown className="w-3 h-3 text-violet-400" />
                      SuperAdmin
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3 text-amber-400" />
                      Admin
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                    : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                }`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Social Overview
                  </h1>
                  <p
                    className={`mt-2 text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Monitor and manage social platform activity
                  </p>
                </div>
                <Button
                  onClick={() => {
                    fetchStats();
                    fetchPosts();
                    fetchComments();
                  }}
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Posts"
                      value={stats.totals.posts}
                      subtitle={`${stats.today.posts} new today`}
                      icon={MessageCircle}
                      gradient="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600"
                      iconBg="bg-white/20"
                      trend="up"
                      trendValue={`+${stats.today.posts}`}
                      isLive
                    />
                    <StatCard
                      title="Total Comments"
                      value={stats.totals.comments}
                      subtitle={`${stats.today.comments} new today`}
                      icon={FileText}
                      gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600"
                      iconBg="bg-white/20"
                      trend="up"
                      trendValue={`+${stats.today.comments}`}
                      isLive
                    />
                    <StatCard
                      title="Total Likes"
                      value={stats.totals.likes}
                      icon={Heart}
                      gradient="bg-gradient-to-br from-red-500 via-rose-500 to-pink-600"
                      iconBg="bg-white/20"
                      isLive
                    />
                    <StatCard
                      title="Emergency Posts"
                      value={stats.special.emergency}
                      icon={AlertTriangle}
                      gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600"
                      iconBg="bg-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div
                      className={`lg:col-span-2 rounded-2xl p-6 ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      } shadow-xl`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2
                          className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          Posts by Visibility
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.postsByVisibility.map((item) => (
                          <div
                            key={item.visibility}
                            className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"} transition-all hover:scale-105`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`p-2 rounded-lg ${
                                  item.visibility === "public"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : item.visibility === "department"
                                      ? "bg-green-500/20 text-green-400"
                                      : item.visibility === "department_year"
                                        ? "bg-purple-500/20 text-purple-400"
                                        : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {getVisibilityIcon(item.visibility)}
                              </div>
                            </div>
                            <p
                              className={`text-sm capitalize ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {item.visibility.replace("_", " ")}
                            </p>
                            <p
                              className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {item.count}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`rounded-2xl p-6 ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      } shadow-xl`}
                    >
                      <h2
                        className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        Special Posts
                      </h2>
                      <div className="space-y-4">
                        <div
                          className={`flex items-center justify-between p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                              <Pin className="w-5 h-5 text-blue-400" />
                            </div>
                            <span
                              className={
                                isDark ? "text-white" : "text-slate-900"
                              }
                            >
                              Pinned
                            </span>
                          </div>
                          <span
                            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {stats.special.pinned}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                              <Lock className="w-5 h-5 text-amber-400" />
                            </div>
                            <span
                              className={
                                isDark ? "text-white" : "text-slate-900"
                              }
                            >
                              Locked
                            </span>
                          </div>
                          <span
                            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {stats.special.locked}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-6 ${
                      isDark
                        ? "bg-slate-900/50 border border-slate-800"
                        : "bg-white border border-slate-200"
                    } shadow-xl`}
                  >
                    <h2
                      className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Top Performing Posts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.topPosts.map((post, index) => (
                        <div
                          key={post.id}
                          className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"} transition-all hover:scale-[1.02]`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                                  : index === 1
                                    ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700"
                                    : index === 2
                                      ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white"
                                      : isDark
                                        ? "bg-slate-700 text-slate-300"
                                        : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {post.author_name || "Anonymous"}
                              </p>
                              <p
                                className={`text-sm line-clamp-2 mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {post.content}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1 text-xs text-red-400">
                                  <Heart className="w-3 h-3" />
                                  {post.like_count}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-blue-400">
                                  <MessageCircle className="w-3 h-3" />
                                  {post.comment_count}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-green-400">
                                  <Share2 className="w-3 h-3" />
                                  {post.share_count}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Posts Management
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Manage and moderate all posts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-12 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                  />
                </div>
                <Select
                  value={visibilityFilter}
                  onValueChange={setVisibilityFilter}
                >
                  <SelectTrigger
                    className={`w-48 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="department_year">Dept & Year</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className={`p-5 rounded-2xl ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      } shadow-xl transition-all hover:shadow-2xl`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-cyan-500/20">
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                              {post.author_name?.[0] || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p
                              className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {post.author_name || "Anonymous"}
                            </p>
                            <p
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {post.author_student_id} •{" "}
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {post.is_pinned && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                              <Pin className="w-3 h-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          {post.is_locked && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                          {post.is_emergency && (
                            <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Emergency
                            </Badge>
                          )}
                          <Badge
                            className={`${
                              post.visibility === "public"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                                : post.visibility === "department"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : post.visibility === "department_year"
                                    ? "bg-gradient-to-r from-purple-500 to-violet-500"
                                    : "bg-gradient-to-r from-red-500 to-rose-500"
                            } text-white border-0`}
                          >
                            {getVisibilityIcon(post.visibility)}
                            <span className="ml-1 capitalize">
                              {post.visibility.replace("_", " ")}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <p
                        className={`text-base mb-4 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                      >
                        {post.content}
                      </p>

                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                          {post.images.map((image, imgIndex) => (
                            <div
                              key={imgIndex}
                              className="relative group flex-shrink-0"
                            >
                              <img
                                src={image}
                                alt={`Post image ${imgIndex + 1}`}
                                className="h-24 w-24 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(image, "_blank")}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                                <Eye className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-6 text-sm">
                          <span className="flex items-center gap-2 text-red-400">
                            <Heart className="w-4 h-4" />
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-2 text-blue-400">
                            <MessageCircle className="w-4 h-4" />
                            {post.comment_count}
                          </span>
                          <span className="flex items-center gap-2 text-green-400">
                            <Share2 className="w-4 h-4" />
                            {post.share_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePin(post.id)}
                            className={`hover:bg-blue-500/20 ${post.is_pinned ? "text-blue-400" : ""}`}
                          >
                            <Pin className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleLock(post.id)}
                            className={`hover:bg-amber-500/20 ${post.is_locked ? "text-amber-400" : ""}`}
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            onClick={() =>
                              setDeleteDialog({ type: "post", id: post.id })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="text-center py-16">
                      <MessageCircle
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        No posts found
                      </p>
                    </div>
                  )}

                  {totalPosts > 10 && (
                    <div
                      className={`flex items-center justify-between p-5 rounded-2xl ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      }`}
                    >
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Showing {(postsPage - 1) * 10 + 1} to{" "}
                        {Math.min(postsPage * 10, totalPosts)} of {totalPosts}{" "}
                        posts
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={postsPage === 1}
                          onClick={() => setPostsPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={postsPage >= Math.ceil(totalPosts / 10)}
                          onClick={() => setPostsPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              <div>
                <h1
                  className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Comments Management
                </h1>
                <p
                  className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Review and moderate all comments
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-5 rounded-2xl ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      } shadow-xl`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 ring-2 ring-pink-500/20">
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                              {comment.author_name?.[0] || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p
                              className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {comment.author_name || "Anonymous"}
                            </p>
                            <p
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {comment.author_student_id} •{" "}
                              {formatDistanceToNow(
                                new Date(comment.created_at),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          onClick={() =>
                            setDeleteDialog({ type: "comment", id: comment.id })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <p
                        className={`text-base mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                      >
                        {comment.content}
                      </p>

                      {comment.post_content && (
                        <div
                          className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                        >
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            On post: "{comment.post_content.substring(0, 150)}
                            ..."
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-400 mt-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {comment.like_count}
                        </span>
                        {comment.reply_count > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {comment.reply_count} replies
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <div className="text-center py-16">
                      <FileText
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        No comments found
                      </p>
                    </div>
                  )}

                  {totalComments > 10 && (
                    <div
                      className={`flex items-center justify-between p-5 rounded-2xl ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      }`}
                    >
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Page {commentsPage} of {Math.ceil(totalComments / 10)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commentsPage === 1}
                          onClick={() => setCommentsPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            commentsPage >= Math.ceil(totalComments / 10)
                          }
                          onClick={() => setCommentsPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "hidden" && (
            <div className="space-y-6">
              <div>
                <h1
                  className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Hidden Posts & Muted Users
                </h1>
                <p
                  className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  View user preferences for hidden content
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Hidden Posts Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-600/20">
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      </div>
                      <h2
                        className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        Hidden Posts ({hiddenPostsData.length})
                      </h2>
                    </div>

                    {hiddenPostsData.length === 0 ? (
                      <div
                        className={`p-8 rounded-2xl text-center ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"}`}
                      >
                        <EyeOff
                          className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                        />
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          No hidden posts found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {hiddenPostsData.map((item, index) => (
                          <div
                            key={`${item.postId}-${index}`}
                            className={`p-4 rounded-xl ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-sm`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-slate-500/10">
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  Hidden by: {item.userName}
                                </p>
                                <p
                                  className={`text-xs mt-1 truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {item.postContent.substring(0, 100)}...
                                </p>
                                <p
                                  className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  {format(new Date(item.hiddenAt), "PPp")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Muted Users Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-600/20">
                        <VolumeX className="w-5 h-5 text-red-400" />
                      </div>
                      <h2
                        className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        Muted Users ({mutedUsersData.length})
                      </h2>
                    </div>

                    {mutedUsersData.length === 0 ? (
                      <div
                        className={`p-8 rounded-2xl text-center ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"}`}
                      >
                        <VolumeX
                          className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                        />
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          No muted users found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {mutedUsersData.map((item, index) => (
                          <div
                            key={`${item.mutedUserId}-${index}`}
                            className={`p-4 rounded-xl ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-sm`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-red-500/10">
                                <UserX className="w-4 h-4 text-red-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    {item.mutedUserName}
                                  </p>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-600"}`}
                                  >
                                    Muted
                                  </span>
                                </div>
                                <p
                                  className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  Muted by: {item.mutedByUserName}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  {format(new Date(item.mutedAt), "PPp")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6">
              <div>
                <h1
                  className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Audit Logs
                </h1>
                <p
                  className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Track all admin actions
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-5 rounded-2xl ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      } shadow-xl`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${
                              log.action.includes("delete")
                                ? "bg-gradient-to-br from-red-500/20 to-rose-500/20"
                                : log.action.includes("lock")
                                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
                                  : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
                            }`}
                          >
                            {log.action.includes("delete") ? (
                              <Trash2 className="w-5 h-5 text-red-400" />
                            ) : log.action.includes("lock") ? (
                              <Lock className="w-5 h-5 text-amber-400" />
                            ) : log.action.includes("pin") ? (
                              <Pin className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Shield className="w-5 h-5 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <p
                              className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {log.admin_name || "Admin"}
                            </p>
                            <p
                              className={`text-sm capitalize ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {log.action.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                          >
                            {format(new Date(log.created_at), "PPp")}
                          </p>
                          {log.ip_address && (
                            <p
                              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              IP: {log.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                      {log.target_type && log.target_id && (
                        <div
                          className={`mt-3 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}
                        >
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            Target:{" "}
                            <span className="font-medium">
                              {log.target_type}
                            </span>{" "}
                            ({log.target_id.substring(0, 8)}...)
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="text-center py-16">
                      <Activity
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        No audit logs found
                      </p>
                    </div>
                  )}

                  {totalLogs > 20 && (
                    <div
                      className={`flex items-center justify-between p-5 rounded-2xl ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-800"
                          : "bg-white border border-slate-200"
                      }`}
                    >
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Page {logsPage} of {Math.ceil(totalLogs / 20)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logsPage === 1}
                          onClick={() => setLogsPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logsPage >= Math.ceil(totalLogs / 20)}
                          onClick={() => setLogsPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent
          className={isDark ? "bg-slate-900 border-slate-800" : ""}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteDialog?.type}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog?.type === "post") {
                  handleDeletePost(deleteDialog.id);
                } else if (deleteDialog?.type === "comment") {
                  handleDeleteComment(deleteDialog.id);
                }
                setDeleteDialog(null);
              }}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminSocialPage() {
  return (
    <AdminGuard>
      <AdminSocialContent />
    </AdminGuard>
  );
}
