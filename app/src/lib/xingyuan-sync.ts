import type { Chat, Message } from "./xingyuan-types";

const SYNC_DEBOUNCE_MS = 500;
const pendingSyncs = new Map<string, ReturnType<typeof setTimeout>>();

function getApiUrl(path: string): string {
  const envUrl = import.meta.env.VITE_API_URL;
  const BACKEND_URL = "https://ncwu-api.onrender.com";

  if (envUrl && !envUrl.includes("localhost")) {
    try {
      const envHost = new URL(envUrl).hostname;
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
      if (envHost === currentHost || envHost.includes("vercel.app") || envHost.includes("onrender.com") && !envHost.includes("ncwu-api")) {
        return `${BACKEND_URL}${path}`;
      }
      return `${envUrl}${path}`;
    } catch {
      return `${envUrl}${path}`;
    }
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return `${BACKEND_URL}${path}`;
  }
  return `/api${path}`;
}

function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function syncChatToServer(chat: Chat): void {
  const token = getAuthToken();
  const key = `chat_${chat.id}`;
  console.log("[Xingyuan Sync] Preparing sync:", {
    chatId: chat.id,
    hasToken: !!token,
    tokenPrefix: token ? `${token.substring(0, 10)}...` : null,
    messageCount: chat.messages.length,
  });
  if (pendingSyncs.has(key)) clearTimeout(pendingSyncs.get(key)!);

  pendingSyncs.set(
    key,
    setTimeout(async () => {
      try {
        const res = await fetch(getApiUrl("/xingyuan/chat/sync"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            chatId: chat.id,
            title: chat.title,
            messages: chat.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              images: m.images,
              thinking: m.thinking,
              timestamp:
                m.timestamp instanceof Date
                  ? m.timestamp.toISOString()
                  : m.timestamp,
            })),
            model: "glm-4v-plus",
          }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error(
            "[Xingyuan Sync] syncChat failed:",
            res.status,
            errText,
          );
        } else {
          console.log(
            "[Xingyuan Sync] synced chat:",
            chat.id,
            "messages:",
            chat.messages.length,
          );
        }
        pendingSyncs.delete(key);
      } catch (err) {
        console.error("[Xingyuan Sync] syncChat error:", err);
        pendingSyncs.delete(key);
      }
    }, SYNC_DEBOUNCE_MS),
  );
}

export async function addMessageToServer(
  chatId: string,
  message: Message,
): Promise<void> {
  const token = getAuthToken();
  try {
    const res = await fetch(getApiUrl("/xingyuan/message/add"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        chatId,
        messageId: message.id,
        role: message.role,
        content: message.content,
        images: message.images,
        thinking: message.thinking,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[Xingyuan Sync] addMessage failed:", res.status, errText);
    } else {
      console.log(
        "[Xingyuan Sync] added message:",
        message.id,
        "role:",
        message.role,
      );
    }
  } catch (err) {
    console.error("[Xingyuan Sync] addMessage error:", err);
  }
}

export async function softDeleteChatOnServer(chatId: string): Promise<void> {
  const token = getAuthToken();
  try {
    if (!token) return;
    const res = await fetch(getApiUrl("/xingyuan/chat/soft-delete"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId }),
    });
    if (!res.ok) {
      console.error("[Xingyuan Sync] softDeleteChat failed:", res.status);
    }
  } catch (err) {
    console.error("[Xingyuan Sync] softDeleteChat error:", err);
  }
}

export async function softDeleteMessageOnServer(
  chatId: string,
  messageId: string,
): Promise<void> {
  const token = getAuthToken();
  try {
    if (!token) return;
    const res = await fetch(getApiUrl("/xingyuan/message/soft-delete"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId, messageId }),
    });
    if (!res.ok) {
      console.error("[Xingyuan Sync] softDeleteMsg failed:", res.status);
    }
  } catch (err) {
    console.error("[Xingyuan Sync] softDeleteMsg error:", err);
  }
}
