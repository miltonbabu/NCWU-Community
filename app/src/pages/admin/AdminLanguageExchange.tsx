import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  MessageCircle,
  Users,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Search,
  Unlink,
  MessageSquareOff,
  Home,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Group {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  chat_id: string | null;
  requester_name: string;
  requester_avatar: string | null;
  requester_department: string | null;
  receiver_name: string;
  receiver_avatar: string | null;
  receiver_department: string | null;
  message_count: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_full_name: string;
  sender_avatar_url: string | null;
}

interface Stats {
  totalProfiles: number;
  totalConnections: number;
  pendingRequests: number;
  totalChats: number;
  totalMessages: number;
}

export default function AdminLanguageExchange() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<
    string | null
  >(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<
    string | null
  >(null);
  const [showDisconnectAllConfirm, setShowDisconnectAllConfirm] =
    useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const [groupsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/language-exchange/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/language-exchange/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const groupsData = await groupsRes.json();
      const statsData = await statsRes.json();

      if (groupsData.success) {
        setGroups(groupsData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch language exchange data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (groupId: string) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/language-exchange/groups/${groupId}/chats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleViewMessages = (group: Group) => {
    if (selectedGroup?.id === group.id) {
      setSelectedGroup(null);
      setMessages([]);
    } else {
      setSelectedGroup(group);
      fetchMessages(group.id);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/language-exchange/groups/${groupId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Group deleted successfully");
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
          setMessages([]);
        }
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete group");
      }
    } catch (error) {
      toast.error("Failed to delete group");
    } finally {
      setShowDeleteGroupConfirm(null);
    }
  };

  const handleDeleteAllChats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/language-exchange/chats`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("All chat history cleared successfully");
        setMessages([]);
        fetchData();
      } else {
        toast.error(data.message || "Failed to clear all chat history");
      }
    } catch (error) {
      toast.error("Failed to clear all chat history");
    } finally {
      setShowDeleteAllConfirm(false);
    }
  };

  const handleDisconnectGroup = async (groupId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/language-exchange/connections/${groupId}/disconnect`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Connection disconnected successfully");
        fetchData();
      } else {
        toast.error(data.message || "Failed to disconnect");
      }
    } catch (error) {
      toast.error("Failed to disconnect connection");
    } finally {
      setShowDisconnectConfirm(null);
    }
  };

  const handleDisconnectAll = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/language-exchange/connections/disconnect-all`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("All connections disconnected successfully");
        fetchData();
      } else {
        toast.error(data.message || "Failed to disconnect all");
      }
    } catch (error) {
      toast.error("Failed to disconnect all connections");
    } finally {
      setShowDisconnectAllConfirm(false);
    }
  };

  const handleClearChatHistory = async (groupId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/language-exchange/chats/${groupId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Chat history cleared successfully");
        setMessages([]);
        fetchData();
      } else {
        toast.error(data.message || "Failed to clear chat history");
      }
    } catch (error) {
      toast.error("Failed to clear chat history");
    } finally {
      setShowClearChatConfirm(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredGroups = groups.filter((group) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        group.requester_name.toLowerCase().includes(query) ||
        group.receiver_name.toLowerCase().includes(query) ||
        group.requester_department?.toLowerCase().includes(query) ||
        group.receiver_department?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}>
            Language Exchange Management
          </h1>
          <p className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            View and manage language exchange connections and chats
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/language-exchange"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-500 hover:bg-indigo-600"} text-white`}
          >
            <Globe className="w-4 h-4" />
            Language Exchange
          </Link>
          <button
            onClick={fetchData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowDisconnectAllConfirm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-amber-600 hover:bg-amber-700" : "bg-amber-500 hover:bg-amber-600"} text-white`}
          >
            <Unlink className="w-4 h-4" />
            Disconnect All
          </button>
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
          >
            <MessageSquareOff className="w-4 h-4" />
            Clear All History
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Active Profiles
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}
                >
                  {stats.totalProfiles}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Connections
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}
                >
                  {stats.totalConnections}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Pending Requests
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}
                >
                  {stats.pendingRequests}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <MessageCircle className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Active Chats
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}
                >
                  {stats.totalChats}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Total Messages
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}
                >
                  {stats.totalMessages}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
            } outline-none`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div
          className={`p-8 rounded-xl border text-center ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
        >
          <Users
            className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
          />
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            {groups.length === 0
              ? "No language exchange connections yet"
              : "No groups found matching your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {group.requester_avatar ? (
                          <img
                            src={group.requester_avatar}
                            alt={group.requester_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          group.requester_name?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${isDark ? "text-white" : ""}`}
                        >
                          {group.requester_name}
                        </p>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {group.requester_department}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-2xl ${isDark ? "text-slate-600" : "text-slate-300"}`}
                    >
                      ↔
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                        {group.receiver_avatar ? (
                          <img
                            src={group.receiver_avatar}
                            alt={group.receiver_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          group.receiver_name?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${isDark ? "text-white" : ""}`}
                        >
                          {group.receiver_name}
                        </p>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {group.receiver_department}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {group.message_count} messages
                      </p>
                      <p
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Connected {formatDate(group.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewMessages(group)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isDark ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400" : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"}`}
                      >
                        <Eye className="w-4 h-4" />
                        View Chat
                        {selectedGroup?.id === group.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowClearChatConfirm(group.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isDark ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`}
                        title="Clear chat history"
                      >
                        <MessageSquareOff className="w-4 h-4" />
                        Clear
                      </button>
                      <button
                        onClick={() => setShowDisconnectConfirm(group.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isDark ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400" : "bg-amber-100 hover:bg-amber-200 text-amber-600"}`}
                        title="Disconnect users"
                      >
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </button>
                      <button
                        onClick={() => setShowDeleteGroupConfirm(group.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isDark ? "bg-red-500/20 hover:bg-red-500/30 text-red-400" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                        title="Delete connection completely"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {selectedGroup?.id === group.id && (
                <div
                  className={`border-t p-4 ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
                >
                  <h4
                    className={`font-medium mb-3 ${isDark ? "text-white" : ""}`}
                  >
                    Chat History
                  </h4>
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p
                      className={`text-center py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      No messages in this chat
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-white"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-medium ${isDark ? "text-white" : ""}`}
                            >
                              {message.sender_full_name}
                            </span>
                            <span
                              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <p
                            className={
                              isDark ? "text-slate-300" : "text-slate-600"
                            }
                          >
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                Clear All Chat History
              </h3>
            </div>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Are you sure you want to clear ALL chat history? This will remove
              all messages but keep connections intact. Users can still chat and
              new messages will be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className={`flex-1 py-2 rounded-xl font-medium ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllChats}
                className="flex-1 py-2 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteGroupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                Delete Connection
              </h3>
            </div>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Are you sure you want to delete this connection? All messages will
              be permanently removed and users will need to send new connection
              requests.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteGroupConfirm(null)}
                className={`flex-1 py-2 rounded-xl font-medium ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGroup(showDeleteGroupConfirm)}
                className="flex-1 py-2 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-500/20">
                <Unlink className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                Disconnect Users
              </h3>
            </div>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Are you sure you want to disconnect these users? They will no
              longer be able to chat but can send new connection requests if
              they want to reconnect.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(null)}
                className={`flex-1 py-2 rounded-xl font-medium ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnectGroup(showDisconnectConfirm!)}
                className="flex-1 py-2 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisconnectAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-500/20">
                <Unlink className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                Disconnect All Users
              </h3>
            </div>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Are you sure you want to disconnect ALL users? All active
              connections will be disconnected but users can send new connection
              requests.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectAllConfirm(false)}
                className={`flex-1 py-2 rounded-xl font-medium ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectAll}
                className="flex-1 py-2 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white"
              >
                Disconnect All
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-slate-500/20">
                <MessageSquareOff className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                Clear Chat History
              </h3>
            </div>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Are you sure you want to clear this chat history? All messages
              will be removed but the connection will remain and users can
              continue chatting.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearChatConfirm(null)}
                className={`flex-1 py-2 rounded-xl font-medium ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearChatHistory(showClearChatConfirm!)}
                className="flex-1 py-2 rounded-xl font-medium bg-slate-500 hover:bg-slate-600 text-white"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
