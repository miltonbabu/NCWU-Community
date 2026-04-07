import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { xingyuanAdminApi } from "@/lib/api";
import { toast } from "sonner";
import {
  MessageSquare,
  Users,
  Image,
  Trash2,
  Search,
  Globe,
  Zap,
  Clock,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  BarChart3,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface XingyuanStats {
  totalChats: number;
  activeChats: number;
  deletedChats: number;
  totalMessages: number;
  totalTokens: number;
  userChats: number;
  guestChats: number;
  uniqueUsers: number;
  uniqueGuests: number;
  imagesWithContent: number;
  todayMessages: number;
  todayTokens: number;
}

interface XingyuanChat {
  id: string;
  user_id: string | null;
  session_id: string;
  title: string | null;
  model: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  ip_address: string | null;
  full_name: string | null;
  email: string | null;
  student_id: string | null;
  message_count: number;
}

interface XingyuanMessage {
  id: string;
  chat_id: string;
  user_id: string | null;
  role: string;
  content: string | null;
  images: string;
  thinking: string | null;
  is_deleted: number;
  token_count: number;
  created_at: string;
}

interface XingyuanUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  student_id: string | null;
  total_chats: number;
  active_chats: number;
  total_messages: number;
  total_tokens: number;
  image_uploads: number;
  last_active: string | null;
}

interface XingyuanGuest {
  ip_address: string;
  user_agent: string | null;
  session_count: number;
  total_messages: number;
  total_tokens: number;
  first_seen: string;
  last_seen: string;
}

interface UserChat {
  id: string;
  session_id: string;
  title: string | null;
  model: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  message_count: number;
}

