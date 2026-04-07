import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import {
  MessageSquare,
  X,
  Send,
  Minimize2,
  Bot,
  ExternalLink,
  Trash2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  link?: string;
  linkText?: string;
  timestamp: Date;
  suggestions?: string[];
}

interface UserInfo {
  name: string | null;
  department: string | null;
  enrollmentYear: number | null;
  currentYear: number | null;
  isLoggedIn: boolean;
}

const getWelcomeMessage = (user: UserInfo): ChatMessage => {
  const greeting =
    user.isLoggedIn && user.name ? `👋 **Hi ${user.name}!**` : "👋 **Hi!**";

  const deptInfo =
    user.isLoggedIn && user.department
      ? ` I see you're in **${user.department}**${user.enrollmentYear ? ` (${user.enrollmentYear})` : ""}.`
      : "";

  return {
    id: `welcome_${Date.now()}`,
    type: "bot",
    content: `${greeting} I'm NCWU Assistant!${deptInfo}\n\nI can help you with:\n📚 Class Schedules\n🌐 HSK Learning\n💬 Social & Marketplace\n📍 Campus, Events, Emergency\n💳 Payment & Guides\n🤖 **Xingyuan AI** — Advanced AI Chat (Deep Think, Images, Docs)\n\nAsk me anything! 😊`,
    timestamp: new Date(),
    suggestions: [
      "My class schedule",
      "HSK learning",
      "Upcoming events",
      "Marketplace",
      "Payment guide",
      "Try Xingyuan AI →",
    ],
  };
};

function getUserInfo(): UserInfo {
  try {
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        name: user?.full_name || null,
        department: user?.department || null,
        enrollmentYear: user?.enrollment_year || null,
        currentYear: user?.current_year || null,
        isLoggedIn: true,
      };
    }
  } catch {
    // Silently handle parse errors
  }
  return {
    name: null,
    department: null,
    enrollmentYear: null,
    currentYear: null,
    isLoggedIn: false,
  };
}

