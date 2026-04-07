import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { marketChatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageSquare, Bell, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  post_title: string;
  post_price: number;
  post_images: string[];
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
  created_at: string;
}

interface MessageNotification {
  sessionId: string;
  postId: string;
  senderId: string;
  senderName: string;
  preview: string;
}

export function MarketMessageNotification() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const [sessionsRes, countRes] = await Promise.all([
        marketChatApi.getSessions(),
        marketChatApi.getUnreadCount(),
      ]);

      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data.filter((s) => s.unread_count > 0));
      }

      if (countRes.success && countRes.data) {
        setUnreadCount(countRes.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch message notifications:", error);
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Listen for new message notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: MessageNotification) => {
      // Refresh data when new message arrives
      fetchData();

      // Show toast notification
      toast.info(`New message from ${data.senderName}`, {
        description: data.preview,
        action: {
          label: "View",
          onClick: () => navigate(`/market/chat/${data.sessionId}`),
        },
      });
    };

    socket.on("market_chat_notification", handleNotification);

    return () => {
      socket.off("market_chat_notification", handleNotification);
    };
  }, [socket, isConnected, navigate]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleSessionClick = (sessionId: string) => {
    setIsOpen(false);
    navigate(`/market/chat/${sessionId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/market/chat");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`relative ${
            isDark
              ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              : "border-blue-500 text-blue-600 hover:bg-blue-50"
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center p-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={`w-80 p-0 ${isDark ? "bg-slate-900 border-slate-800" : ""}`}
        align="end"
      >
        <div
          className={`p-3 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold ${isDark ? "text-white" : ""}`}>
              Message Notifications
            </h4>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare
              className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`}
            />
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>
              No new messages
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className={`w-full p-3 text-left transition-colors hover:${
                      isDark ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage
                          src={session.other_user_avatar || undefined}
                        />
                        <AvatarFallback
                          className={isDark ? "bg-slate-700" : "bg-slate-200"}
                        >
                          {session.other_user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium text-sm ${isDark ? "text-white" : ""}`}
                          >
                            {session.other_user_name}
                          </span>
                          {session.unread_count > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {session.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {session.post_title}
                        </p>
                        {session.last_message && (
                          <p
                            className={`text-sm truncate mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                          >
                            {session.last_message}
                          </p>
                        )}
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
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div
              className={`p-3 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
            >
              <Button
                onClick={handleViewAll}
                variant="ghost"
                className="w-full"
              >
                View All Messages
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
