import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useRestriction } from "@/hooks/useRestriction";
import { RestrictionPopup } from "@/components/RestrictionPopup";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Trash2,
  Loader2,
  Pencil,
  MoreVertical,
  Info,
  Smile,
  Check,
  CheckCheck,
  X,
  Users,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { ImageViewer } from "@/components/ImageViewer";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  is_own: boolean;
}

interface Chat {
  id: string;
  connection_id: string;
  partner_id: string;
  partner_full_name: string;
  partner_avatar_url: string | null;
  partner_department: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
}

export default function LanguageExchangeChat() {
  const { chatId } = useParams<{ chatId: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated, user } = useAuth();
  const { isRestricted, restriction, checkFeature } = useRestriction();
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const currentChatIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    } catch {}
  }, []);

  useEffect(() => {
    currentChatIdRef.current = selectedChat?.id || null;
  }, [selectedChat?.id]);

  useEffect(() => {
    currentUserIdRef.current = user?.id || null;
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
      initSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        fetchMessages(chatId);
        if (socketRef.current?.connected) {
          joinChatRoom(chatId);
        } else {
          const checkAndJoin = () => {
            if (socketRef.current?.connected) {
              joinChatRoom(chatId);
            } else {
              setTimeout(checkAndJoin, 100);
            }
          };
          checkAndJoin();
        }
      }
    }
  }, [chatId, chats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initSocket = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    console.log("Initializing socket connection...");
    socketRef.current = io("http://localhost:3001", {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected, joining user room");
      socketRef.current?.emit("join_user_room");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socketRef.current.on("exchange_message", (message: Message) => {
      console.log(
        "Received exchange_message:",
        message,
        "currentChatId:",
        currentChatIdRef.current,
      );

      if (message.sender_id === currentUserIdRef.current) {
        console.log("Skipping own message from socket");
        return;
      }

      playNotificationSound();

      if (message.chat_id === currentChatIdRef.current) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            console.log("Message already exists, skipping");
            return prev;
          }
          console.log("Adding message from socket");
          return [...prev, message];
        });
      }
    });

    socketRef.current.on(
      "exchange_message_deleted",
      (data: { messageId: string; chatId: string }) => {
        if (data.chatId === currentChatIdRef.current) {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        }
      },
    );

    // Typing indicators
    socketRef.current.on(
      "user_typing",
      (data: { userId: string; chatId: string }) => {
        console.log("User typing:", data);
        if (
          data.chatId === currentChatIdRef.current &&
          data.userId !== currentUserIdRef.current
        ) {
          setTypingUser(data.userId);
        }
      },
    );

    socketRef.current.on(
      "user_stopped_typing",
      (data: { userId: string; chatId: string }) => {
        console.log("User stopped typing:", data);
        if (
          data.chatId === currentChatIdRef.current &&
          data.userId !== currentUserIdRef.current
        ) {
          setTypingUser(null);
        }
      },
    );
  };

  const joinChatRoom = (id: string) => {
    console.log("Joining chat room:", id);
    if (socketRef.current) {
      socketRef.current.emit("join_chat", id);
    }
  };

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/language-exchange/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setChats(data.data);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/chats/${id}/messages`,
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
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTypingStart = () => {
    if (!isTyping && selectedChat && socketRef.current) {
      setIsTyping(true);
      socketRef.current.emit("typing_start", selectedChat.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (isTyping && selectedChat && socketRef.current) {
      setIsTyping(false);
      socketRef.current.emit("typing_stop", selectedChat.id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
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
    if ((!newMessage.trim() && !selectedImage) || !selectedChat || !user)
      return;

    if (isRestricted && checkFeature("language_exchange")) {
      setShowRestrictionPopup(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Stop typing indicator before sending
    handleTypingStop();

    const messageContent = newMessage.trim();
    setNewMessage("");

    let imageUrl = null;

    // Upload image if selected
    if (selectedImage) {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const token = localStorage.getItem("auth_token");
      try {
        // Simulate progress during upload
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
          `${API_BASE_URL}/upload/language-exchange-image`,
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

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            imageUrl = uploadData.data.url;
          }
        } else {
          toast.error("Failed to upload image");
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      chat_id: selectedChat.id,
      sender_id: user.id,
      content: messageContent,
      image_url: imagePreview,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.full_name || "You",
        avatar_url: user.avatar_url,
      },
      is_own: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setSelectedImage(null);
    setImagePreview(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/chats/${selectedChat.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: messageContent,
            image_url: imageUrl,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...data.data, is_own: true } : m,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(data.message || "Failed to send message");
        setNewMessage(messageContent);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/messages/${messageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message deleted");
      } else {
        toast.error(data.message || "Failed to delete message");
      }
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/chats/${selectedChat.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Chat deleted");
        setChats((prev) => prev.filter((c) => c.id !== selectedChat.id));
        setSelectedChat(null);
        setMessages([]);
        setShowDeleteConfirm(false);
      } else {
        toast.error(data.message || "Failed to delete chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="text-center p-8 rounded-2xl backdrop-blur-xl border bg-white/5 border-white/10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-50" />
            <MessageCircle className="relative w-16 h-16 mx-auto mb-4 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">
            Sign in required
          </h2>
          <p className="text-slate-400 mb-6">
            Please sign in to access your chats
          </p>
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <div
        className={`${showSidebar ? "w-80" : "w-0"} flex-shrink-0 border-r transition-all duration-300 ${
          isDark
            ? "bg-slate-900/80 border-white/10"
            : "bg-white/80 border-slate-200/50"
        } backdrop-blur-xl`}
      >
        {showSidebar && (
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div
              className={`p-4 border-b ${
                isDark ? "border-white/10" : "border-slate-200/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-50" />
                    <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h1
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Messages
                  </h1>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <Link
                to="/language-exchange"
                className={`flex items-center gap-2 text-sm ${
                  isDark
                    ? "text-indigo-400 hover:text-indigo-300"
                    : "text-indigo-600 hover:text-indigo-700"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Language Exchange
              </Link>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  </div>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-30" />
                    <MessageCircle
                      className={`relative w-12 h-12 mx-auto mb-2 ${
                        isDark ? "text-slate-600" : "text-slate-300"
                      }`}
                    />
                  </div>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    No chats yet
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Connect with someone to start chatting
                  </p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      fetchMessages(chat.id);
                      joinChatRoom(chat.id);
                    }}
                    className={`w-full p-4 text-left flex items-center gap-3 transition-all duration-300 ${
                      selectedChat?.id === chat.id
                        ? isDark
                          ? "bg-white/10 border-l-4 border-indigo-500"
                          : "bg-indigo-50 border-l-4 border-indigo-500"
                        : isDark
                          ? "hover:bg-white/5 border-l-4 border-transparent"
                          : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {chat.partner_avatar_url ? (
                          <img
                            src={chat.partner_avatar_url}
                            alt={chat.partner_full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          chat.partner_full_name?.charAt(0)?.toUpperCase() ||
                          "?"
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-semibold truncate ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {chat.partner_full_name}
                        </p>
                        {chat.last_message_created_at && (
                          <span
                            className={`text-xs ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {formatTime(chat.last_message_created_at)}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm truncate ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {chat.last_message_content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div
              className={`p-4 border-b flex items-center justify-between backdrop-blur-xl flex-shrink-0 ${
                isDark
                  ? "bg-slate-900/80 border-white/10"
                  : "bg-white/80 border-slate-200/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className={`p-2 rounded-lg ${
                      isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {selectedChat.partner_avatar_url ? (
                      <img
                        src={selectedChat.partner_avatar_url}
                        alt={selectedChat.partner_full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      selectedChat.partner_full_name
                        ?.charAt(0)
                        ?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
                </div>
                <div>
                  <p
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {selectedChat.partner_full_name}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {selectedChat.partner_department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                      : "hover:bg-red-50 text-slate-500 hover:text-red-500"
                  }`}
                  title="Delete chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className={`flex-1 overflow-y-auto p-4 min-h-0 ${
                isDark ? "bg-slate-950/50" : "bg-slate-50/50"
              }`}
            >
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const showDateSeparator =
                      index === 0 ||
                      formatDate(messages[index - 1].created_at) !==
                        formatDate(message.created_at);

                    return (
                      <div key={message.id} className="mb-3">
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-6">
                            <span
                              className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                                isDark
                                  ? "bg-white/10 text-slate-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex items-end gap-2 ${
                            message.is_own ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {!message.is_own && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {message.sender?.avatar_url ? (
                                <img
                                  src={message.sender.avatar_url}
                                  alt={message.sender.full_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                message.sender?.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"
                              )}
                            </div>
                          )}
                          <div className={`max-w-[70%]`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl shadow-lg ${
                                message.is_own
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md shadow-indigo-500/20"
                                  : isDark
                                    ? "bg-white/10 text-white rounded-bl-md border border-white/10"
                                    : "bg-white text-slate-900 rounded-bl-md border border-slate-200 shadow-slate-200/50"
                              }`}
                            >
                              {message.content && (
                                <p className="break-words text-sm leading-relaxed mb-2">
                                  {message.content}
                                </p>
                              )}
                              {message.image_url && (
                                <div className="mt-2">
                                  <img
                                    src={message.image_url}
                                    alt="Shared image"
                                    className="max-w-full max-h-80 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() =>
                                      setViewerImage(message.image_url!)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                            <div
                              className={`flex items-center gap-2 mt-1 px-1 ${
                                message.is_own ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span
                                className={`text-xs ${
                                  isDark ? "text-slate-500" : "text-slate-400"
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </span>
                              {message.is_own && (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              {message.is_own && (
                                <button
                                  onClick={() =>
                                    handleDeleteMessage(message.id)
                                  }
                                  className={`p-1 rounded opacity-50 hover:opacity-100 transition-opacity ${
                                    isDark
                                      ? "hover:bg-white/10 text-slate-500"
                                      : "hover:bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div
              className={`p-4 border-t backdrop-blur-xl flex-shrink-0 ${
                isDark
                  ? "bg-slate-900/80 border-white/10"
                  : "bg-white/80 border-slate-200/50"
              }`}
            >
              {/* Typing Indicator */}
              {typingUser && (
                <div
                  className={`flex items-center gap-2 mb-3 px-2 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
                    <span className="text-sm">typing</span>
                    <span className="flex gap-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  </div>
                </div>
              )}
              {/* Image Preview */}
              {imagePreview && (
                <div
                  className={`mb-3 p-3 rounded-lg ${
                    isDark ? "bg-white/10" : "bg-slate-100"
                  }`}
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
                        className={`text-sm font-medium truncate ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {selectedImage?.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {(selectedImage?.size || 0) / 1024 < 1024
                          ? `${Math.round((selectedImage?.size || 0) / 1024)} KB`
                          : `${((selectedImage?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={handleRemoveImage}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? "hover:bg-white/10 text-slate-400"
                            : "hover:bg-slate-200 text-slate-500"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-medium ${
                            isDark ? "text-indigo-400" : "text-indigo-600"
                          }`}
                        >
                          Uploading image...
                        </span>
                        <span
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          {uploadProgress}%
                        </span>
                      </div>
                      <div
                        className={`h-2 rounded-full overflow-hidden ${
                          isDark ? "bg-white/20" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p
                        className={`text-xs text-center ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Please wait a moment...
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Image Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isDark
                      ? "hover:bg-white/10 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                  title="Add image"
                >
                  <Image className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTypingStart();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    onBlur={handleTypingStop}
                    placeholder="Type a message..."
                    className={`w-full px-4 py-3 pr-12 rounded-2xl border transition-all duration-300 ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-white/10 focus:border-indigo-500/50"
                        : "bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500/50"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                  />
                  <button
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      isDark
                        ? "hover:bg-white/10 text-slate-400"
                        : "hover:bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={
                    (!newMessage.trim() && !selectedImage) || isUploading
                  }
                  className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-30" />
                <MessageCircle
                  className={`relative w-20 h-20 mx-auto mb-4 ${
                    isDark ? "text-slate-700" : "text-slate-300"
                  }`}
                />
              </div>
              <h2
                className={`text-2xl font-bold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Select a chat
              </h2>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 backdrop-blur-xl ${
              isDark
                ? "bg-slate-900/90 border-white/10"
                : "bg-white/90 border-slate-200"
            } shadow-2xl`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Delete Chat
              </h3>
            </div>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Are you sure you want to delete this chat? All messages will be
              permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isDark
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        imageUrl={viewerImage || ""}
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
        alt="Chat image"
      />

      <RestrictionPopup
        isOpen={showRestrictionPopup}
        onClose={() => setShowRestrictionPopup(false)}
        restriction={restriction}
        feature="language_exchange"
      />
    </div>
  );
}
