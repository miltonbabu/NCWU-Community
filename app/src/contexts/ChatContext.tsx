import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { Chat, Message, UserSettings } from "../lib/xingyuan-types";
import {
  syncChatToServer,
  addMessageToServer,
  softDeleteChatOnServer,
  softDeleteMessageOnServer,
} from "../lib/xingyuan-sync";

const STORAGE_PREFIX = "xingyuan-chat-state-";

function getStorageKey(userId: string | null | undefined): string {
  return `${STORAGE_PREFIX}${userId || "guest"}`;
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  settings: UserSettings;
  sidebarOpen: boolean;
  settingsOpen: boolean;
}

type ChatAction =
  | { type: "CREATE_CHAT"; payload: { id: string } }
  | { type: "DELETE_CHAT"; payload: { id: string } }
  | { type: "SELECT_CHAT"; payload: { id: string } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | {
      type: "EDIT_MESSAGE";
      payload: { chatId: string; messageId: string; content: string };
    }
  | { type: "DELETE_MESSAGE"; payload: { chatId: string; messageId: string } }
  | { type: "DELETE_FROM_MESSAGE"; payload: { chatId: string; messageId: string } }
  | {
      type: "UPDATE_THINKING";
      payload: { chatId: string; messageId: string; thinking: string };
    }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserSettings> }
  | { type: "RESET_STATE"; payload: ChatState };

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultSettings: UserSettings = {
  displayName: "User",
  model: "glm-4v-plus",
  theme: "dark",
  soundEnabled: true,
  sendOnEnter: true,
};

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  settings: defaultSettings,
  sidebarOpen: typeof window !== "undefined" && window.innerWidth >= 768,
  settingsOpen: false,
};

function reviveDates(chat: Chat): Chat {
  return {
    ...chat,
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt),
    messages: chat.messages.map((msg) => ({ ...msg })),
  };
}

