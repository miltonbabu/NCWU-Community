import { useRef, useEffect, useState, useCallback } from "react";
import { useXingyuanChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";
import { sendGLMMessage, type GLMMessage } from "../../lib/glm-api";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { Plus, Home } from "lucide-react";
import type { Message } from "../../lib/xingyuan-types";
import { useUsageLimits } from "./useUsageLimits";
import { LoginPrompt, DailyLimitPopup } from "./UsagePopups";

const MAX_DOC_TEXT_LENGTH = 15000;
const MAX_IMAGES_PER_SEND = 10;
const MAX_HISTORY_MESSAGES = 20;
const SUMMARY_TRIGGER_COUNT = 12;

function truncateDocumentText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const half = Math.floor(maxLength / 2);
  return (
    text.slice(0, half) +
    `\n\n[... Document truncated — showing first ${half} and last ${maxLength - half} of ${text.length} total characters ...]\n\n` +
    text.slice(-half)
  );
}

function buildContextMessages(
  allMessages: Message[],
  currentUserId: string,
): { messages: GLMMessage[]; hasSummary: boolean } {
  const filtered = allMessages.filter((m) => m.id !== currentUserId);

  if (filtered.length <= MAX_HISTORY_MESSAGES) {
    return {
      messages: filtered.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      hasSummary: false,
    };
  }

  const older = filtered.slice(0, -SUMMARY_TRIGGER_COUNT);
  const recent = filtered.slice(-SUMMARY_TRIGGER_COUNT);

  const summaryParts: string[] = [];
  let userTurnCount = 0;
  let assistantTurnCount = 0;

  for (const msg of older) {
    if (msg.role === "user") {
      userTurnCount++;
      const imgNote =
        msg.images && msg.images.length > 0
          ? ` [User also attached ${msg.images.length} image(s)]`
          : "";
      summaryParts.push(`Q${userTurnCount}:${imgNote} ${msg.content}`);
    } else {
      assistantTurnCount++;
      summaryParts.push(`A${assistantTurnCount}: ${msg.content}`);
    }
  }

  const summaryText = `[Earlier conversation summary (${older.length} exchanges compressed):\n${summaryParts.join("\n")}\n\nRemember ALL facts, decisions, names, numbers, and agreements from above. Stay consistent with these prior answers.]\n---\n`;

  return {
    messages: [
      { role: "user", content: summaryText },
      ...recent.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    hasSummary: true,
  };
}

export function ChatMain() {
  const {
    state: { sidebarOpen, currentChatId },
    toggleSidebar,
    createChat,
    addMessage,
    editMessage,
    deleteMessage,
    updateThinking: dispatchUpdateThinking,
    getCurrentChat,
  } = useXingyuanChat();

  const { user } = useAuth();
  const userName = user?.full_name || null;

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [deepThink, setDeepThink] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const [, forceUpdate] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const {
    isGuest,
    isAdmin,
    checkAndRecordSend,
    recordDocument,
    showLoginPrompt,
    setShowLoginPrompt,
    showDailyLimitPopup,
    setShowDailyLimitPopup,
    handleLoginRedirect,
    remainingMessages,
    remainingImages,
    remainingDocuments,
    guestMessageCount,
    guestImageCount,
    GUEST_MSG_LIMIT,
    GUEST_IMAGE_LIMIT,
    USER_DAILY_IMAGE_LIMIT,
  } = useUsageLimits();

  useEffect(() => {
    if (currentChatId) setActiveChatId(currentChatId);
    resetState();
  }, [currentChatId]);

  function resetState() {
    sendingRef.current = false;
    isLoadingRef.current = false;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    forceUpdate((n) => n + 1);
  }

  const currentChat = getCurrentChat();
  const isLoading = isLoadingRef.current;

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSend = useCallback(
    async (
      content: string,
      deepThinkParam?: boolean,
      images?: string[],
      documentText?: string,
    ) => {
      let finalContent = content;
      if (documentText) {
        finalContent = `[Document Content]\n${truncateDocumentText(documentText, MAX_DOC_TEXT_LENGTH)}\n\n[User Question]\n${content}`;
      }

      if (!finalContent.trim() && (!images || images.length === 0)) return;
      if (sendingRef.current || isLoadingRef.current) return;

      const sendImages =
        images && images.length > 0
          ? images.slice(0, MAX_IMAGES_PER_SEND)
          : undefined;

      if (documentText) {
        const docResult = recordDocument();
        if (docResult === "login") {
          setShowLoginPrompt(true);
          return;
        }
        if (docResult === "limit" || docResult === "daily_limit") {
          return;
        }
      }

      if (images && images.length > 0) {
        const result = checkAndRecordSend(images.length);

        if (result === "login") {
          setShowLoginPrompt(true);
          return;
        }
        if (result === "limit" || result === "daily_limit") {
          return;
        }
      } else {
        if (!isGuest || remainingMessages <= 0) {
          if (isGuest && remainingMessages <= 0) {
            setShowLoginPrompt(true);
            return;
          }
          checkAndRecordSend(0);
        }
      }

      sendingRef.current = true;
      isLoadingRef.current = true;
      forceUpdate((n) => n + 1);

      let chatId = activeChatId || currentChatId;

      if (!chatId) {
        chatId = createChat();
        setActiveChatId(chatId);
      }

      const userMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        role: "user",
        content,
        images,
        timestamp: new Date(),
      };
      addMessage(chatId, userMessage);

      const aiMessageId = Math.random().toString(36).substring(2, 15);
      const useThinking =
        deepThinkParam !== undefined ? deepThinkParam : deepThink;

      let streamedContent = "";
      let accumulatedThinking = "";
      let hasAddedToChat = false;

      const controller = new AbortController();
      abortRef.current = controller;

      const addToChat = () => {
        if (hasAddedToChat) return;
        hasAddedToChat = true;
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: streamedContent || "",
          thinking: useThinking ? (streamedContent ? "" : "Connecting...") : "",
          timestamp: new Date(),
        };
        addMessage(chatId!, aiMessage);
      };

      try {
        const activeChatNow = getCurrentChat();
        const { messages: historyBase, hasSummary } = buildContextMessages(
          activeChatNow?.messages ?? [],
          userMessage.id,
        );

        const historyMessages = [
          ...historyBase,
          { role: "user" as const, content: finalContent },
        ];

        let lastError: Error | null = null;
        let responseContent = "";
        const MAX_SEND_RETRIES = 2;

        for (let attempt = 0; attempt <= MAX_SEND_RETRIES; attempt++) {
          if (attempt > 0) {
            if (!hasAddedToChat) addToChat();
            updateContent(
              chatId!,
              aiMessageId,
              useThinking ? accumulatedThinking || "" : "",
            );
            updateThinking?.(chatId!, aiMessageId, `Connection issue... Retrying (${attempt}/${MAX_SEND_RETRIES}) in ${3 + attempt * 2}s...\n`);
            await new Promise((r) => setTimeout(r, (3 + attempt * 2) * 1000));
            streamedContent = "";
            accumulatedThinking = "";
          }

          try {
            const response = await sendGLMMessage(
              historyMessages,
              sendImages,
              useThinking
                ? (text) => {
                    if (controller.signal.aborted) return;
                    accumulatedThinking += text;
                    if (!hasAddedToChat) addToChat();
                    dispatchUpdateThinking(
                      chatId!,
                      aiMessageId,
                      accumulatedThinking,
                    );
                  }
                : undefined,
              (delta) => {
                if (controller.signal.aborted) return;
                streamedContent += delta;
                if (!hasAddedToChat) addToChat();
                updateContent(chatId!, aiMessageId, streamedContent);
              },
              useThinking,
              controller.signal,
              userName,
            );

            if (!controller.signal.aborted) {
              if (!streamedContent && response) {
                if (!hasAddedToChat) addToChat();
                updateContent(chatId!, aiMessageId, response);
                responseContent = response;
              }

              if (!hasAddedToChat) addToChat();
            }
            lastError = null;
            break;
          } catch (retryErr) {
            lastError = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
            console.warn(`[Xingyuan] Send attempt ${attempt + 1} failed:`, lastError.message);
            if (attempt === MAX_SEND_RETRIES) {
              if (!hasAddedToChat) addToChat();
              updateContent(
                chatId!,
                aiMessageId,
                `Error: ${lastError.message}. Please try again.`,
              );
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!hasAddedToChat) addToChat();
        updateContent(
          chatId!,
          aiMessageId,
          `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        );
      } finally {
        if (!controller.signal.aborted) {
          sendingRef.current = false;
          isLoadingRef.current = false;
          abortRef.current = null;
          forceUpdate((n) => n + 1);
        }
      }
    },
    [
      activeChatId,
      currentChatId,
      deepThink,
      isGuest,
      remainingMessages,
      checkAndRecordSend,
    ],
  );

  const handleRegenerate = useCallback(
    async (editedMessageId: string, newContent: string) => {
      if (sendingRef.current || isLoadingRef.current) return;

      const chat = getCurrentChat();
      if (!chat) return;

      const msgIndex = chat.messages.findIndex((m) => m.id === editedMessageId);
      if (msgIndex === -1) return;

      const nextAssistantMsg = chat.messages
        .slice(msgIndex + 1)
        .find((m) => m.role === "assistant");

      if (nextAssistantMsg) {
        deleteMessage(chat.id, nextAssistantMsg.id);
      }

      sendingRef.current = true;
      isLoadingRef.current = true;
      forceUpdate((n) => n + 1);

      const aiMessageId = Math.random().toString(36).substring(2, 15);
      const useThinking = deepThink;
      let streamedContent = "";
      let accumulatedThinking = "";
      let hasAddedToChat = false;

      const controller = new AbortController();
      abortRef.current = controller;

      const addToChat = () => {
        if (hasAddedToChat) return;
        hasAddedToChat = true;
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: streamedContent || "",
          thinking: useThinking
            ? streamedContent
              ? ""
              : "Regenerating..."
            : "",
          timestamp: new Date(),
        };
        addMessage(chat.id, aiMessage);
      };

      try {
        const messagesBeforeEdit = chat.messages.slice(0, msgIndex + 1);
        const { messages: historyBase } = buildContextMessages(
          messagesBeforeEdit,
          editedMessageId,
        );

        const historyMessages = [...historyBase];

        const editedImages = chat.messages[msgIndex].images;
        const sendImages =
          editedImages && editedImages.length > 0
            ? editedImages.slice(0, MAX_IMAGES_PER_SEND)
            : undefined;

        const response = await sendGLMMessage(
          historyMessages,
          sendImages,
          useThinking
            ? (text) => {
                if (controller.signal.aborted) return;
                accumulatedThinking += text;
                if (!hasAddedToChat) addToChat();
                dispatchUpdateThinking(
                  chat.id,
                  aiMessageId,
                  accumulatedThinking,
                );
              }
            : undefined,
          (delta) => {
            if (controller.signal.aborted) return;
            streamedContent += delta;
            if (!hasAddedToChat) addToChat();
            updateContent(chat.id, aiMessageId, streamedContent);
          },
          useThinking,
          controller.signal,
          userName,
        );

        if (!controller.signal.aborted) {
          if (!streamedContent && response) {
            if (!hasAddedToChat) addToChat();
            updateContent(chat.id, aiMessageId, response);
          }

          if (!hasAddedToChat) addToChat();
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!hasAddedToChat) addToChat();
        updateContent(
          chat.id,
          aiMessageId,
          `Error: ${error instanceof Error ? error.message : "Failed to regenerate"}`,
        );
      } finally {
        if (!controller.signal.aborted) {
          sendingRef.current = false;
          isLoadingRef.current = false;
          abortRef.current = null;
          forceUpdate((n) => n + 1);
        }
      }
    },
    [
      activeChatId,
      currentChatId,
      deepThink,
      getCurrentChat,
      deleteMessage,
      addMessage,
      editMessage,
      userName,
    ],
  );

  const handleRegenerateResponse = useCallback(
    async (assistantMessageId: string) => {
      if (sendingRef.current || isLoadingRef.current) return;

      const chat = getCurrentChat();
      if (!chat) return;

      const aiMsgIndex = chat.messages.findIndex(
        (m) => m.id === assistantMessageId,
      );
      if (aiMsgIndex === -1) return;

      const prevUserMsg = [...chat.messages]
        .slice(0, aiMsgIndex)
        .reverse()
        .find((m) => m.role === "user");

      if (!prevUserMsg) return;

      deleteMessage(chat.id, assistantMessageId);

      sendingRef.current = true;
      isLoadingRef.current = true;
      forceUpdate((n) => n + 1);

      const aiMessageId = Math.random().toString(36).substring(2, 15);
      const useThinking = deepThink;
      let streamedContent = "";
      let accumulatedThinking = "";
      let hasAddedToChat = false;

      const controller = new AbortController();
      abortRef.current = controller;

      const addToChat = () => {
        if (hasAddedToChat) return;
        hasAddedToChat = true;
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: streamedContent || "",
          thinking: useThinking
            ? streamedContent
              ? ""
              : "Regenerating..."
            : "",
          timestamp: new Date(),
        };
        addMessage(chat.id, aiMessage);
      };

      try {
        const messagesBeforeAi = chat.messages.filter(
          (m) => m.id !== assistantMessageId,
        );
        const { messages: historyBase } = buildContextMessages(
          messagesBeforeAi,
          aiMessageId,
        );

        const sendImages =
          prevUserMsg.images && prevUserMsg.images.length > 0
            ? prevUserMsg.images.slice(0, MAX_IMAGES_PER_SEND)
            : undefined;

        const response = await sendGLMMessage(
          [
            ...historyBase,
            { role: "user" as const, content: prevUserMsg.content },
          ],
          sendImages,
          useThinking
            ? (text) => {
                if (controller.signal.aborted) return;
                accumulatedThinking += text;
                if (!hasAddedToChat) addToChat();
                dispatchUpdateThinking(
                  chat.id,
                  aiMessageId,
                  accumulatedThinking,
                );
              }
            : undefined,
          (delta) => {
            if (controller.signal.aborted) return;
            streamedContent += delta;
            if (!hasAddedToChat) addToChat();
            updateContent(chat.id, aiMessageId, streamedContent);
          },
          useThinking,
          controller.signal,
          userName,
        );

        if (!controller.signal.aborted) {
          if (!streamedContent && response) {
            if (!hasAddedToChat) addToChat();
            updateContent(chat.id, aiMessageId, response);
          }
          if (!hasAddedToChat) addToChat();
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!hasAddedToChat) addToChat();
        updateContent(
          chat.id,
          aiMessageId,
          `Error: ${error instanceof Error ? error.message : "Failed to regenerate"}`,
        );
      } finally {
        if (!controller.signal.aborted) {
          sendingRef.current = false;
          isLoadingRef.current = false;
          abortRef.current = null;
          forceUpdate((n) => n + 1);
        }
      }
    },
    [
      activeChatId,
      currentChatId,
      deepThink,
      getCurrentChat,
      deleteMessage,
      addMessage,
      editMessage,
      userName,
    ],
  );

  function updateContent(chatId: string, messageId: string, content: string) {
    editMessage(chatId, messageId, content);
  }

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    sendingRef.current = false;
    isLoadingRef.current = false;
    forceUpdate((n) => n + 1);
  };

  const hasMessages = currentChat && currentChat.messages.length > 0;

  const handleDeepThinkChange = (newDeepThink: boolean) =>
    setDeepThink(newDeepThink);

  return (
    <main className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <button
        onClick={() => (window.location.href = "/")}
        className="absolute top-4 right-4 z-50 size-9 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
        title="Go to Homepage"
      >
        <Home className="size-4" />
      </button>

      {hasMessages ? (
        <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
          <div className="min-h-full max-w-3xl mx-auto w-full">
            {currentChat!.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                chatId={currentChat!.id}
                onRegenerate={handleRegenerate}
                onRegenerateResponse={handleRegenerateResponse}
              />
            ))}
            {isLoading && !deepThink && <ThinkingIndicator />}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <ChatInput
            onSend={handleSend}
            onDeepThinkChange={handleDeepThinkChange}
            isLoading={isLoading}
            onStop={handleStop}
            centered={true}
            deepThink={deepThink}
            remainingMessages={remainingMessages}
            remainingImages={remainingImages}
            remainingDocuments={remainingDocuments}
            isGuest={isGuest}
            isAdmin={isAdmin}
            userName={userName}
          />
        </div>
      )}

      {hasMessages && (
        <div className="shrink-0 border-t border-border py-4 max-w-3xl mx-auto w-full">
          <ChatInput
            onSend={handleSend}
            onDeepThinkChange={handleDeepThinkChange}
            isLoading={isLoading}
            onStop={handleStop}
            deepThink={deepThink}
            remainingMessages={remainingMessages}
            remainingImages={remainingImages}
            remainingDocuments={remainingDocuments}
            isGuest={isGuest}
            isAdmin={isAdmin}
            userName={userName}
          />
        </div>
      )}

      <LoginPrompt
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        onLogin={handleLoginRedirect}
        messageCount={guestMessageCount}
        imageCount={guestImageCount}
        msgLimit={GUEST_MSG_LIMIT}
        imageLimit={GUEST_IMAGE_LIMIT}
      />

      <DailyLimitPopup
        open={showDailyLimitPopup}
        onOpenChange={setShowDailyLimitPopup}
        count={USER_DAILY_IMAGE_LIMIT - remainingImages}
        limit={USER_DAILY_IMAGE_LIMIT}
      />

      <button
        onClick={() => {
          const newId = createChat();
          setActiveChatId(newId);
        }}
        className="md:hidden fixed top-4 right-4 z-50 size-9 rounded-lg bg-muted border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
        title="New Chat"
      >
        <Plus className="size-4" />
      </button>
    </main>
  );
}
