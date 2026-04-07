import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { marketChatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  buyer_name: string;
  buyer_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  created_at: string;
}

interface PostChatIndicatorProps {
  postId: string;
  isOwner: boolean;
}

export function PostChatIndicator({ postId, isOwner }: PostChatIndicatorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketChatApi.getPostSessions(postId);
      if (response.success && response.data) {
        setSessions(response.data);
        const unread = response.data.reduce(
          (sum, s) => sum + (s.unread_count || 0),
          0,
        );
        setTotalUnread(unread);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    if (isOwner) {
      fetchSessions();
    }
  }, [postId, isOwner, fetchSessions]);

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const response = await marketChatApi.deleteSession(sessionId);
      if (response.success) {
        toast.success("Conversation deleted");
        fetchSessions();
      } else {
        toast.error(response.error || "Failed to delete conversation");
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleOpenChat = (sessionId: string) => {
    setShowDialog(false);
    navigate(`/market/chat/${sessionId}`);
  };

  if (!isOwner || sessions.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={`gap-1 ${
          isDark
            ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            : "border-blue-500 text-blue-600 hover:bg-blue-50"
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        <span>{sessions.length}</span>
        {totalUnread > 0 && (
          <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0">
            {totalUnread}
          </Badge>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className={`max-w-md ${isDark ? "bg-slate-900 border-slate-800" : ""}`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              Messages ({sessions.length})
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : sessions.length === 0 ? (
            <p
              className={`text-center py-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              No messages yet
            </p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleOpenChat(session.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={session.buyer_avatar || undefined} />
                        <AvatarFallback
                          className={isDark ? "bg-slate-700" : "bg-slate-200"}
                        >
                          {session.buyer_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${isDark ? "text-white" : ""}`}
                          >
                            {session.buyer_name}
                          </span>
                          {session.unread_count > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {session.unread_count}
                            </Badge>
                          )}
                        </div>
                        {session.last_message && (
                          <p
                            className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {session.last_message}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {session.last_message_time
                              ? formatDistanceToNow(
                                  new Date(session.last_message_time),
                                  { addSuffix: true },
                                )
                              : formatDistanceToNow(
                                  new Date(session.created_at),
                                  { addSuffix: true },
                                )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
