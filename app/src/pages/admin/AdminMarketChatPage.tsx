import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { adminMarketChatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  Archive,
  RotateCcw,
  Eye,
  Loader2,
  MessageCircle,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  post_title: string;
  post_price: number;
  buyer_name: string;
  buyer_avatar: string | null;
  seller_name: string;
  seller_avatar: string | null;
  message_count: number;
  deleted_by_name: string | null;
}

interface ChatStats {
  totalSessions: number;
  activeSessions: number;
  deletedSessions: number;
  totalMessages: number;
  unreadMessages: number;
  sessionsToday: number;
  messagesToday: number;
  inactiveSessions: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  is_read: number;
  read_at: string | null;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  performed_by: string;
  performer_name: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function AdminMarketChatPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [sessionAuditLog, setSessionAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "deleted">("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        adminMarketChatApi.getSessions(
          filterStatus === "all" ? undefined : { isDeleted: filterStatus === "deleted" }
        ),
        adminMarketChatApi.getStats(),
      ]);

      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      toast.error("Failed to fetch chat data");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchSessionDetails = async (sessionId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await adminMarketChatApi.getSessionDetails(sessionId);
      if (response.success && response.data) {
        setSessionMessages(response.data.messages);
        setSessionAuditLog(response.data.auditLog);
      }
    } catch (error) {
      toast.error("Failed to fetch session details");
    }
    setIsLoadingDetails(false);
  };

  const handleSoftDelete = async () => {
    if (!selectedSession) return;

    setIsDeleting(true);
    try {
      const response = await adminMarketChatApi.softDeleteSession(
        selectedSession.id,
        deleteReason
      );
      if (response.success) {
        toast.success("Chat session soft deleted");
        setShowDeleteDialog(false);
        setDeleteReason("");
        fetchData();
        setSelectedSession(null);
      } else {
        toast.error(response.error || "Failed to delete session");
      }
    } catch (error) {
      toast.error("Failed to delete session");
    }
    setIsDeleting(false);
  };

  const handleHardDelete = async () => {
    if (!selectedSession) return;

    setIsDeleting(true);
    try {
      const response = await adminMarketChatApi.hardDeleteSession(
        selectedSession.id,
        deleteReason
      );
      if (response.success) {
        toast.success("Chat session permanently deleted");
        setShowHardDeleteDialog(false);
        setDeleteReason("");
        fetchData();
        setSelectedSession(null);
      } else {
        toast.error(response.error || "Failed to delete session");
      }
    } catch (error) {
      toast.error("Failed to delete session");
    }
    setIsDeleting(false);
  };

  const handleRestore = async (session: ChatSession) => {
    try {
      const response = await adminMarketChatApi.restoreSession(session.id);
      if (response.success) {
        toast.success("Chat session restored");
        fetchData();
      } else {
        toast.error(response.error || "Failed to restore session");
      }
    } catch (error) {
      toast.error("Failed to restore session");
    }
  };

  const handleCleanupInactive = async () => {
    try {
      const response = await adminMarketChatApi.cleanupInactive(7);
      if (response.success && response.data) {
        toast.success(`Cleaned up ${response.data.cleanedCount} inactive sessions`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to cleanup inactive sessions");
    }
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.post_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.seller_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      soft_delete: "Soft Deleted",
      hard_delete: "Permanently Deleted",
      restore: "Restored",
      auto_cleanup: "Auto-Cleaned",
    };
    return labels[action] || action;
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Market Chat Management
              </h1>
              <p className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Monitor and manage buyer-seller conversations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCleanupInactive}
                className={isDark ? "border-slate-700" : ""}
              >
                <Archive className="w-4 h-4 mr-2" />
                Cleanup Inactive (7d)
              </Button>
              <Button
                variant="outline"
                onClick={fetchData}
                className={isDark ? "border-slate-700" : ""}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Total Sessions
                      </p>
                      <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {stats.totalSessions}
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Active Sessions
                      </p>
                      <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {stats.activeSessions}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Total Messages
                      </p>
                      <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {stats.totalMessages}
                      </p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Inactive (7d+)
                      </p>
                      <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {stats.inactiveSessions}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-2">
              <Card className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={isDark ? "text-white" : ""}>Chat Sessions</CardTitle>
                    <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                      <TabsList className={isDark ? "bg-slate-800" : ""}>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="deleted">Deleted</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by post title, buyer, or seller..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare
                        className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                      />
                      <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                        No chat sessions found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => {
                            setSelectedSession(session);
                            fetchSessionDetails(session.id);
                          }}
                          className={`p-4 rounded-xl cursor-pointer transition-colors ${
                            selectedSession?.id === session.id
                              ? isDark
                                ? "bg-slate-800"
                                : "bg-slate-100"
                              : isDark
                              ? "hover:bg-slate-800/50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex -space-x-2">
                                <Avatar className="w-8 h-8 border-2 border-white dark:border-slate-900">
                                  <AvatarImage src={session.buyer_avatar || undefined} />
                                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                                    B
                                  </AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8 border-2 border-white dark:border-slate-900">
                                  <AvatarImage src={session.seller_avatar || undefined} />
                                  <AvatarFallback className="text-xs bg-emerald-500 text-white">
                                    S
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div>
                                <p className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {session.post_title}
                                </p>
                                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  Buyer: {session.buyer_name} · Seller: {session.seller_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {session.message_count} messages
                                  </Badge>
                                  <Badge
                                    variant={session.is_deleted ? "destructive" : "default"}
                                    className="text-xs"
                                  >
                                    {session.is_deleted ? "Deleted" : "Active"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                {formatDistanceToNow(new Date(session.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                              <p className={`text-sm font-medium text-emerald-500`}>
                                ¥{session.post_price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Session Details */}
            <div>
              <Card className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                <CardHeader>
                  <CardTitle className={isDark ? "text-white" : ""}>Session Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedSession ? (
                    <div className="text-center py-8">
                      <Eye className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                      <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                        Select a session to view details
                      </p>
                    </div>
                  ) : isLoadingDetails ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Participants */}
                      <div>
                        <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          Participants
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedSession.buyer_avatar || undefined} />
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                B
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-white" : ""}`}>
                                {selectedSession.buyer_name}
                              </p>
                              <p className="text-xs text-slate-500">Buyer</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedSession.seller_avatar || undefined} />
                              <AvatarFallback className="bg-emerald-500 text-white text-xs">
                                S
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-white" : ""}`}>
                                {selectedSession.seller_name}
                              </p>
                              <p className="text-xs text-slate-500">Seller</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className={isDark ? "bg-slate-800" : ""} />

                      {/* Messages Preview */}
                      <div>
                        <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          Messages ({sessionMessages.length})
                        </h4>
                        <ScrollArea className="h-48 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                          {sessionMessages.length === 0 ? (
                            <p className={`text-sm text-center py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              No messages
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {sessionMessages.slice(-10).map((message) => (
                                <div
                                  key={message.id}
                                  className={`p-2 rounded-lg text-sm ${
                                    message.sender_id === selectedSession.buyer_id
                                      ? "bg-blue-50 dark:bg-blue-900/20"
                                      : "bg-emerald-50 dark:bg-emerald-900/20"
                                  }`}
                                >
                                  <p className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    {message.sender_name} · {format(new Date(message.created_at), "h:mm a")}
                                  </p>
                                  <p className={isDark ? "text-slate-200" : "text-slate-700"}>
                                    {message.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      <Separator className={isDark ? "bg-slate-800" : ""} />

                      {/* Audit Log */}
                      {sessionAuditLog.length > 0 && (
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            Audit Log
                          </h4>
                          <div className="space-y-2">
                            {sessionAuditLog.slice(0, 3).map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center gap-2 text-xs p-2 rounded bg-slate-50 dark:bg-slate-800"
                              >
                                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                                  {format(new Date(entry.created_at), "MMM d, h:mm a")}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {formatActionLabel(entry.action)}
                                </Badge>
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                                  by {entry.performer_name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {selectedSession.is_deleted ? (
                          <Button
                            onClick={() => handleRestore(selectedSession)}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Soft Delete
                          </Button>
                        )}
                        <Button
                          onClick={() => setShowHardDeleteDialog(true)}
                          variant="outline"
                          className={`flex-1 ${isDark ? "border-red-500 text-red-400 hover:bg-red-500/10" : "border-red-500 text-red-600"}`}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Hard Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className={isDark ? "bg-slate-900 border-slate-800" : ""}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>Soft Delete Session</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : ""}>
              This will mark the chat session as deleted but keep all data for recovery purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}>
                Reason (optional)
              </label>
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className={isDark ? "border-slate-700" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSoftDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Soft Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Dialog */}
      <Dialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
        <DialogContent className={isDark ? "bg-slate-900 border-slate-800" : ""}>
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete Session
            </DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : ""}>
              This action cannot be undone. All messages and session data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Warning:</strong> This will permanently delete {selectedSession?.message_count || 0} messages and all associated data.
              </p>
            </div>
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}>
                Reason (required)
              </label>
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for permanent deletion..."
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHardDeleteDialog(false)}
              className={isDark ? "border-slate-700" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={handleHardDelete}
              disabled={isDeleting || !deleteReason.trim()}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