function loadState(userId: string | null | undefined): ChatState {
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        ...initialState,
        sidebarOpen: typeof window !== "undefined" && window.innerWidth >= 768,
      };
    }
    const parsed = JSON.parse(raw);
    if (!parsed.chats || !Array.isArray(parsed.chats)) return initialState;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    return {
      chats: parsed.chats.map(reviveDates),
      currentChatId: parsed.currentChatId || null,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      sidebarOpen: isMobile ? false : true,
      settingsOpen: parsed.settingsOpen ?? false,
    };
  } catch {
    return initialState;
  }
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "RESET_STATE":
      return action.payload;

    case "CREATE_CHAT": {
      const newChat: Chat = {
        id: action.payload.id,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return {
        ...state,
        chats: [newChat, ...state.chats],
        currentChatId: action.payload.id,
      };
    }

    case "DELETE_CHAT": {
      const newChats = state.chats.filter((c) => c.id !== action.payload.id);
      const newCurrentId =
        state.currentChatId === action.payload.id
          ? newChats[0]?.id || null
          : state.currentChatId;
      return { ...state, chats: newChats, currentChatId: newCurrentId };
    }

    case "SELECT_CHAT":
      return { ...state, currentChatId: action.payload.id };

    case "ADD_MESSAGE": {
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.id !== action.payload.chatId) return chat;
          const title =
            chat.messages.length === 0 && action.payload.message.role === "user"
              ? action.payload.message.content.slice(0, 30) +
                (action.payload.message.content.length > 30 ? "..." : "")
              : chat.title;
          return {
            ...chat,
            title,
            messages: [...chat.messages, action.payload.message],
            updatedAt: new Date(),
          };
        }),
      };
    }

    case "EDIT_MESSAGE": {
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.id !== action.payload.chatId) return chat;
          return {
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.id === action.payload.messageId
                ? { ...msg, content: action.payload.content, isEdited: true }
                : msg,
            ),
            updatedAt: new Date(),
          };
        }),
      };
    }

    case "DELETE_MESSAGE": {
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.id !== action.payload.chatId) return chat;
          return {
            ...chat,
            messages: chat.messages.filter(
              (msg) => msg.id !== action.payload.messageId,
            ),
            updatedAt: new Date(),
          };
        }),
      };
    }

    case "DELETE_FROM_MESSAGE": {
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.id !== action.payload.chatId) return chat;
          const idx = chat.messages.findIndex(
            (m) => m.id === action.payload.messageId,
          );
          if (idx === -1) return chat;
          return {
            ...chat,
            messages: chat.messages.slice(0, idx),
            updatedAt: new Date(),
          };
        }),
      };
    }

    case "UPDATE_THINKING": {
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.id !== action.payload.chatId) return chat;
          return {
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.id === action.payload.messageId
                ? { ...msg, thinking: action.payload.thinking }
                : msg,
            ),
          };
        }),
      };
    }

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case "TOGGLE_SETTINGS":
      return { ...state, settingsOpen: !state.settingsOpen };

    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  createChat: () => string;
  deleteChat: (id: string) => void;
  selectChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  editMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  deleteFromMessage: (chatId: string, messageId: string) => void;
  updateThinking: (chatId: string, messageId: string, thinking: string) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  getCurrentChat: () => Chat | null;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children, userId }: { children: ReactNode; userId?: string | null }) {
  const [state, dispatch] = useReducer(chatReducer, null, () => loadState(userId));

  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      console.log("[Xingyuan Chat] user switched:", prevUserIdRef.current, "->", userId);
      prevUserIdRef.current = userId;
      const freshState = loadState(userId);
      dispatch({ type: "RESET_STATE", payload: freshState });
    }
  }, [userId]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      const key = getStorageKey(prevUserIdRef.current);
      const toSave = {
        chats: state.chats,
        currentChatId: state.currentChatId,
        settings: state.settings,
        sidebarOpen: state.sidebarOpen,
        settingsOpen: state.settingsOpen,
      };
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch {
      // storage full or unavailable
    }
  }, [state]);

  useEffect(() => {
    for (const chat of state.chats) {
      syncChatToServer(chat);
    }
  }, [state.chats.map((c) => c.id + c.updatedAt?.getTime()).join(",")]);

  const createChat = useCallback(() => {
    const id = generateId();
    dispatch({ type: "CREATE_CHAT", payload: { id } });
    return id;
  }, []);

  const deleteChat = useCallback((id: string) => {
    softDeleteChatOnServer(id);
    dispatch({ type: "DELETE_CHAT", payload: { id } });
  }, []);

  const selectChat = useCallback((id: string) => {
    dispatch({ type: "SELECT_CHAT", payload: { id } });
  }, []);

  const addMessage = useCallback((chatId: string, message: Message) => {
    dispatch({ type: "ADD_MESSAGE", payload: { chatId, message } });
    addMessageToServer(chatId, message);
  }, []);

  const editMessage = useCallback(
    (chatId: string, messageId: string, content: string) => {
      dispatch({
        type: "EDIT_MESSAGE",
        payload: { chatId, messageId, content },
      });
    },
    [],
  );

  const deleteMessage = useCallback((chatId: string, messageId: string) => {
    softDeleteMessageOnServer(chatId, messageId);
    dispatch({
      type: "DELETE_MESSAGE",
      payload: { chatId, messageId },
    });
  }, []);

  const deleteFromMessage = useCallback((chatId: string, messageId: string) => {
    dispatch({
      type: "DELETE_FROM_MESSAGE",
      payload: { chatId, messageId },
    });
  }, []);

  const updateThinking = useCallback(
    (chatId: string, messageId: string, thinking: string) => {
      dispatch({
        type: "UPDATE_THINKING",
        payload: { chatId, messageId, thinking },
      });
    },
    [],
  );

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);

  const toggleSettings = useCallback(() => {
    dispatch({ type: "TOGGLE_SETTINGS" });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: newSettings });
  }, []);

  const getCurrentChat = useCallback((): Chat | null => {
    return state.chats.find((c) => c.id === state.currentChatId) || null;
  }, [state.chats, state.currentChatId]);

  return (
    <ChatContext.Provider
      value={{
        state,
        createChat,
        deleteChat,
        selectChat,
        addMessage,
        editMessage,
        deleteMessage,
        deleteFromMessage,
        updateThinking,
        toggleSidebar,
        toggleSettings,
        updateSettings,
        getCurrentChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useXingyuanChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useXingyuanChat must be used within a ChatProvider");
  }
  return context;
}
