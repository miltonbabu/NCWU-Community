import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, xingyuanAdminApi } from "@/lib/api";
import { XingyuanAdminPanel } from "@/components/admin/XingyuanAdminPanel";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/AuthGuard";
import type {
  User,
  LoginLog,
  AdminDashboardStats,
  UserRole,
} from "@/types/auth";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Activity,
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Ban,
  Trash2,
  Key,
  KeyRound,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  Crown,
  Clock,
  Monitor,
  MousePointer,
  RefreshCw,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Check,
  X,
  BarChart3,
  Trophy,
  TrendingUp,
  Zap,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  MessageSquare,
  Heart,
  MessageSquareText,
  Server,
  HardDrive,
  ActivitySquare,
  Flag,
  PieChart,
  ShoppingCart,
  BookOpen,
  Camera,
} from "lucide-react";

const departments = [
  "Computer Science & Technology",
  "Economics",
  "Civil Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Water Resources",
  "Business Administration",
  "Other",
];

const currentYears = [
  { value: "1", label: "1st Year (Freshman)" },
  { value: "2", label: "2nd Year (Sophomore)" },
  { value: "3", label: "3rd Year (Junior)" },
  { value: "4", label: "4th Year (Senior)" },
  { value: "5", label: "5th Year" },
  { value: "6", label: "6th Year" },
];

