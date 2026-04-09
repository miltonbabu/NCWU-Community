import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessage: (groupId: string, message: ChatMessage) => void;
  deleteMessage: (groupId: string, messageId: string) => void;
  startTyping: (groupId: string) => void;
  stopTyping: (groupId: string) => void;
  markViewed: (groupId: string, messageIds: string[]) => void;
  updatePresence: (status: "online" | "offline" | "away") => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(
    new Map(),
  );
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const pendingJoinGroupRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      if (pendingJoinGroupRef.current) {
        console.log("[Socket] Auto-joining pending group:", pendingJoinGroupRef.current);
        newSocket.emit("join_group", pendingJoinGroupRef.current);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.on("user_online", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    newSocket.on("user_offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.forEach((users, groupId) => {
          const updated = new Set(users);
          updated.delete(userId);
          next.set(groupId, updated);
        });
        return next;
      });
    });

    newSocket.on(
      "user_typing",
      ({ userId, groupId }: { userId: string; groupId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const groupTyping = new Set(next.get(groupId) || []);
          groupTyping.add(userId);
          next.set(groupId, groupTyping);
          return next;
        });
      },
    );

    newSocket.on(
      "user_stopped_typing",
      ({ userId, groupId }: { userId: string; groupId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const groupTyping = next.get(groupId);
          if (groupTyping) {
            const updated = new Set(groupTyping);
            updated.delete(userId);
            next.set(groupId, updated);
          }
          return next;
        });
      },
    );

    socketRef.current = newSocket;
    if (pendingJoinGroupRef.current) {
      newSocket.emit("join_group", pendingJoinGroupRef.current);
    }
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinGroup = useCallback((groupId: string) => {
    pendingJoinGroupRef.current = groupId;
    if (socketRef.current) {
      socketRef.current.emit("join_group", groupId);
    }
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    if (pendingJoinGroupRef.current === groupId) {
      pendingJoinGroupRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit("leave_group", groupId);
    }
  }, []);

  const sendMessage = useCallback((groupId: string, message: ChatMessage) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", { groupId, message });
    }
  }, []);

  const deleteMessage = useCallback((groupId: string, messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("delete_message", { groupId, messageId });
    }
  }, []);

  const startTyping = useCallback((groupId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("typing_start", groupId);
    }
  }, []);

  const stopTyping = useCallback((groupId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("typing_stop", groupId);
    }
  }, []);

  const markViewed = useCallback((groupId: string, messageIds: string[]) => {
    if (socketRef.current) {
      socketRef.current.emit("mark_viewed", { groupId, messageIds });
    }
  }, []);

  const updatePresence = useCallback(
    (status: "online" | "offline" | "away") => {
      if (socketRef.current) {
        socketRef.current.emit("update_presence", status);
      }
    },
    [],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        joinGroup,
        leaveGroup,
        sendMessage,
        deleteMessage,
        startTyping,
        stopTyping,
        markViewed,
        updatePresence,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
 