function truncateResponse(text: string): string {
  if (text.length <= 300) return text;
  return text.substring(0, 300) + "\n\n... Ask for more details!";
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage =
    location.pathname === "/discord" ||
    location.pathname.startsWith("/language-exchange/chat");
  const hideOnMobile = isChatPage ? "md:flex hidden" : "flex";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userInfo = getUserInfo();
      setMessages([getWelcomeMessage(userInfo)]);
    }
  }, [isOpen, messages.length]);

  const resetChat = () => {
    const userInfo = getUserInfo();
    setMessages([getWelcomeMessage(userInfo)]);
    setError(null);
    setInputValue("");
  };

  const sendMessage = async (text: string) => {
    const messageText = text.trim();
    if (!messageText || isTyping) return;

    setError(null);

    const userInfo = getUserInfo();

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      console.log("🤖 [FRONTEND] Sending:", messageText, "| User:", userInfo);

      const response = await api.post<{
        message: string;
        link?: string;
        linkText?: string;
        confidence: number;
        suggestions?: string[];
      }>("/chatbot/chat", {
        message: messageText,
        userInfo: {
          name: userInfo.name,
          department: userInfo.department,
          enrollmentYear: userInfo.enrollmentYear,
          currentYear: userInfo.currentYear,
          isLoggedIn: userInfo.isLoggedIn,
        },
      });

      console.log("🤖 [FRONTEND] Response:", JSON.stringify(response));

      if (response.success && response.data) {
        const botContent = truncateResponse(response.data.message);
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}`,
          type: "bot",
          content: botContent,
          link: response.data.link,
          linkText: response.data.linkText,
          timestamp: new Date(),
          suggestions: response.data.suggestions,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        console.warn("🤖 [FRONTEND] No data in response:", response);
        setError(response.message || "No response data");
        const errorMessage: ChatMessage = {
          id: `bot_error_${Date.now()}`,
          type: "bot",
          content:
            response.message ||
            "Sorry, I couldn't process that. Please try again!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err: unknown) {
      console.error("🤖 [FRONTEND] Error caught:", err);
      const errMsg =
        (err instanceof Error ? err.message : null) ||
        (err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Connection error"
          : "Connection error");
      setError(errMsg);
      const errorMessage: ChatMessage = {
        id: `bot_error_${Date.now()}`,
        type: "bot",
        content: `⚠️ Error: ${errMsg}. Please check if the backend server is running on port 3001.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.includes("Xingyuan AI")) {
      navigate("/xingyuan-ai");
      if (window.innerWidth < 768) setIsOpen(false);
      return;
    }
    const cleanText = suggestion
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "")
      .trim();
    sendMessage(cleanText || suggestion);
  };

  const handleLinkClick = (link: string) => {
    navigate(link);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const formatMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={lineIdx}>
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={i}>{part}</span>;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 ${hideOnMobile}`}
    >
      {isOpen && (
        <div
          className={`w-[380px] max-w-[calc(100vw-48px)] rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
            isMinimized ? "h-14" : "h-[520px]"
          } ${
            isDark
              ? "bg-slate-900/95 border-slate-700/50 backdrop-blur-xl"
              : "bg-white/95 border-slate-200/50 backdrop-blur-xl"
          }`}
        >
          {/* HEADER - shrink-0 means it NEVER scrolls away */}
          <div
            className={`flex items-center justify-between px-4 h-14 cursor-pointer shrink-0 ${
              isDark
                ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                : "bg-gradient-to-r from-indigo-500 to-purple-500"
            }`}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  NCWU Assistant
                </h3>
                <p className="text-xs text-white/70">Always here to help</p>
              </div>
            </div>

            {/* ALL BUTTONS ALWAYS VISIBLE - outside any conditional */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetChat();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {error && (
                <div
                  className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs font-medium shrink-0 ${
                    isDark
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  ⚠️ {error}
                </div>
              )}

              {/* MESSAGES AREA - only this part scrolls */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        msg.type === "user" ? "order-1" : "order-2"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.type === "user"
                            ? isDark
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-indigo-500 text-white rounded-br-md"
                            : isDark
                              ? "bg-slate-800 text-slate-100 rounded-bl-md border border-slate-700/50"
                              : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {msg.type === "bot" && (
                            <Bot
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-indigo-400" : "text-indigo-500"}`}
                            />
                          )}
                          <div>{formatMessage(msg.content)}</div>
                        </div>

                        {msg.id.startsWith("welcome_") && (
                          <button
                            onClick={() => {
                              navigate("/xingyuan-ai");
                              if (window.innerWidth < 768) setIsOpen(false);
                            }}
                            className={`mt-3 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                              isDark
                                ? "bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-300 hover:from-purple-500/25 hover:to-pink-500/25 border border-purple-500/30"
                                : "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border border-purple-200"
                            }`}
                          >
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 text-left">
                              <span className="font-semibold">Xingyuan AI</span>
                              <span className="opacity-70 ml-1">
                                — Deep Think · Images · Docs
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        )}

                        {msg.link && msg.linkText && (
                          <button
                            onClick={() => handleLinkClick(msg.link!)}
                            className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                              isDark
                                ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                            }`}
                          >
                            <span>{msg.linkText}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div
                      className={`rounded-2xl rounded-bl-md px-4 py-3 ${
                        isDark
                          ? "bg-slate-800 border border-slate-700/50"
                          : "bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Bot
                          className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-500"}`}
                        />
                        <div className="flex gap-1">
                          <span
                            className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`}
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`}
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`}
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {messages.length > 0 &&
                messages[messages.length - 1].type === "bot" &&
                messages[messages.length - 1].suggestions &&
                messages[messages.length - 1].suggestions!.length > 0 && (
                  <div className="px-4 pb-2 shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {messages[messages.length - 1].suggestions!.map(
                        (suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                              isDark
                                ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 hover:text-slate-900"
                            }`}
                          >
                            {suggestion}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

              <form
                onSubmit={handleSubmit}
                className={`px-4 pb-4 pt-2 border-t shrink-0 ${
                  isDark ? "border-slate-700/50" : "border-slate-200/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={isTyping}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 ${
                      isDark
                        ? "bg-slate-800 text-white placeholder:text-slate-500 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                        : "bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50"
                    } disabled:opacity-60`}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      inputValue.trim()
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25"
                        : isDark
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group relative ${
          isOpen
            ? isDark
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/30"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              !
            </span>
          </>
        )}
      </button>
    </div>
  );
}

export default Chatbot;
