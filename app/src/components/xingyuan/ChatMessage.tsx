import { useState } from "react";
import { useXingyuanChat } from "../../contexts/ChatContext";
import type { Message } from "../../lib/xingyuan-types";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import {
  Copy,
  Check,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Sparkles,
  Brain,
} from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessageProps {
  message: Message;
  chatId: string;
  onRegenerate?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (assistantMessageId: string) => void;
}

export function ChatMessage({
  message,
  chatId,
  onRegenerate,
  onRegenerateResponse,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  const { editMessage, deleteFromMessage, state } = useXingyuanChat();
  const isUser = message.role === "user";
  const hasThinking = message.thinking && message.thinking.trim().length > 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (editContent.trim()) {
      editMessage(chatId, message.id, editContent.trim());
      setIsEditing(false);
      onRegenerate?.(message.id, editContent.trim());
    }
  };

  const handleDelete = () => {
    deleteFromMessage(chatId, message.id);
  };

  return (
    <div
      className={cn(
        "group flex gap-4 py-6 px-4 md:px-8",
        isUser ? "bg-transparent flex-row-reverse" : "bg-muted/30",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          isUser ? "bg-primary" : "bg-accent",
        )}
      >
        {isUser ? (
          <User className="size-4 text-primary-foreground" />
        ) : (
          <Bot className="size-4 text-accent-foreground" />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 space-y-3",
          isUser ? "flex-1 text-right" : "flex-1",
        )}
      >
        {message.isEdited && isUser && (
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">(edited)</span>
          </div>
        )}

        {hasThinking && (
          <div className="border border-violet-500/20 rounded-lg overflow-hidden bg-violet-500/5">
            <button
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-500/10 transition-colors"
            >
              <Brain
                className={cn(
                  "size-4 text-violet-500",
                  !thinkingExpanded && "animate-pulse",
                )}
              />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {thinkingExpanded ? "Hide" : "Show"} Thinking Process
                {!thinkingExpanded && message.content.trim().length === 0 && (
                  <span className="ml-1"> (thinking...)</span>
                )}
              </span>
              <div className="flex gap-0.5 ml-auto">
                {!thinkingExpanded && message.content.trim().length === 0 && (
                  <>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </>
                )}
                {thinkingExpanded ? (
                  <ChevronUp className="size-3.5 text-violet-500" />
                ) : (
                  <ChevronDown className="size-3.5 text-violet-500" />
                )}
              </div>
            </button>
            {thinkingExpanded && (
              <div className="px-3 py-2.5 border-t border-violet-500/10 text-sm text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="inline-block max-w-[85%] ml-auto bg-card border border-border rounded-2xl shadow-sm py-2 px-3 space-y-1.5">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[32px] max-h-[100px] resize-none text-sm py-1.5 px-2 leading-tight"
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-lg",
              isUser
                ? "bg-card border border-border inline-block max-w-[85%] rounded-2xl py-1.5 px-3 shadow-sm"
                : "p-3 -m-3",
            )}
          >
            {message.images && message.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {message.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Image ${idx + 1}`}
                    className="max-w-[240px] max-h-[200px] rounded-lg border border-border object-cover"
                  />
                ))}
              </div>
            )}
            {message.content.trim() && (
              <div
                className={cn(
                  "prose prose-sm dark:prose-invert max-w-none",
                  isUser && "[&_p]:my-1 [&_span]:block [&_span]:my-0",
                )}
              >
                <MarkdownRenderer content={message.content} />
              </div>
            )}
          </div>
        )}

        {!isEditing && message.content.trim() && (
          <div
            className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "justify-end" : "",
            )}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="size-7"
            >
              {copied ? (
                <Check className="size-3.5 text-green-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
            {!isUser && onRegenerateResponse && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRegenerateResponse(message.id)}
                className="size-7 hover:text-indigo-500"
                title="Regenerate response"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            )}
            {isUser && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsEditing(true)}
                className="size-7"
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              className="size-7 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