type SubTab = "overview" | "chats" | "users" | "guests";

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function XingyuanAdminPanel({ isDark }: { isDark: boolean }) {
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const [stats, setStats] = useState<XingyuanStats | null>(null);
  const [chats, setChats] = useState<XingyuanChat[]>([]);
  const [users, setUsers] = useState<XingyuanUser[]>([]);
  const [guests, setGuests] = useState<XingyuanGuest[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<XingyuanMessage[]>([]);
  const [chatFilter, setChatFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "chat" | "message" | "guest" | "user";
    id: string;
    label: string;
  } | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [selectedUserChatId, setSelectedUserChatId] = useState<string | null>(
    null,
  );
  const [userChatMessages, setUserChatMessages] = useState<XingyuanMessage[]>(
    [],
  );
  const [loadingUserChats, setLoadingUserChats] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState("");

  const loadStats = useCallback(async () => {
    try {
      setDebugInfo("Fetching stats...");
      const res = await xingyuanAdminApi.getStats();
      console.log("[Xingyuan Admin] stats response:", res);
      setDebugInfo(
        `Stats response: success=${res.success}, hasData=${!!res.data}, keys=${res.data ? Object.keys(res.data).join(",") : "null"}`,
      );
      if (res.success && res.data) setStats(res.data as any);
    } catch (err) {
      console.error("[Xingyuan Admin] loadStats error:", err);
      setDebugInfo(
        `Stats ERROR: ${err instanceof Error ? err.message : String(err)}`,
      );
      toast.error("Failed to load statistics");
    }
  }, []);

  const loadChats = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await xingyuanAdminApi.getChats({
          page,
          limit: 20,
          filter: chatFilter,
          search: searchQuery || undefined,
        });
        console.log("[Xingyuan Admin] chats response:", res);
        if (res.success && res.data) {
          setChats(res.data.chats);
          setChatTotalPages(res.data.pagination.totalPages);
          setChatPage(page);
        }
      } catch (err) {
        console.error("[Xingyuan Admin] loadChats error:", err);
        toast.error("Failed to load chats");
      } finally {
        setLoading(false);
      }
    },
    [chatFilter, searchQuery],
  );

  const loadUsers = useCallback(async () => {
    try {
      const res = await xingyuanAdminApi.getUsers();
      console.log("[Xingyuan Admin] users response:", res);
      if (res.success && res.data) setUsers(res.data);
    } catch (err) {
      console.error("[Xingyuan Admin] loadUsers error:", err);
      toast.error("Failed to load users");
    }
  }, []);

  const loadGuests = useCallback(async () => {
    try {
      const res = await xingyuanAdminApi.getGuests();
      console.log("[Xingyuan Admin] guests response:", res);
      if (res.success && res.data) setGuests(res.data);
    } catch (err) {
      console.error("[Xingyuan Admin] loadGuests error:", err);
      toast.error("Failed to load guest data");
    }
  }, []);

  const loadChatMessages = async (chatId: string) => {
    try {
      const res = await xingyuanAdminApi.getChatMessages(chatId);
      console.log("[Xingyuan Admin] messages response:", res);
      if (res.success && res.data) {
        setChatMessages(res.data);
        setSelectedChatId(chatId);
      }
    } catch (err) {
      console.error("[Xingyuan Admin] loadChatMessages error:", err);
      toast.error("Failed to load chat messages");
    }
  };

  const loadUserChats = async (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setUserChats([]);
      setSelectedUserChatId(null);
      setUserChatMessages([]);
      return;
    }
    setLoadingUserChats(true);
    setSelectedUserId(userId);
    setSelectedUserChatId(null);
    setUserChatMessages([]);
    try {
      const res = await xingyuanAdminApi.getUserChats(userId);
      if (res.success && res.data) {
        setUserChats(res.data);
      }
    } catch (err) {
      console.error("[Xingyuan Admin] loadUserChats error:", err);
      toast.error("Failed to load user chats");
    } finally {
      setLoadingUserChats(false);
    }
  };

  const loadUserChatMessages = async (chatId: string) => {
    if (selectedUserChatId === chatId) {
      setSelectedUserChatId(null);
      setUserChatMessages([]);
      return;
    }
    try {
      const res = await xingyuanAdminApi.getChatMessages(chatId);
      if (res.success && res.data) {
        setUserChatMessages(res.data);
        setSelectedUserChatId(chatId);
      }
    } catch (err) {
      console.error("[Xingyuan Admin] loadUserChatMessages error:", err);
      toast.error("Failed to load chat messages");
    }
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (subTab === "chats") loadChats(1);
    if (subTab === "users") loadUsers();
    if (subTab === "guests") loadGuests();
  }, [subTab, loadChats, loadUsers, loadGuests]);

  const handleHardDelete = async () => {
    if (!deleteConfirm || deleteInput !== "DELETE") return;
    try {
      if (deleteConfirm.type === "chat") {
        await xingyuanAdminApi.hardDeleteChat(deleteConfirm.id);
        toast.success("Chat hard deleted");
        loadChats(chatPage);
        loadStats();
        if (selectedChatId === deleteConfirm.id) {
          setSelectedChatId(null);
          setChatMessages([]);
        }
      } else if (deleteConfirm.type === "message") {
        await xingyuanAdminApi.hardDeleteMessage(deleteConfirm.id);
        toast.success("Message hard deleted");
        if (selectedChatId) loadChatMessages(selectedChatId);
        loadStats();
      } else if (deleteConfirm.type === "guest") {
        await xingyuanAdminApi.hardDeleteGuestData(deleteConfirm.id);
        toast.success(`All data for guest IP ${deleteConfirm.id} deleted`);
        loadGuests();
        loadStats();
      } else if (deleteConfirm.type === "user") {
        await xingyuanAdminApi.hardDeleteUserData(deleteConfirm.id);
        toast.success(`All data for user deleted`);
        loadUsers();
        loadStats();
        setSelectedUserId(null);
        setUserChats([]);
        setSelectedUserChatId(null);
        setUserChatMessages([]);
      }
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteConfirm(null);
    setDeleteInput("");
  };

  const handleDeleteAll = async () => {
    if (deleteAllInput !== "DELETE ALL") return;
    try {
      console.log("[Xingyuan Admin] Deleting ALL data...");
      const res = await xingyuanAdminApi.hardDeleteAllData();
      console.log("[Xingyuan Admin] Delete all response:", res);
      if (res.success) {
        toast.success(res.message || "All Xingyuan AI data deleted");
        setChats([]);
        setGuests([]);
        setStats(null);
        setSelectedChatId(null);
        setChatMessages([]);
        setSelectedUserId(null);
        setUserChats([]);
        setSelectedUserChatId(null);
        setUserChatMessages([]);
        loadStats();
        loadUsers();
      } else {
        toast.error(
          res.error || res.message || "Delete failed - server returned error",
        );
      }
    } catch (err) {
      console.error("[Xingyuan Admin] handleDeleteAll error:", err);
      toast.error(
        `Failed to delete all data: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    setShowDeleteAllConfirm(false);
    setDeleteAllInput("");
  };

  const subTabs: {
    id: SubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "chats", label: "All Chats", icon: MessageSquare },
    { id: "users", label: "Users", icon: Users },
    { id: "guests", label: "Guests / Non-Users", icon: Globe },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Xingyuan AI Admin
          </h1>
          <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Manage AI chat sessions, messages, usage tracking &amp; guest data
          </p>
        </div>
        <button
          onClick={() => {
            loadStats();
            if (subTab === "chats") loadChats(chatPage);
            if (subTab === "users") loadUsers();
            if (subTab === "guests") loadGuests();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white shadow-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <Link
          to="/xingyuan-ai"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Open Xingyuan AI
        </Link>
        <button
          onClick={() => setShowDeleteAllConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete All Data
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id);
              setSelectedChatId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              subTab === tab.id
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg"
                : isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "overview" && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Chats"
            value={stats.totalChats}
            icon={MessageSquare}
            gradient="from-violet-500 to-purple-600"
          />
          <StatCard
            title="Total Messages"
            value={stats.totalMessages}
            icon={MessageSquare}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            title="Total Tokens"
            value={stats.totalTokens.toLocaleString()}
            icon={Zap}
            gradient="from-amber-500 to-orange-600"
            subtitle="~estimated"
          />
          <StatCard
            title="Active Users"
            value={stats.uniqueUsers}
            icon={UserCheck}
            gradient="from-emerald-500 to-teal-600"
          />

          <StatCard
            title="Guest Chats"
            value={stats.guestChats}
            icon={Globe}
            gradient="from-pink-500 to-rose-600"
          />
          <StatCard
            title="Images Uploaded"
            value={stats.imagesWithContent}
            icon={Image}
            gradient="from-indigo-500 to-blue-600"
          />
          <StatCard
            title="Deleted Items"
            value={stats.deletedChats}
            icon={Trash2}
            gradient="from-red-500 to-red-600"
          />
          <StatCard
            title="Today's Messages"
            value={stats.todayMessages}
            icon={Clock}
            gradient="from-cyan-500 to-blue-500"
            subtitle={`${stats.todayTokens} tokens`}
          />
        </div>
      )}

      {subTab === "overview" && !stats && (
        <div className="text-center py-12 space-y-3">
          <div className="text-slate-500">Loading stats...</div>
          {debugInfo && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mx-auto max-w-xl break-all">
              DEBUG: {debugInfo}
            </div>
          )}
        </div>
      )}

      {subTab === "overview" && stats && debugInfo && (
        <div className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
          ✅ {debugInfo}
        </div>
      )}

      {subTab === "chats" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, IP, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadChats(1)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-300"
                } focus:outline-none focus:ring-2 focus:ring-violet-500`}
              />
            </div>
            <select
              value={chatFilter}
              onChange={(e) => {
                setChatFilter(e.target.value);
                setChatPage(1);
              }}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
              <option value="users">Users Only</option>
              <option value="guests">Guests Only</option>
            </select>
            <button
              onClick={() => loadChats(1)}
              className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
            >
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table
              className={`w-full text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              <thead>
                <tr
                  className={`border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                >
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Title</th>
                  <th className="text-left py-3 px-4 font-medium">Messages</th>
                  <th className="text-left py-3 px-4 font-medium">Model</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr
                    key={chat.id}
                    className={`border-b cursor-pointer transition-colors hover:bg-violet-50 dark:hover:bg-slate-800 ${
                      isDark ? "border-slate-800" : "border-slate-100"
                    } ${selectedChatId === chat.id ? "bg-violet-50 dark:bg-slate-800" : ""}`}
                    onClick={() => loadChatMessages(chat.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {chat.full_name || chat.email || chat.student_id || (
                          <span className="text-amber-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Guest
                          </span>
                        )}
                      </div>
                      {!chat.user_id && chat.ip_address && (
                        <span className="text-xs text-slate-400">
                          {chat.ip_address}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      {chat.title || "Untitled Chat"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono">
                        {chat.message_count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-2 py-1 rounded text-xs">
                        {chat.model}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {chat.is_deleted ? (
                        <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs">
                          Deleted
                        </span>
                      ) : (
                        <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(chat.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            type: "chat",
                            id: chat.id,
                            label: chat.title || chat.id,
                          });
                        }}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                        title="Hard Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {chats.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No chats found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {chatTotalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                disabled={chatPage <= 1}
                onClick={() => loadChats(chatPage - 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm">
                Page {chatPage} of {chatTotalPages}
              </span>
              <button
                disabled={chatPage >= chatTotalPages}
                onClick={() => loadChats(chatPage + 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {selectedChatId && chatMessages.length > 0 && (
            <div
              className={`mt-6 border rounded-xl p-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Chat Messages ({chatMessages.length})
                </h3>
                <button
                  onClick={() => {
                    setSelectedChatId(null);
                    setChatMessages([]);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 ${
                      msg.role === "user"
                        ? isDark
                          ? "bg-blue-900/30 ml-8"
                          : "bg-blue-50 ml-8"
                        : isDark
                          ? "bg-violet-900/30 mr-8"
                          : "bg-violet-50 mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${msg.role === "user" ? "text-blue-500" : "text-violet-500"}`}
                      >
                        {msg.role === "user" ? "User" : "Xingyuan AI"}
                      </span>
                      <div className="flex items-center gap-2">
                        {msg.token_count > 0 && (
                          <span className="text-xs text-slate-400">
                            ~{msg.token_count} tok
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {formatDate(msg.created_at)}
                        </span>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "message",
                              id: msg.id,
                              label: msg.content?.slice(0, 30) || "message",
                            })
                          }
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hard Delete Message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-sm whitespace-pre-wrap ${isDark ? "text-slate-200" : "text-slate-700"}`}
                    >
                      {(msg.content || "(no text content)").slice(0, 500)}
                      {(msg.content?.length || 0) > 500 && "..."}
                    </p>
                    {msg.thinking && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer">
                          Thinking process...
                        </summary>
                        <pre className="text-xs mt-1 whitespace-pre-wrap text-slate-500 max-h-40 overflow-y-auto">
                          {msg.thinking.slice(0, 1000)}
                        </pre>
                      </details>
                    )}
                    {(() => {
                      if (!msg.images || msg.images === "[]") return null;
                      try {
                        const imgs = JSON.parse(msg.images);
                        if (!imgs.length) return null;
                        return (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {imgs.map((img: string, i: number) => (
                              <a
                                key={i}
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={img}
                                  alt={`Attachment ${i + 1}`}
                                  className="h-16 w-16 object-cover rounded border border-slate-300 dark:border-slate-600"
                                />
                              </a>
                            ))}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "users" && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table
              className={`w-full text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              <thead>
                <tr
                  className={`border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                >
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-right py-3 px-4 font-medium">Chats</th>
                  <th className="text-right py-3 px-4 font-medium">Messages</th>
                  <th className="text-right py-3 px-4 font-medium">Tokens</th>
                  <th className="text-right py-3 px-4 font-medium">Images</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Last Active
                  </th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isExpanded = selectedUserId === u.user_id;
                  return (
                    <>
                      <tr
                        key={u.user_id}
                        className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"} hover:bg-slate-50 dark:hover:bg-slate-800 ${isExpanded ? (isDark ? "bg-violet-900/20" : "bg-violet-50") : ""}`}
                      >
                        <td className="py-3 px-4 font-medium">
                          {u.full_name || u.student_id || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {u.email || "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {u.total_chats}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {u.total_messages}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {u.total_tokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {u.image_uploads}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {u.last_active ? formatDate(u.last_active) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => loadUserChats(u.user_id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isExpanded
                                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              {isExpanded ? "Hide" : "View Chats"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({
                                  type: "user",
                                  id: u.user_id,
                                  label: `${u.full_name || u.student_id || u.user_id} (${u.email || "no email"}) - ${u.total_chats} chats, ${u.total_messages} messages`,
                                });
                              }}
                              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                              title="Delete All User Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${u.user_id}-expanded`}>
                          <td
                            colSpan={8}
                            className={`p-0 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
                          >
                            <div
                              className={`p-4 ${isDark ? "bg-violet-900/10" : "bg-violet-50/50"}`}
                            >
                              {loadingUserChats ? (
                                <div className="text-center py-6 text-slate-400">
                                  Loading chats...
                                </div>
                              ) : userChats.length === 0 ? (
                                <div className="text-center py-6 text-slate-400">
                                  No chats found for this user
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-violet-500" />
                                    Chat Sessions ({userChats.length})
                                  </h4>
                                  {userChats.map((chat) => (
                                    <div
                                      key={chat.id}
                                      className={`rounded-lg border overflow-hidden ${selectedUserChatId === chat.id ? "border-violet-400" : ""} ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                                    >
                                      <button
                                        onClick={() =>
                                          loadUserChatMessages(chat.id)
                                        }
                                        className="w-full flex items-center justify-between p-3 text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          {selectedUserChatId === chat.id ? (
                                            <ChevronUp className="w-4 h-4 text-violet-500 shrink-0" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                          )}
                                          <span className="font-medium truncate">
                                            {chat.title || "Untitled Chat"}
                                          </span>
                                          {chat.is_deleted ? (
                                            <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded text-xs shrink-0">
                                              Deleted
                                            </span>
                                          ) : (
                                            <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs shrink-0">
                                              Active
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 ml-4">
                                          <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono">
                                            {chat.message_count} msgs
                                          </span>
                                          <span className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 px-2 py-1 rounded">
                                            {chat.model}
                                          </span>
                                          <span className="text-xs text-slate-400">
                                            {formatDate(chat.created_at)}
                                          </span>
                                        </div>
                                      </button>

                                      {selectedUserChatId === chat.id &&
                                        userChatMessages.length > 0 && (
                                          <div
                                            className={`border-t ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"} p-4`}
                                          >
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="text-sm font-semibold">
                                                Messages (
                                                {userChatMessages.length})
                                              </h5>
                                              <button
                                                onClick={() => {
                                                  setSelectedUserChatId(null);
                                                  setUserChatMessages([]);
                                                }}
                                                className="text-xs text-slate-400 hover:text-slate-600"
                                              >
                                                Close
                                              </button>
                                            </div>
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                              {userChatMessages.map((msg) => (
                                                <div
                                                  key={msg.id}
                                                  className={`rounded-lg p-3 ${
                                                    msg.role === "user"
                                                      ? isDark
                                                        ? "bg-blue-900/30 ml-8"
                                                        : "bg-blue-50 ml-8"
                                                      : isDark
                                                        ? "bg-violet-900/30 mr-8"
                                                        : "bg-violet-50 mr-8"
                                                  }`}
                                                >
                                                  <div className="flex items-center justify-between mb-1">
                                                    <span
                                                      className={`text-xs font-medium ${msg.role === "user" ? "text-blue-500" : "text-violet-500"}`}
                                                    >
                                                      {msg.role === "user"
                                                        ? "User"
                                                        : "Xingyuan AI"}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                      {msg.token_count > 0 && (
                                                        <span className="text-xs text-slate-400">
                                                          ~{msg.token_count} tok
                                                        </span>
                                                      )}
                                                      <span className="text-xs text-slate-400">
                                                        {formatDate(
                                                          msg.created_at,
                                                        )}
                                                      </span>
                                                      <button
                                                        onClick={() =>
                                                          setDeleteConfirm({
                                                            type: "message",
                                                            id: msg.id,
                                                            label:
                                                              msg.content?.slice(
                                                                0,
                                                                30,
                                                              ) || "message",
                                                          })
                                                        }
                                                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Hard Delete Message"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <p
                                                    className={`text-sm whitespace-pre-wrap ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                                  >
                                                    {(
                                                      msg.content ||
                                                      "(no text content)"
                                                    ).slice(0, 500)}
                                                    {(msg.content?.length ||
                                                      0) > 500 && "..."}
                                                  </p>
                                                  {msg.thinking && (
                                                    <details className="mt-2">
                                                      <summary className="text-xs text-slate-400 cursor-pointer">
                                                        Thinking process...
                                                      </summary>
                                                      <pre className="text-xs mt-1 whitespace-pre-wrap text-slate-500 max-h-40 overflow-y-auto">
                                                        {msg.thinking.slice(
                                                          0,
                                                          1000,
                                                        )}
                                                      </pre>
                                                    </details>
                                                  )}
                                                  {(() => {
                                                    if (
                                                      !msg.images ||
                                                      msg.images === "[]"
                                                    )
                                                      return null;
                                                    try {
                                                      const imgs = JSON.parse(
                                                        msg.images,
                                                      );
                                                      if (!imgs.length)
                                                        return null;
                                                      return (
                                                        <div className="flex gap-2 mt-2 flex-wrap">
                                                          {imgs.map(
                                                            (
                                                              img: string,
                                                              i: number,
                                                            ) => (
                                                              <a
                                                                key={i}
                                                                href={img}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block"
                                                              >
                                                                <img
                                                                  src={img}
                                                                  alt={`Attachment ${i + 1}`}
                                                                  className="h-16 w-16 object-cover rounded border border-slate-300 dark:border-slate-600"
                                                                />
                                                              </a>
                                                            ),
                                                          )}
                                                        </div>
                                                      );
                                                    } catch {
                                                      return null;
                                                    }
                                                  })()}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "guests" && (
        <div className="overflow-x-auto">
          <table
            className={`w-full text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            <thead>
              <tr
                className={`border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
              >
                <th className="text-left py-3 px-4 font-medium">IP Address</th>
                <th className="text-left py-3 px-4 font-medium">Sessions</th>
                <th className="text-right py-3 px-4 font-medium">Messages</th>
                <th className="text-right py-3 px-4 font-medium">Tokens</th>
                <th className="text-left py-3 px-4 font-medium">First Seen</th>
                <th className="text-left py-3 px-4 font-medium">Last Seen</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr
                  key={g.ip_address}
                  className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                        {g.ip_address}
                      </code>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">{g.session_count}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {g.total_messages}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {g.total_tokens.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {formatDate(g.first_seen)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {formatDate(g.last_seen)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: "guest",
                          id: g.ip_address,
                          label: `Guest IP: ${g.ip_address}`,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" /> Hard Delete All
                    </button>
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No guests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`max-w-md w-full mx-4 rounded-2xl p-6 shadow-2xl ${isDark ? "bg-slate-900 border border-red-500/30" : "bg-white border border-red-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3
                  className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Hard Delete Confirmation
                </h3>
                <p className="text-sm text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div
              className={`mb-4 p-3 rounded-lg text-sm ${isDark ? "bg-slate-800" : "bg-red-50"}`}
            >
              <p className="font-medium">Target:</p>
              <p
                className={`mt-1 break-all ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {deleteConfirm.label}
              </p>
            </div>

            <label
              className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Type{" "}
              <code className="bg-red-100 dark:bg-red-900 text-red-600 px-1.5 py-0.5 rounded mx-1">
                DELETE
              </code>{" "}
              to confirm:
            </label>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE..."
              className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-300"
              } focus:outline-none focus:ring-2 focus:ring-red-500`}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteInput("");
                }}
                className={`px-4 py-2 rounded-lg font-medium ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleHardDelete}
                disabled={deleteInput !== "DELETE"}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className={`max-w-lg w-full mx-4 rounded-2xl p-6 shadow-2xl border-2 border-red-500 ${isDark ? "bg-slate-900" : "bg-white"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  ⚠️ NUCLEAR DELETE
                </h3>
                <p className="text-sm text-red-500 font-medium">
                  This will permanently delete all Xingyuan AI data
                </p>
              </div>
            </div>

            <div
              className={`mb-4 p-4 rounded-lg text-sm border-2 border-red-300 dark:border-red-800 ${isDark ? "bg-red-950/50" : "bg-red-50"}`}
            >
              <p className="font-bold text-red-700 dark:text-red-300 mb-2">
                This action CANNOT be undone. The following will be PERMANENTLY
                DELETED:
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-600 dark:text-red-400 ml-2">
                <li>All chat sessions (users + guests)</li>
                <li>All messages in every chat</li>
                <li>All usage statistics & history</li>
                <li>All images & attachments from chats</li>
              </ul>
              <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ User accounts will NOT be deleted — only their AI chat data
              </p>
            </div>

            <label
              className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Type{" "}
              <code className="bg-red-100 dark:bg-red-900 text-red-600 px-2 py-0.5 rounded mx-1 font-bold text-sm">
                DELETE ALL
              </code>{" "}
              to confirm:
            </label>
            <input
              type="text"
              value={deleteAllInput}
              onChange={(e) => setDeleteAllInput(e.target.value)}
              placeholder="Type DELETE ALL..."
              className={`w-full px-4 py-3 rounded-lg border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 mb-4 ${
                isDark
                  ? "bg-slate-800 border-red-900 text-white"
                  : "bg-white border-red-200"
              } focus:outline-none`}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteAllConfirm(false);
                  setDeleteAllInput("");
                }}
                className={`px-5 py-2.5 rounded-lg font-medium ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Cancel - Keep Everything
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllInput !== "DELETE ALL"}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                🗑️ Destroy All Data Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