const enrollmentYears = Array.from({ length: 10 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

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

function AdminDashboardContent() {
  useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user: currentUser, logout } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "logs"
    | "visitors"
    | "health"
    | "activity"
    | "moderation"
    | "analytics"
  >("dashboard");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentLogins, setRecentLogins] = useState<LoginLog[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);

  const [users, setUsers] = useState<User[]>([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [visitors, setVisitors] = useState<
    import("@/types/auth").VisitorWithUser[]
  >([]);
  const [visitorsPagination, setVisitorsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLoginHistory, setUserLoginHistory] = useState<LoginLog[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>(
    {},
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState("");
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    student_id: "",
    email: "",
    password: "",
    role: "user" as UserRole,
  });
  const [createUserErrors, setCreateUserErrors] = useState<
    Record<string, string>
  >({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // New feature states
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    timestamp: string;
    database: {
      connected: boolean;
      latency: number;
      size: number;
      tables: Array<{ name: string; count: number }>;
    };
    errors: { lastHour: number };
    uptime: number;
  } | null>(null);

  const [activityFeed, setActivityFeed] = useState<
    Array<{
      id: string;
      type: string;
      user_id: string;
      user_name: string;
      content: string;
      created_at: string;
    }>
  >([]);

  const [moderationQueue, setModerationQueue] = useState<{
    queue: Array<{
      id: string;
      type: string;
      content: string;
      author_id: string;
      author_name: string;
      reason: string;
      created_at: string;
    }>;
    counts: {
      flaggedPosts: number;
      recentComments: number;
      bannedUsers: number;
      total: number;
    };
  } | null>(null);

  const [analytics, setAnalytics] = useState<{
    userGrowth: Array<{ date: string; count: number }>;
    postActivity: Array<{ date: string; count: number }>;
    loginActivity: Array<{ date: string; count: number }>;
    engagementStats: Array<{ date: string; likes: number; comments: number }>;
    topUsers: Array<{
      id: string;
      full_name: string;
      post_count: number;
      comment_count: number;
      like_count: number;
    }>;
    departmentStats: Array<{ department: string; count: number }>;
  } | null>(null);

  const [analyticsDays, setAnalyticsDays] = useState(7);

  const loadDashboard = useCallback(async () => {
    const response = await adminApi.getDashboard();
    if (response.success && response.data) {
      setStats(response.data.stats);
      setRecentLogins(response.data.recentLogins as LoginLog[]);
      setRecentUsers(response.data.recentUsers as User[]);
      setLastUpdated(new Date());
    }
    setIsLoading(false);
  }, []);

  const loadUsers = useCallback(
    async (page: number) => {
      const response = await adminApi.getUsers(
        page,
        usersPagination.limit,
        searchQuery,
      );
      if (response.success && response.data) {
        setUsers(response.data.users);
        setUsersPagination((prev) => ({
          ...prev,
          page,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }));
      }
    },
    [usersPagination.limit, searchQuery],
  );

  const loadLoginLogs = useCallback(
    async (page: number) => {
      const response = await adminApi.getLoginLogs(page, logsPagination.limit);
      if (response.success && response.data) {
        setLoginLogs(response.data.logs);
        setLogsPagination((prev) => ({
          ...prev,
          page,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }));
      }
    },
    [logsPagination.limit],
  );

  const loadVisitors = useCallback(
    async (page: number) => {
      const response = await adminApi.getVisitors(
        page,
        visitorsPagination.limit,
      );
      if (response.success && response.data) {
        setVisitors(response.data.visitors);
        setVisitorsPagination((prev) => ({
          ...prev,
          page,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }));
      }
    },
    [visitorsPagination.limit],
  );

  const loadSystemHealth = useCallback(async () => {
    const response = await adminApi.getSystemHealth();
    if (response.success && response.data) {
      setSystemHealth(response.data);
    }
  }, []);

  const loadActivityFeed = useCallback(async () => {
    const response = await adminApi.getActivityFeed(30);
    if (response.success && response.data) {
      setActivityFeed(response.data.activities);
    }
  }, []);

  const loadModerationQueue = useCallback(async () => {
    const response = await adminApi.getModerationQueue();
    if (response.success && response.data) {
      setModerationQueue(response.data);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    const response = await adminApi.getAnalytics(analyticsDays);
    if (response.success && response.data) {
      setAnalytics(response.data);
    }
  }, [analyticsDays]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers(usersPagination.page);
    }
  }, [activeTab, searchQuery, loadUsers, usersPagination.page]);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLoginLogs(logsPagination.page);
    }
  }, [activeTab, loadLoginLogs, logsPagination.page]);

  useEffect(() => {
    if (activeTab === "visitors") {
      loadVisitors(visitorsPagination.page);
    }
  }, [activeTab, loadVisitors, visitorsPagination.page]);

  useEffect(() => {
    if (activeTab === "health") {
      loadSystemHealth();
    }
  }, [activeTab, loadSystemHealth]);

  useEffect(() => {
    if (activeTab === "activity") {
      loadActivityFeed();
    }
  }, [activeTab, loadActivityFeed]);

  useEffect(() => {
    if (activeTab === "moderation") {
      loadModerationQueue();
    }
  }, [activeTab, loadModerationQueue]);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab, analyticsDays, loadAnalytics]);

  useEffect(() => {
    if (!autoRefresh || activeTab !== "dashboard") return;

    const interval = setInterval(() => {
      loadDashboard();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, refreshInterval, loadDashboard]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (activeTab === "activity") {
        loadActivityFeed();
      }
      if (activeTab === "health") {
        loadSystemHealth();
      }
      if (activeTab === "moderation") {
        loadModerationQueue();
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    activeTab,
    refreshInterval,
    loadActivityFeed,
    loadSystemHealth,
    loadModerationQueue,
  ]);

  const handleDeleteLoginLog = async (logId: string) => {
    if (!window.confirm("Are you sure you want to delete this login log?")) {
      return;
    }

    const response = await adminApi.deleteLoginLog(logId);
    if (response.success) {
      toast.success("Login log deleted successfully");
      loadLoginLogs(logsPagination.page);
    } else {
      toast.error(response.message || "Failed to delete login log");
    }
  };

  const handleDeleteAllLoginLogs = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL login logs? This action cannot be undone.",
      )
    ) {
      return;
    }

    const response = await adminApi.deleteAllLoginLogs();
    if (response.success) {
      toast.success(`Deleted ${response.data?.deletedCount || 0} login logs`);
      loadLoginLogs(1);
    } else {
      toast.error(response.message || "Failed to delete login logs");
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this visitor record?")
    ) {
      return;
    }

    const response = await adminApi.deleteVisitor(visitorId);
    if (response.success) {
      toast.success("Visitor record deleted successfully");
      loadVisitors(visitorsPagination.page);
    } else {
      toast.error(response.message || "Failed to delete visitor record");
    }
  };

  const handleDeleteAllVisitors = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL visitor records? This action cannot be undone.",
      )
    ) {
      return;
    }

    const response = await adminApi.deleteAllVisitors();
    if (response.success) {
      toast.success(
        `Deleted ${response.data?.deletedCount || 0} visitor records`,
      );
      loadVisitors(1);
    } else {
      toast.error(response.message || "Failed to delete visitor records");
    }
  };

  const viewUser = async (user: User) => {
    const response = await adminApi.getUser(user.id);
    if (response.success && response.data) {
      setSelectedUser(response.data.user);
      setUserLoginHistory(response.data.loginHistory);
      setIsUserDialogOpen(true);
    }
  };

  const openEditDialog = (user: User) => {
    setEditFormData({
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      department: user.department || "",
      enrollment_year: user.enrollment_year,
      current_year: user.current_year,
      phone: user.phone || "",
      country: user.country || "",
      bio: user.bio || "",
      role: user.role || "user",
      is_admin: user.is_admin,
      is_banned: user.is_banned,
      is_verified: user.is_verified,
    });
    setEditFormErrors({});
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (!editFormData.full_name?.trim()) {
      errors.full_name = "Full name is required";
    }

    if (!editFormData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = "Invalid email format";
    }

    if (editFormData.phone && !/^[\d\s\-+()]+$/.test(editFormData.phone)) {
      errors.phone = "Invalid phone number format";
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (!validateEditForm()) {
      return;
    }

    const response = await adminApi.updateUser(selectedUser.id, editFormData);
    if (response.success) {
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      loadUsers(usersPagination.page);
      if (isUserDialogOpen) {
        viewUser(selectedUser);
      }
    } else {
      toast.error(response.message || "Failed to update user");
    }
  };

  const handleBanUser = async (user: User) => {
    const response = user.is_banned
      ? await adminApi.unbanUser(user.id)
      : await adminApi.banUser(user.id);

    if (response.success) {
      toast.success(
        user.is_banned
          ? "User unbanned successfully"
          : "User banned successfully",
      );
      loadUsers(usersPagination.page);
    } else {
      toast.error(response.message || "Action failed");
    }
  };

  const handleDeleteProfileData = async (user: User) => {
    if (
      confirm(
        `Are you sure you want to delete ALL profile data for ${user.full_name}? This will remove HSK data, saved words, sentences, grammar, quizzes, flashcards, learned data, social posts, comments, language exchange messages, Discord messages and images. This action cannot be undone. The user's profile info (name, student ID, email, avatar) will be preserved.`,
      )
    ) {
      const response = await adminApi.deleteUserProfileData(user.id);
      if (response.success) {
        toast.success("Profile data deleted successfully");
      } else {
        toast.error(response.message || "Action failed");
      }
    }
  };

  const handleDeleteHSKData = async (user: User) => {
    if (
      confirm(
        `Are you sure you want to delete ALL HSK data for ${user.full_name}? This will remove learned words, saved words, quiz results, bookmarks, word lists, and progress data. This action cannot be undone.`,
      )
    ) {
      const response = await adminApi.deleteUserHSKData(user.id);
      if (response.success) {
        toast.success("HSK data deleted successfully");
      } else {
        toast.error(response.message || "Action failed");
      }
    }
  };

  const handleVerifyUser = async (user: User) => {
    const response = await adminApi.updateUser(user.id, {
      is_verified: !user.is_verified,
    });

    if (response.success) {
      toast.success(
        user.is_verified
          ? "User unverified successfully"
          : "User verified successfully",
      );
      loadUsers(usersPagination.page);
    } else {
      toast.error(response.message || "Action failed");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${user.full_name}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    const response = await adminApi.deleteUser(user.id);
    if (response.success) {
      toast.success("User deleted successfully");
      loadUsers(usersPagination.page);
    } else {
      toast.error(response.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPasswordData || resetPasswordData.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const response = await adminApi.resetUserPassword(
      selectedUser.id,
      resetPasswordData,
    );
    if (response.success) {
      toast.success("Password reset successfully");
      setIsResetPasswordDialogOpen(false);
      setResetPasswordData("");
    } else {
      toast.error(response.message || "Failed to reset password");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  const validateCreateUserForm = () => {
    const errors: Record<string, string> = {};

    if (!newUserData.student_id.trim()) {
      errors.student_id = "Student ID is required";
    }

    if (!newUserData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email)) {
      errors.email = "Invalid email format";
    }

    if (!newUserData.password) {
      errors.password = "Password is required";
    } else if (newUserData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setCreateUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateCreateUserForm()) return;

    const response = await adminApi.createUser(newUserData);
    if (response.success) {
      toast.success("User created successfully");
      setIsCreateUserDialogOpen(false);
      setNewUserData({
        student_id: "",
        email: "",
        password: "",
        role: "user",
      });
      loadUsers(usersPagination.page);
    } else {
      toast.error(response.message || "Failed to create user");
    }
  };

  const handleDownloadExcel = async () => {
    try {
      toast.loading("Preparing Excel download...");
      const response = await adminApi.getAllUsers(1, 10000);
      if (response.success && response.data) {
        const allUsers = response.data.users;

        const headers = [
          "Student ID",
          "Full Name",
          "Email",
          "Department",
          "Enrollment Year",
          "Current Year",
          "Phone",
          "Country",
          "Role",
          "Verified",
          "Banned",
          "Created At",
          "Updated At",
        ];

        const csvContent = [
          headers.join(","),
          ...allUsers.map((user: User) =>
            [
              user.student_id,
              `"${user.full_name}"`,
              user.email,
              user.department || "",
              user.enrollment_year || "",
              user.current_year || "",
              user.phone || "",
              user.country || "",
              user.role,
              user.is_verified ? "Yes" : "No",
              user.is_banned ? "Yes" : "No",
              user.created_at,
              user.updated_at,
            ].join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `ncwu_users_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.dismiss();
        toast.success("Excel file downloaded successfully!");
      } else {
        toast.dismiss();
        toast.error("Failed to download users data");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download users data");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Preparing PDF download...");
      const response = await adminApi.getAllUsers(1, 10000);
      if (response.success && response.data) {
        const allUsers = response.data.users;

        const pdfContent = allUsers
          .map(
            (user: User, index: number) => `
${index + 1}. ${user.full_name}
   Student ID: ${user.student_id}
   Email: ${user.email}
   Department: ${user.department || "N/A"}
   Enrollment Year: ${user.enrollment_year || "N/A"}
   Current Year: ${user.current_year ? `${user.current_year}${getOrdinalSuffix(user.current_year)} Year` : "N/A"}
   Phone: ${user.phone || "N/A"}
   Country: ${user.country || "N/A"}
   Role: ${user.role}
   Verified: ${user.is_verified ? "Yes" : "No"}
   Banned: ${user.is_banned ? "Yes" : "No"}
   Created: ${formatDate(user.created_at)}
   Updated: ${formatDate(user.updated_at)}
────────────────────────────────────────
        `,
          )
          .join("\n");

        const fullContent = `
NCWU Community - All Users Report
Generated: ${new Date().toLocaleString()}
Total Users: ${allUsers.length}

═══════════════════════════════════════════════════════════════

${pdfContent}
        `;

        const blob = new Blob([fullContent], {
          type: "text/plain;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `ncwu_users_${new Date().toISOString().split("T")[0]}.txt`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.dismiss();
        toast.success("PDF file downloaded successfully!");
      } else {
        toast.dismiss();
        toast.error("Failed to download users data");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download users data");
    }
  };

  const canModifyUser = (targetUser: User) => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    if (targetUser.role === "superadmin") return false;
    return true;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      gradient: "from-violet-500 to-purple-600",
      activeGradient: "bg-gradient-to-r from-violet-500 to-purple-600",
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      gradient: "from-cyan-500 to-blue-600",
      activeGradient: "bg-gradient-to-r from-cyan-500 to-blue-600",
    },
    {
      id: "social",
      label: "Social",
      icon: MessageCircle,
      gradient: "from-pink-500 to-rose-600",
      activeGradient: "bg-gradient-to-r from-pink-500 to-rose-600",
      link: "/admin/social",
    },
    {
      id: "gallery",
      label: "Photo Gallery",
      icon: Camera,
      gradient: "from-orange-500 to-amber-600",
      activeGradient: "bg-gradient-to-r from-orange-500 to-amber-600",
      link: "/admin/gallery",
    },
    {
      id: "discord",
      label: "Discords",
      icon: MessageSquare,
      gradient: "from-blue-500 to-indigo-600",
      activeGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
      link: "/admin/discord",
    },
    {
      id: "market",
      label: "Market",
      icon: ShoppingCart,
      gradient: "from-emerald-500 to-teal-600",
      activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-600",
      link: "/admin/market",
    },
    {
      id: "flags",
      label: "Flags",
      icon: Flag,
      gradient: "from-red-500 to-orange-600",
      activeGradient: "bg-gradient-to-r from-red-500 to-orange-600",
      link: "/admin/flags",
    },
    {
      id: "password-recovery",
      label: "Password Recovery",
      icon: KeyRound,
      gradient: "from-purple-500 to-pink-600",
      activeGradient: "bg-gradient-to-r from-purple-500 to-pink-600",
      link: "/admin/password-recovery",
    },
    {
      id: "language-exchange",
      label: "Language Exchange",
      icon: Globe,
      gradient: "from-green-500 to-emerald-600",
      activeGradient: "bg-gradient-to-r from-green-500 to-emerald-600",
      link: "/admin/language-exchange",
    },
    {
      id: "top-members",
      label: "Top Members",
      icon: Trophy,
      gradient: "from-amber-500 to-yellow-600",
      activeGradient: "bg-gradient-to-r from-amber-500 to-yellow-600",
      link: "/admin/top-members",
    },
    {
      id: "xingyuan",
      label: "Xingyuan AI",
      icon: Sparkles,
      gradient: "from-violet-500 to-fuchsia-600",
      activeGradient: "bg-gradient-to-r from-violet-500 to-fuchsia-600",
    },
    {
      id: "deleted-content",
      label: "Deleted Content",
      icon: Trash2,
      gradient: "from-red-500 to-orange-600",
      activeGradient: "bg-gradient-to-r from-red-500 to-orange-600",
      link: "/admin/deleted-content",
    },
    {
      id: "logs",
      label: "Login Logs",
      icon: LogIn,
      gradient: "from-amber-500 to-orange-600",
      activeGradient: "bg-gradient-to-r from-amber-500 to-orange-600",
    },
    {
      id: "visitors",
      label: "Visitors",
      icon: Globe,
      gradient: "from-emerald-500 to-teal-600",
      activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-600",
    },
    {
      id: "health",
      label: "System Health",
      icon: Server,
      gradient: "from-rose-500 to-pink-600",
      activeGradient: "bg-gradient-to-r from-rose-500 to-pink-600",
    },
    {
      id: "activity",
      label: "Activity Feed",
      icon: ActivitySquare,
      gradient: "from-sky-500 to-cyan-600",
      activeGradient: "bg-gradient-to-r from-sky-500 to-cyan-600",
    },
    {
      id: "moderation",
      label: "Moderation",
      icon: Flag,
      gradient: "from-orange-500 to-red-600",
      activeGradient: "bg-gradient-to-r from-orange-500 to-red-600",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: PieChart,
      gradient: "from-indigo-500 to-violet-600",
      activeGradient: "bg-gradient-to-r from-indigo-500 to-violet-600",
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
              to="/"
              className={`flex items-center gap-3 mb-10 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
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

                if (item.link) {
                  return (
                    <Link
                      key={item.id}
                      to={item.link}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                        isDark
                          ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                }

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
          </div>

          <div
            className={`shrink-0 p-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
          >
            <div
              className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              <Avatar className="w-10 h-10 ring-2 ring-violet-500/30">
                <AvatarImage src={currentUser?.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
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
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Dashboard
                  </h1>
                  <p
                    className={`mt-2 text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Welcome back, {currentUser?.full_name?.split(" ")[0]}! 👋
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-white"} shadow-lg`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}
                    />
                    <span
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {autoRefresh ? "Real-time" : "Paused"}
                    </span>
                    <select
                      value={refreshInterval}
                      onChange={(e) =>
                        setRefreshInterval(Number(e.target.value))
                      }
                      className={`text-sm bg-transparent border-none outline-none cursor-pointer ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <option value="5">5s</option>
                      <option value="10">10s</option>
                      <option value="30">30s</option>
                      <option value="60">60s</option>
                    </select>
                  </div>
                  <Button
                    onClick={() => {
                      loadDashboard();
                      toast.success("Data refreshed");
                    }}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats?.users.total || 0}
                  subtitle={`${stats?.users.newToday || 0} new today`}
                  icon={Users}
                  gradient="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600"
                  iconBg="bg-white/20"
                  trend="up"
                  trendValue={`+${stats?.users.newToday || 0}`}
                  isLive
                />
                <StatCard
                  title="Total Logins"
                  value={stats?.logins.total || 0}
                  subtitle={`${stats?.logins.today || 0} today`}
                  icon={LogIn}
                  gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
                  iconBg="bg-white/20"
                  trend="up"
                  trendValue={`+${stats?.logins.today || 0}`}
                  isLive
                />
                <StatCard
                  title="Total Visitors"
                  value={stats?.visitors.total || 0}
                  subtitle={`${stats?.visitors.uniqueToday || 0} unique today`}
                  icon={Globe}
                  gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                  iconBg="bg-white/20"
                  trend="up"
                  trendValue={`+${stats?.visitors.today || 0}`}
                  isLive
                />
                <StatCard
                  title="Administrators"
                  value={stats?.users.admins || 0}
                  subtitle={`${stats?.users.banned || 0} banned users`}
                  icon={Shield}
                  gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
                  iconBg="bg-white/20"
                  trend="neutral"
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
                      Recent Login Activity
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("logs")}
                      className="text-violet-500 hover:text-violet-600"
                    >
                      View All →
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentLogins.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                          isDark
                            ? "bg-slate-800/50 hover:bg-slate-800"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-xl ${
                            log.login_status === "success"
                              ? "bg-emerald-500/20"
                              : "bg-red-500/20"
                          }`}
                        >
                          {log.login_status === "success" ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {(log as any).full_name || log.user_id}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin
                              className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            />
                            <span
                              className={
                                isDark ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              {log.ip_address}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {formatDate(log.login_at)}
                          </p>
                        </div>
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
                  <div className="flex items-center justify-between mb-6">
                    <h2
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      New Users
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("users")}
                      className="text-violet-500 hover:text-violet-600"
                    >
                      View All →
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentUsers.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          isDark
                            ? "bg-slate-800/50 hover:bg-slate-800"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <Avatar className="w-10 h-10 ring-2 ring-violet-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-sm">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user.full_name}
                          </p>
                          <p
                            className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {user.department || "No department"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-5 rounded-2xl ${
                  isDark
                    ? "bg-slate-900/50 border border-slate-800"
                    : "bg-white border border-slate-200"
                } shadow-lg`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <Clock
                      className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Last updated
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {lastUpdated.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        autoRefresh
                          ? "bg-violet-500"
                          : isDark
                            ? "bg-slate-700"
                            : "bg-slate-300"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoRefresh ? "translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    Auto-refresh
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    User Management
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Manage all registered users
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {isSuperAdmin && (
                    <Button
                      onClick={() => setIsCreateUserDialogOpen(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  )}
                  <Button
                    onClick={handleDownloadExcel}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <div className="relative">
                    <Search
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-12 w-72 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-2xl overflow-hidden ${
                  isDark
                    ? "bg-slate-900/50 border border-slate-800"
                    : "bg-white border border-slate-200"
                } shadow-xl`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
                      >
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          User
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Department
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Status
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-b last:border-b-0 transition-colors ${
                            isDark
                              ? "border-slate-800/50 hover:bg-slate-800/30"
                              : "border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-11 h-11 ring-2 ring-violet-500/20">
                                <AvatarImage src={user.avatar_url || ""} />
                                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p
                                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  {user.full_name}
                                </p>
                                <p
                                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {user.student_id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <span
                              className={`${isDark ? "text-slate-300" : "text-slate-600"}`}
                            >
                              {user.department || "-"}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="flex gap-1.5 flex-wrap">
                              {user.role === "superadmin" && (
                                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                                  <Crown className="w-3 h-3 mr-1" />
                                  SuperAdmin
                                </Badge>
                              )}
                              {user.role === "admin" && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                              {user.is_banned && (
                                <Badge variant="destructive">Banned</Badge>
                              )}
                              {user.is_verified ? (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : user.role === "user" ? (
                                <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                                  <UserX className="w-3 h-3 mr-1" />
                                  Unverified
                                </Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => viewUser(user)}
                                title="View"
                                className="hover:bg-violet-500/20 hover:text-violet-500"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {canModifyUser(user) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditDialog(user)}
                                    title="Edit"
                                    className="hover:bg-cyan-500/20 hover:text-cyan-500"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsResetPasswordDialogOpen(true);
                                    }}
                                    title="Reset Password"
                                    className="hover:bg-amber-500/20 hover:text-amber-500"
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleBanUser(user)}
                                    title={user.is_banned ? "Unban" : "Ban"}
                                    className={`hover:bg-red-500/20 ${user.is_banned ? "text-green-500 hover:text-green-400" : "text-red-500 hover:text-red-400"}`}
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteProfileData(user)
                                    }
                                    title="Delete Profile Data"
                                    className="hover:bg-orange-500/20 hover:text-orange-500"
                                  >
                                    <Database className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleVerifyUser(user)}
                                    title={
                                      user.is_verified
                                        ? "Remove verification"
                                        : "Verify user"
                                    }
                                    className={`hover:bg-emerald-500/20 ${user.is_verified ? "text-emerald-500" : ""}`}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {isSuperAdmin && user.id !== currentUser?.id && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteHSKData(user)}
                                    title="Clear HSK Data"
                                    className="hover:bg-purple-500/20 hover:text-purple-400"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteUser(user)}
                                    title="Delete"
                                    className="text-red-500 hover:bg-red-500/20 hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {usersPagination.totalPages > 1 && (
                  <div
                    className={`flex items-center justify-between p-5 border-t ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}
                  >
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                      Showing{" "}
                      {(usersPagination.page - 1) * usersPagination.limit + 1}{" "}
                      to{" "}
                      {Math.min(
                        usersPagination.page * usersPagination.limit,
                        usersPagination.total,
                      )}{" "}
                      of {usersPagination.total} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPagination.page === 1}
                        onClick={() => loadUsers(usersPagination.page - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          usersPagination.page === usersPagination.totalPages
                        }
                        onClick={() => loadUsers(usersPagination.page + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Login Logs
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Track all login activities
                  </p>
                </div>
                {isSuperAdmin && (
                  <Button
                    onClick={handleDeleteAllLoginLogs}
                    variant="destructive"
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Logs
                  </Button>
                )}
              </div>

              <div
                className={`rounded-2xl overflow-hidden ${
                  isDark
                    ? "bg-slate-900/50 border border-slate-800"
                    : "bg-white border border-slate-200"
                } shadow-xl`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
                      >
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          User
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          IP Address
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Status
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Time
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className={`p-8 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            No login logs found
                          </td>
                        </tr>
                      ) : (
                        loginLogs.map((log) => (
                          <tr
                            key={log.id}
                            className={`border-b last:border-b-0 ${
                              isDark
                                ? "border-slate-800/50 hover:bg-slate-800/30"
                                : "border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <td className="p-5">
                              <div>
                                <p
                                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  {(log as any).full_name || log.user_id}
                                </p>
                                <p
                                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {(log as any).student_id || ""}
                                </p>
                              </div>
                            </td>
                            <td className="p-5">
                              <span
                                className={`font-mono text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                              >
                                {log.ip_address}
                              </span>
                            </td>
                            <td className="p-5">
                              <Badge
                                className={
                                  log.login_status === "success"
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                                    : "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0"
                                }
                              >
                                {log.login_status}
                              </Badge>
                            </td>
                            <td className="p-5">
                              <span
                                className={
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }
                              >
                                {formatDate(log.login_at)}
                              </span>
                            </td>
                            <td className="p-5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteLoginLog(log.id)}
                                title="Delete"
                                className="text-red-500 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {logsPagination.totalPages > 1 && (
                  <div
                    className={`flex items-center justify-between p-5 border-t ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}
                  >
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                      Page {logsPagination.page} of {logsPagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPagination.page === 1}
                        onClick={() => loadLoginLogs(logsPagination.page - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          logsPagination.page === logsPagination.totalPages
                        }
                        onClick={() => loadLoginLogs(logsPagination.page + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "visitors" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Visitor Tracking
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Monitor website traffic in real-time
                  </p>
                </div>
                {isSuperAdmin && (
                  <Button
                    onClick={handleDeleteAllVisitors}
                    variant="destructive"
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Records
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Visits"
                  value={stats?.visitors.total || 0}
                  icon={MousePointer}
                  gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                  iconBg="bg-white/20"
                  isLive
                />
                <StatCard
                  title="Unique Today"
                  value={stats?.visitors.uniqueToday || 0}
                  icon={Monitor}
                  gradient="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600"
                  iconBg="bg-white/20"
                  isLive
                />
                <StatCard
                  title="Visits Today"
                  value={stats?.visitors.today || 0}
                  icon={Activity}
                  gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
                  iconBg="bg-white/20"
                  isLive
                />
              </div>

              <div
                className={`rounded-2xl overflow-hidden ${
                  isDark
                    ? "bg-slate-900/50 border border-slate-800"
                    : "bg-white border border-slate-200"
                } shadow-xl`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
                      >
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          User
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          IP Address
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Page
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Time
                        </th>
                        <th
                          className={`text-left p-5 font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className={`p-8 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            No visitor records found
                          </td>
                        </tr>
                      ) : (
                        visitors.map((visitor) => (
                          <tr
                            key={visitor.id}
                            className={`border-b last:border-b-0 ${
                              isDark
                                ? "border-slate-800/50 hover:bg-slate-800/30"
                                : "border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <td className="p-5">
                              {visitor.user_name ? (
                                <div>
                                  <p
                                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    {visitor.user_name}
                                  </p>
                                  <p
                                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    {visitor.user_student_id}
                                  </p>
                                </div>
                              ) : (
                                <span
                                  className={`${isDark ? "text-slate-500" : "text-slate-400"} italic`}
                                >
                                  Guest User
                                </span>
                              )}
                            </td>
                            <td className="p-5">
                              <span
                                className={`font-mono text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                              >
                                {visitor.ip_address || "Unknown"}
                              </span>
                            </td>
                            <td className="p-5">
                              <span
                                className={`${isDark ? "text-slate-300" : "text-slate-600"}`}
                              >
                                {visitor.page_visited || "-"}
                              </span>
                            </td>
                            <td className="p-5">
                              <span
                                className={
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }
                              >
                                {formatDate(visitor.visited_at)}
                              </span>
                            </td>
                            <td className="p-5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVisitor(visitor.id)}
                                title="Delete"
                                className="text-red-500 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {visitorsPagination.totalPages > 1 && (
                  <div
                    className={`flex items-center justify-between p-5 border-t ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}
                  >
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                      Page {visitorsPagination.page} of{" "}
                      {visitorsPagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={visitorsPagination.page === 1}
                        onClick={() =>
                          loadVisitors(visitorsPagination.page - 1)
                        }
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          visitorsPagination.page ===
                          visitorsPagination.totalPages
                        }
                        onClick={() =>
                          loadVisitors(visitorsPagination.page + 1)
                        }
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    System Health
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Real-time database and server status monitoring
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-white"} shadow-lg`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${systemHealth?.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <span
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {systemHealth?.status === "healthy"
                        ? "System Healthy"
                        : "Issues Detected"}
                    </span>
                  </div>
                  <Button
                    onClick={loadSystemHealth}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title="Database Latency"
                  value={systemHealth?.database.latency || 0}
                  subtitle="milliseconds"
                  icon={Zap}
                  gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                  iconBg="bg-white/20"
                  isLive
                />
                <StatCard
                  title="DB Size"
                  value={Math.round(
                    (systemHealth?.database.size || 0) / 1024 / 1024,
                  )}
                  subtitle="MB"
                  icon={HardDrive}
                  gradient="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600"
                  iconBg="bg-white/20"
                />
                <StatCard
                  title="Errors (1h)"
                  value={systemHealth?.errors.lastHour || 0}
                  subtitle="failed operations"
                  icon={AlertTriangle}
                  gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
                  iconBg="bg-white/20"
                  trend={
                    systemHealth && systemHealth.errors.lastHour > 0
                      ? "up"
                      : "neutral"
                  }
                />
                <StatCard
                  title="Uptime"
                  value={Math.floor((systemHealth?.uptime || 0) / 3600)}
                  subtitle="hours"
                  icon={Clock}
                  gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
                  iconBg="bg-white/20"
                />
              </div>

              <div
                className={`rounded-2xl p-6 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
              >
                <h2
                  className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Database Table Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {systemHealth?.database.tables.map((table) => (
                    <div
                      key={table.name}
                      className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"} text-center`}
                    >
                      <Database
                        className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      />
                      <p
                        className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {table.count.toLocaleString()}
                      </p>
                      <p
                        className={`text-xs capitalize ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {table.name.replace(/_/g, " ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-lg`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <Clock
                      className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Last Health Check
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {systemHealth?.timestamp
                        ? new Date(systemHealth.timestamp).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Activity Feed
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Real-time user activity stream
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={async () => {
                      if (
                        !confirm(
                          "Are you sure you want to clear all login logs? This cannot be undone.",
                        )
                      )
                        return;
                      try {
                        const response = await adminApi.clearLoginLogs();
                        if (response.success) {
                          toast.success("Login logs cleared");
                          loadActivityFeed();
                        } else {
                          toast.error("Failed to clear login logs");
                        }
                      } catch (error) {
                        toast.error("Failed to clear login logs");
                      }
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Login Logs
                  </Button>
                  <Button
                    onClick={async () => {
                      if (
                        !confirm(
                          "Are you sure you want to clear all admin audit logs? This cannot be undone.",
                        )
                      )
                        return;
                      try {
                        const response = await adminApi.clearAdminAuditLogs();
                        if (response.success) {
                          toast.success("Admin audit logs cleared");
                        } else {
                          toast.error("Failed to clear admin audit logs");
                        }
                      } catch (error) {
                        toast.error("Failed to clear admin audit logs");
                      }
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Admin Logs
                  </Button>
                  <Button
                    onClick={loadActivityFeed}
                    className="bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div
                className={`rounded-2xl overflow-hidden ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
              >
                <div className="p-6">
                  <div className="space-y-4">
                    {activityFeed.length === 0 ? (
                      <p
                        className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        No recent activity
                      </p>
                    ) : (
                      activityFeed.map((activity, index) => (
                        <div
                          key={`${activity.id}-${index}`}
                          className={`flex items-start gap-4 p-4 rounded-xl ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"} transition-colors`}
                        >
                          <div
                            className={`p-2.5 rounded-xl ${
                              activity.type === "post"
                                ? "bg-blue-500/20"
                                : activity.type === "comment"
                                  ? "bg-green-500/20"
                                  : activity.type === "like"
                                    ? "bg-pink-500/20"
                                    : activity.type === "login"
                                      ? "bg-amber-500/20"
                                      : "bg-slate-500/20"
                            }`}
                          >
                            {activity.type === "post" && (
                              <MessageCircle className="w-5 h-5 text-blue-500" />
                            )}
                            {activity.type === "comment" && (
                              <MessageSquareText className="w-5 h-5 text-green-500" />
                            )}
                            {activity.type === "like" && (
                              <Heart className="w-5 h-5 text-pink-500" />
                            )}
                            {activity.type === "login" && (
                              <LogIn className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {activity.user_name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs capitalize"
                              >
                                {activity.type}
                              </Badge>
                            </div>
                            <p
                              className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {activity.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "moderation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Moderation Queue
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Review flagged content and user actions
                  </p>
                </div>
                <Button
                  onClick={loadModerationQueue}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Flagged Posts"
                  value={moderationQueue?.counts.flaggedPosts || 0}
                  subtitle="emergency/locked"
                  icon={Flag}
                  gradient="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600"
                  iconBg="bg-white/20"
                />
                <StatCard
                  title="Recent Comments"
                  value={moderationQueue?.counts.recentComments || 0}
                  subtitle="awaiting review"
                  icon={MessageSquareText}
                  gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
                  iconBg="bg-white/20"
                />
                <StatCard
                  title="Banned Users"
                  value={moderationQueue?.counts.bannedUsers || 0}
                  subtitle="active bans"
                  icon={Ban}
                  gradient="bg-gradient-to-br from-red-500 via-rose-500 to-pink-600"
                  iconBg="bg-white/20"
                />
              </div>

              <div
                className={`rounded-2xl overflow-hidden ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
              >
                <div className="p-6">
                  <h2
                    className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Moderation Queue ({moderationQueue?.queue.length || 0}{" "}
                    items)
                  </h2>
                  <div className="space-y-4">
                    {moderationQueue?.queue.length === 0 ? (
                      <p
                        className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        No items in moderation queue
                      </p>
                    ) : (
                      moderationQueue?.queue.map((item, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          className={`flex items-start gap-4 p-4 rounded-xl ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"} transition-colors`}
                        >
                          <div
                            className={`p-2.5 rounded-xl ${
                              item.type === "post"
                                ? "bg-blue-500/20"
                                : item.type === "comment"
                                  ? "bg-green-500/20"
                                  : item.type === "banned_user"
                                    ? "bg-red-500/20"
                                    : "bg-slate-500/20"
                            }`}
                          >
                            {item.type === "post" && (
                              <MessageCircle className="w-5 h-5 text-blue-500" />
                            )}
                            {item.type === "comment" && (
                              <MessageSquareText className="w-5 h-5 text-green-500" />
                            )}
                            {item.type === "banned_user" && (
                              <Ban className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {item.author_name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs capitalize"
                              >
                                {item.type.replace(/_/g, " ")}
                              </Badge>
                              <Badge
                                className={`text-xs ${
                                  item.reason === "emergency_post"
                                    ? "bg-red-500/20 text-red-400"
                                    : item.reason === "locked_post"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-slate-500/20 text-slate-400"
                                }`}
                              >
                                {item.reason.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {item.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Analytics
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    User engagement and growth metrics
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={analyticsDays.toString()}
                    onValueChange={(v) => setAnalyticsDays(Number(v))}
                  >
                    <SelectTrigger
                      className={`w-32 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                    >
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={loadAnalytics}
                    className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className={`rounded-2xl p-6 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
                >
                  <h2
                    className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    User Growth
                  </h2>
                  <div className="space-y-3">
                    {analytics?.userGrowth.map((day) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <span
                          className={`text-sm w-24 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((day.count / Math.max(...(analytics?.userGrowth.map((d) => d.count) || [1]))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium w-8 text-right ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {day.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-6 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
                >
                  <h2
                    className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Post Activity
                  </h2>
                  <div className="space-y-3">
                    {analytics?.postActivity.map((day) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <span
                          className={`text-sm w-24 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                            style={{
                              width: `${Math.min((day.count / Math.max(...(analytics?.postActivity.map((d) => d.count) || [1]))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium w-8 text-right ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {day.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-6 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
                >
                  <h2
                    className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Top Active Users
                  </h2>
                  <div className="space-y-3">
                    {analytics?.topUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-4 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                      >
                        <span
                          className={`text-lg font-bold w-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          #{index + 1}
                        </span>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user.full_name}
                          </p>
                          <p
                            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {user.post_count} posts · {user.comment_count}{" "}
                            comments · {user.like_count} likes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-6 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200"} shadow-xl`}
                >
                  <h2
                    className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Department Distribution
                  </h2>
                  <div className="space-y-3">
                    {analytics?.departmentStats.map((dept) => (
                      <div
                        key={dept.department}
                        className="flex items-center gap-4"
                      >
                        <span
                          className={`text-sm flex-1 truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {dept.department}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            style={{
                              width: `${Math.min((dept.count / Math.max(...(analytics?.departmentStats.map((d) => d.count) || [1]))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium w-8 text-right ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {dept.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "xingyuan" && <XingyuanAdminPanel isDark={isDark} />}
        </main>
      </div>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent
          className={`${isDark ? "bg-slate-900 border-slate-800" : ""} max-w-lg`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-2 ring-violet-500/30">
                  <AvatarFallback className="text-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    {getInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : ""}`}
                  >
                    {selectedUser.full_name}
                  </h3>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selectedUser.role === "superadmin" && (
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                        <Crown className="w-3 h-3 mr-1" />
                        SuperAdmin
                      </Badge>
                    )}
                    {selectedUser.role === "admin" && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {selectedUser.is_banned && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                    {selectedUser.is_verified &&
                      selectedUser.role === "user" && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Student ID
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.student_id}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Department
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.department || "-"}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Enrollment Year
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.enrollment_year || "-"}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Current Year
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.current_year
                      ? `${selectedUser.current_year}${getOrdinalSuffix(selectedUser.current_year)} Year`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Phone
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Country
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.country || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Bio
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {selectedUser.bio || "-"}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Created At
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {formatDate(selectedUser.created_at)}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Last Updated
                  </p>
                  <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                    {formatDate(selectedUser.updated_at)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Terms Agreement
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedUser.agreed_to_terms ? (
                      <>
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                          <Check className="w-3 h-3 mr-1" />
                          Agreed to Terms
                        </Badge>
                        {selectedUser.agreed_to_terms_at && (
                          <span
                            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            on {formatDate(selectedUser.agreed_to_terms_at)}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="destructive">
                        <X className="w-3 h-3 mr-1" />
                        Not Agreed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p
                  className={`text-sm mb-2 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Recent Login History
                </p>
                <div
                  className={`max-h-40 overflow-y-auto space-y-2 ${isDark ? "text-slate-300" : ""}`}
                >
                  {userLoginHistory.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex justify-between text-sm">
                      <span>{log.ip_address}</span>
                      <span
                        className={
                          log.login_status === "success"
                            ? "text-emerald-500"
                            : "text-red-500"
                        }
                      >
                        {log.login_status}
                      </span>
                      <span
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        {formatDate(log.login_at)}
                      </span>
                    </div>
                  ))}
                  {userLoginHistory.length === 0 && (
                    <p className="text-sm text-slate-500">No login history</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUserDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsUserDialogOpen(false);
                openEditDialog(selectedUser!);
              }}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className={`${isDark ? "bg-slate-900 border-slate-800" : ""} max-w-2xl max-h-[90vh] overflow-y-auto`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Student ID{" "}
                  {isSuperAdmin && (
                    <span className="text-amber-500">(Editable)</span>
                  )}
                </Label>
                <Input
                  value={editFormData.student_id || ""}
                  disabled={!isSuperAdmin}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      student_id: e.target.value,
                    }))
                  }
                  className={`${isDark ? "bg-slate-800 border-slate-700" : ""} ${
                    !isSuperAdmin ? "opacity-60" : ""
                  }`}
                  placeholder="2023LXSBXXXX"
                />
                {!isSuperAdmin && (
                  <p className="text-xs text-slate-500">
                    Only SuperAdmin can change Student ID
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Email *
                </Label>
                <Input
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className={`${isDark ? "bg-slate-800 border-slate-700" : ""} ${
                    editFormErrors.email ? "border-red-500" : ""
                  }`}
                  placeholder="user@email.com"
                />
                {editFormErrors.email && (
                  <p className="text-red-500 text-xs">{editFormErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Full Name *
                </Label>
                <Input
                  value={editFormData.full_name || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className={`${isDark ? "bg-slate-800 border-slate-700" : ""} ${
                    editFormErrors.full_name ? "border-red-500" : ""
                  }`}
                  placeholder="Enter full name"
                />
                {editFormErrors.full_name && (
                  <p className="text-red-500 text-xs">
                    {editFormErrors.full_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Department
                </Label>
                <Select
                  value={editFormData.department || ""}
                  onValueChange={(v) =>
                    setEditFormData((prev) => ({ ...prev, department: v }))
                  }
                >
                  <SelectTrigger
                    className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Enrollment Year
                </Label>
                <Select
                  value={editFormData.enrollment_year?.toString() || ""}
                  onValueChange={(v) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      enrollment_year: v ? parseInt(v) : undefined,
                    }))
                  }
                >
                  <SelectTrigger
                    className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  >
                    <SelectValue placeholder="Select enrollment year" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollmentYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Current Year
                </Label>
                <Select
                  value={editFormData.current_year?.toString() || ""}
                  onValueChange={(v) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      current_year: v ? parseInt(v) : undefined,
                    }))
                  }
                >
                  <SelectTrigger
                    className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  >
                    <SelectValue placeholder="Select current year" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentYears.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>Phone</Label>
                <Input
                  value={editFormData.phone || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className={`${isDark ? "bg-slate-800 border-slate-700" : ""} ${
                    editFormErrors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {editFormErrors.phone && (
                  <p className="text-red-500 text-xs">{editFormErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={isDark ? "text-slate-300" : ""}>
                  Country
                </Label>
                <Input
                  value={editFormData.country || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-slate-300" : ""}>Bio</Label>
              <Textarea
                value={editFormData.bio || ""}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
                placeholder="Short biography or notes..."
                rows={3}
              />
            </div>

            <div
              className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              <h4
                className={`text-sm font-semibold mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Account Status
              </h4>

              {isSuperAdmin && (
                <div className="mb-4">
                  <Label
                    className={`text-sm mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    User Role
                  </Label>
                  <Select
                    value={editFormData.role || "user"}
                    onValueChange={(v) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        role: v as UserRole,
                        is_admin: v === "admin" || v === "superadmin",
                      }))
                    }
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <SelectTrigger
                      className={isDark ? "bg-slate-700 border-slate-600" : ""}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">SuperAdmin</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedUser?.id === currentUser?.id && (
                    <p className="text-xs text-amber-500 mt-1">
                      You cannot change your own role
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_banned"
                    checked={editFormData.is_banned || false}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        is_banned: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label
                    htmlFor="is_banned"
                    className={`text-sm ${isDark ? "text-slate-300" : ""}`}
                  >
                    <Ban className="w-4 h-4 inline mr-1 text-red-500" />
                    Banned
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_verified"
                    checked={editFormData.is_verified || false}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        is_verified: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label
                    htmlFor="is_verified"
                    className={`text-sm ${isDark ? "text-slate-300" : ""}`}
                  >
                    <UserCheck className="w-4 h-4 inline mr-1 text-emerald-500" />
                    Verified
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsResetPasswordDialogOpen(open);
          if (!open) {
            setResetPasswordData("");
            setShowResetPassword(false);
          }
        }}
      >
        <DialogContent
          className={`${isDark ? "bg-slate-900 border-slate-800" : ""} max-w-md`}
        >
          <DialogHeader>
            <DialogTitle
              className={`${isDark ? "text-white" : ""} flex items-center gap-2`}
            >
              <Key className="w-5 h-5 text-amber-500" />
              Set New Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for this user account
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div
              className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              <Avatar className="w-12 h-12 ring-2 ring-amber-500/30">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  {getInitials(selectedUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {selectedUser.full_name}
                </p>
                <p
                  className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {selectedUser.email}
                </p>
                <p
                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  ID: {selectedUser.student_id}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={isDark ? "text-slate-300" : ""}>
                New Password
              </Label>
              <div className="relative">
                <Input
                  type={showResetPassword ? "text" : "password"}
                  value={resetPasswordData}
                  onChange={(e) => setResetPasswordData(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className={`${isDark ? "bg-slate-800 border-slate-700 pr-10" : "pr-10"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-600"}`}
                >
                  {showResetPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p
                className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Password must be at least 6 characters long
              </p>
              {resetPasswordData && resetPasswordData.length > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${resetPasswordData.length >= 6 ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span
                    className={`text-xs ${resetPasswordData.length >= 6 ? "text-green-500" : "text-red-500"}`}
                  >
                    {resetPasswordData.length >= 6
                      ? "Password is valid"
                      : "Password too short"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setResetPasswordData("");
                setShowResetPassword(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!resetPasswordData || resetPasswordData.length < 6}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Key className="w-4 h-4 mr-2" />
              Set New Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateUserDialogOpen}
        onOpenChange={(open) => {
          setIsCreateUserDialogOpen(open);
          if (!open) {
            setShowCreatePassword(false);
          }
        }}
      >
        <DialogContent
          className={isDark ? "bg-slate-900 border-slate-800" : ""}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              <UserPlus className="w-5 h-5 inline mr-2" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account. The user can edit their profile later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={isDark ? "text-slate-300" : ""}>
                Student ID *
              </Label>
              <Input
                value={newUserData.student_id}
                onChange={(e) =>
                  setNewUserData((prev) => ({
                    ...prev,
                    student_id: e.target.value,
                  }))
                }
                placeholder="2023LXSBXXXX"
                className={`${isDark ? "bg-slate-800 border-slate-700" : ""} ${
                  createUserErrors.student_id ? "border-red-500" : ""
                }`}
              />
              {createUserErrors.student_id && (
                <p className="text-red-500 text-xs">
                  {createUserErrors.student_id}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={isDark ? "text-slate-300" : ""}>Email *</Label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) =>
                  setNewUserData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="user@email.com"
                className={`${isDark ? "bg-slate-800 border-slate-700" : ""} ${
                  createUserErrors.email ? "border-red-500" : ""
                }`}
              />
              {createUserErrors.email && (
                <p className="text-red-500 text-xs">{createUserErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={isDark ? "text-slate-300" : ""}>
                Password *
              </Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  value={newUserData.password}
                  onChange={(e) =>
                    setNewUserData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Min 6 characters"
                  className={`${isDark ? "bg-slate-800 border-slate-700 pr-10" : "pr-10"} ${
                    createUserErrors.password ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-600"}`}
                >
                  {showCreatePassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {createUserErrors.password && (
                <p className="text-red-500 text-xs">
                  {createUserErrors.password}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={isDark ? "text-slate-300" : ""}>Role</Label>
              <Select
                value={newUserData.role}
                onValueChange={(v) =>
                  setNewUserData((prev) => ({
                    ...prev,
                    role: v as UserRole,
                    is_admin: v === "admin" || v === "superadmin",
                  }))
                }
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
