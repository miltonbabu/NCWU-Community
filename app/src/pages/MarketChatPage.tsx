import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { marketChatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import {
  Send,
  ArrowLeft,
  Loader2,
  MessageSquare,
  ShoppingBag,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

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

interface Participant {
  id: string;
  name: string;
  avatar: string | null;
}

export default function MarketChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("postId");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set());

  // Fetch user's chat sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await marketChatApi.getSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    }
  }, []);

  // Handle loading state when no session is selected
  useEffect(() => {
    if (isAuthenticated && !sessionId && !postId && sessions.length >= 0) {
      setIsLoading(false);
    }
  }, [isAuthenticated, sessions, sessionId, postId]);

  // Create new session if postId is provided
  const createSession = useCallback(
    async (pid: string) => {
      try {
        setIsLoading(true);
        const response = await marketChatApi.createSession(pid);
        if (response.success && response.data) {
          navigate(`/market/chat/${response.data.session.id}`);
        } else {
          toast.error(response.error || "Failed to create chat session");
          navigate("/market");
        }
      } catch (error) {
        toast.error("Failed to create chat session");
        navigate("/market");
      }
    },
    [navigate],
  );

  const loadMessages = useCallback(async (sid: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await marketChatApi.getMessages(sid);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      toast.error("Failed to load messages");
    }
    setIsLoadingMessages(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (postId && !sessionId) {
      createSession(postId);
    }
  }, [isAuthenticated, postId, sessionId, navigate, createSession]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions().then(() => {
        // If no sessionId and no postId, we're just viewing the list - stop loading
        if (!sessionId && !postId) {
          setIsLoading(false);
        }
      });
    }
  }, [isAuthenticated, fetchSessions, sessionId, postId]);

  // Load active session
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setActiveSession(session);
        loadMessages(sessionId);
      }
    }
  }, [sessionId, sessions, loadMessages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    // Join chat room
    socket.emit("market_chat_join", sessionId);

    // Listen for new messages (from other participants)
    const handleNewMessage = (message: ChatMessage) => {
      // Don't process if this is our own message
      if (message.sender_id === user?.id) return;

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Mark as read since it's from other participant
      socket.emit("market_chat_mark_read", sessionId);
    };

    // Listen for message sent confirmation (own messages)
    const handleMessageSent = (message: ChatMessage) => {
      // Remove from pending set
      pendingMessagesRef.current.delete(message.content);

      setMessages((prev) => {
        // Avoid duplicates by ID
        if (prev.find((m) => m.id === message.id)) return prev;

        // Find and replace optimistic message with same content
        const optimisticIndex = prev.findIndex(
          (m) =>
            m.id.startsWith("temp_") &&
            m.sender_id === message.sender_id &&
            m.content === message.content,
        );

        if (optimisticIndex !== -1) {
          const newMessages = [...prev];
          newMessages[optimisticIndex] = message;
          return newMessages;
        }

        // If no optimistic message found, add the confirmed message
        return [...prev, message];
      });
    };

    // Listen for typing indicators
    const handleTyping = (data: {
      sessionId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (data.sessionId === sessionId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data: {
      sessionId: string;
      userId: string;
    }) => {
      if (data.sessionId === sessionId && data.userId !== user?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === user?.id
              ? { ...m, is_read: 1, read_at: new Date().toISOString() }
              : m,
          ),
        );
      }
    };

    socket.on("market_chat_new_message", handleNewMessage);
    socket.on("market_chat_message_sent", handleMessageSent);
    socket.on("market_chat_typing", handleTyping);
    socket.on("market_chat_messages_read", handleMessagesRead);

    return () => {
      socket.emit("market_chat_leave", sessionId);
      socket.off("market_chat_new_message", handleNewMessage);
      socket.off("market_chat_message_sent", handleMessageSent);
      socket.off("market_chat_typing", handleTyping);
      socket.off("market_chat_messages_read", handleMessagesRead);
    };
  }, [socket, isConnected, sessionId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sessionId || !socket || isSending) return;

    const content = newMessage.trim();

    // Check if this message is already being sent
    if (pendingMessagesRef.current.has(content)) return;
    pendingMessagesRef.current.add(content);

    setIsSending(true);

    // Create optimistic message
    const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      session_id: sessionId,
      sender_id: user?.id || "",
      sender_name: user?.full_name || "You",
      sender_avatar: user?.avatar_url || null,
      content: content,
      is_read: 0,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    // Send via socket for real-time
    socket.emit("market_chat_message", { sessionId, content });

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleDeleteSession = async (
    sessionToDelete: ChatSession,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (
      !confirm(
        `Delete conversation with ${sessionToDelete.other_user_name} about "${sessionToDelete.post_title}"?`,
      )
    )
      return;

    try {
      const response = await marketChatApi.deleteSession(sessionToDelete.id);
      if (response.success) {
        toast.success("Conversation deleted");
        setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
        if (activeSession?.id === sessionToDelete.id) {
          setActiveSession(null);
          setMessages([]);
          navigate("/market/chat");
        }
      } else {
        toast.error(response.error || "Failed to delete conversation");
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleTypingStart = () => {
    if (!socket || !sessionId) return;
    socket.emit("market_chat_typing_start", sessionId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("market_chat_typing_stop", sessionId);
    }, 3000);
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "h:mm a");
    } else if (isYesterday(messageDate)) {
      return "Yesterday " + format(messageDate, "h:mm a");
    } else {
      return format(messageDate, "MMM d, h:mm a");
    }
  };

  const getOtherParticipant = () => {
    if (!activeSession || !user) return null;
    return activeSession.other_user_id === user.id
      ? {
          id: activeSession.buyer_id,
          name: activeSession.other_user_name,
          avatar: activeSession.other_user_avatar,
        }
      : {
          id: activeSession.other_user_id,
          name: activeSession.other_user_name,
          avatar: activeSession.other_user_avatar,
        };
  };

  const otherParticipant = getOtherParticipant();
  const isTyping = otherParticipant && typingUsers.has(otherParticipant.id);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Navigation />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Navigation />

      <main className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/market")}
              className={
                isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Messages
            </h1>
          </div>

          <div
            className={`rounded-2xl border ${
              isDark
                ? "bg-slate-900/80 border-slate-800"
                : "bg-white border-slate-200 shadow-lg"
            }`}
            style={{ height: "calc(100vh - 220px)" }}
          >
            <div className="flex h-full overflow-hidden">
              {/* Sessions List */}
              <div
                className={`w-full md:w-80 border-r flex flex-col ${
                  isDark ? "border-slate-800" : "border-slate-200"
                } ${activeSession ? "hidden md:flex" : ""}`}
              >
                <div
                  className={`p-4 border-b flex-shrink-0 ${isDark ? "border-slate-800" : "border-slate-200"}`}
                >
                  <h2
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Conversations
                  </h2>
                </div>
                <ScrollArea className="flex-1">
                  {sessions.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare
                        className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                      />
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        No conversations yet
                      </p>
                      <Button
                        onClick={() => navigate("/market")}
                        className="mt-4 bg-emerald-500 hover:bg-emerald-600"
                      >
                        Browse Market
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => navigate(`/market/chat/${session.id}`)}
                          className={`w-full p-4 text-left transition-colors cursor-pointer ${
                            activeSession?.id === session.id
                              ? isDark
                                ? "bg-slate-800"
                                : "bg-slate-100"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage
                                src={session.other_user_avatar || undefined}
                              />
                              <AvatarFallback
                                className={
                                  isDark ? "bg-slate-700" : "bg-slate-200"
                                }
                              >
                                {session.other_user_name
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`font-medium truncate ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {session.other_user_name}
                                </span>
                                <div className="flex items-center gap-2">
                                  {session.unread_count > 0 && (
                                    <Badge className="bg-emerald-500 text-white text-xs">
                                      {session.unread_count}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-7 w-7 ${
                                      isDark
                                        ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                        : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    }`}
                                    onClick={(e) =>
                                      handleDeleteSession(session, e)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p
                                className={`text-sm truncate ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                {session.post_title}
                              </p>
                              {session.last_message && (
                                <p
                                  className={`text-xs truncate mt-1 ${
                                    isDark ? "text-slate-500" : "text-slate-400"
                                  }`}
                                >
                                  {session.last_message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              {activeSession ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div
                    className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate("/market/chat")}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={activeSession.other_user_avatar || undefined}
                        />
                        <AvatarFallback
                          className={isDark ? "bg-slate-700" : "bg-slate-200"}
                        >
                          {activeSession.other_user_name
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3
                          className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {activeSession.other_user_name}
                        </h3>
                        <p
                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {activeSession.post_title} · ¥
                          {activeSession.post_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/market/${activeSession.post_id}`)
                        }
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        View Item
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 overflow-auto p-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare
                          className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                        />
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          Start a conversation about this item
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message, index) => {
                          const isMe = message.sender_id === user?.id;
                          const showAvatar =
                            index === 0 ||
                            messages[index - 1].sender_id !== message.sender_id;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`flex items-end gap-2 max-w-[70%] ${
                                  isMe ? "flex-row-reverse" : ""
                                }`}
                              >
                                {showAvatar && !isMe ? (
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage
                                      src={message.sender_avatar || undefined}
                                    />
                                    <AvatarFallback
                                      className={
                                        isDark ? "bg-slate-700" : "bg-slate-200"
                                      }
                                    >
                                      {message.sender_name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="w-8" />
                                )}
                                <div
                                  className={`px-4 py-2 rounded-2xl ${
                                    isMe
                                      ? "bg-emerald-500 text-white rounded-br-none"
                                      : isDark
                                        ? "bg-slate-800 text-slate-100 rounded-bl-none"
                                        : "bg-slate-100 text-slate-900 rounded-bl-none"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <div
                                    className={`flex items-center gap-1 mt-1 text-xs ${
                                      isMe
                                        ? "text-emerald-100"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    <span>
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                    {isMe && (
                                      <span className="flex items-center">
                                        {message.is_read ? (
                                          <CheckCheck className="w-3 h-3 ml-1" />
                                        ) : (
                                          <Check className="w-3 h-3 ml-1" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-bl-none">
                              <div className="flex gap-1">
                                <span
                                  className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div
                    className={`p-4 border-t flex-shrink-0 ${isDark ? "border-slate-800" : "border-slate-200"}`}
                  >
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTypingStart();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className={`flex-1 ${
                          isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50"
                        }`}
                        disabled={isSending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <MessageSquare
                    className={`w-20 h-20 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                  />
                  <h3
                    className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Select a conversation
                  </h3>
                  <p
                    className={`text-center max-w-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Choose a conversation from the list to view messages and
                    chat with buyers or sellers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
