import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
  User,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { MarketComment } from "@/types/market";

interface CommentItemProps {
  comment: MarketComment;
  isDark: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  replyingTo: MarketComment | null;
  replyContent: string;
  onReply: (parentComment: MarketComment) => void;
  onCancelReply: () => void;
  onSetReplyingTo: (comment: MarketComment) => void;
  onReplyContentChange: (content: string) => void;
  onDelete: (comment: MarketComment) => void;
  currentUserId?: string;
  depth?: number;
}

function countAllReplies(comment: MarketComment): number {
  if (!comment.replies || comment.replies.length === 0) return 0;
  let count = comment.replies.length;
  comment.replies.forEach((reply) => {
    count += countAllReplies(reply);
  });
  return count;
}

export function CommentItem({
  comment,
  isDark,
  isAuthenticated,
  isSubmitting,
  replyingTo,
  replyContent,
  onReply,
  onCancelReply,
  onSetReplyingTo,
  onReplyContentChange,
  onDelete,
  currentUserId,
  depth = 0,
}: CommentItemProps) {
  const isReplying = replyingTo?.id === comment.id;
  const isOwner =
    currentUserId &&
    comment.user_id &&
    String(currentUserId) === String(comment.user_id);
  const [showReplies, setShowReplies] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const directReplyCount = comment.replies?.length || 0;
  const totalReplyCount = countAllReplies(comment);
  const PREVIEW_COUNT = 3;
  const hasMoreReplies = directReplyCount > PREVIEW_COUNT;
  const previewReplies = comment.replies?.slice(0, PREVIEW_COUNT) || [];
  const remainingCount = directReplyCount - PREVIEW_COUNT;
  const repliesToShow = showAllReplies ? comment.replies : previewReplies;

  const handleReplyClick = () => {
    const mentionText = `@${comment.user_name || "Anonymous"} `;
    onSetReplyingTo(comment);
    if (!replyContent.startsWith(mentionText)) {
      onReplyContentChange(mentionText);
    }
  };

  const isTopLevel = depth === 0;

  return (
    <div className={`${!isTopLevel ? "mt-3" : ""}`}>
      <div
        className={`rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDark ? "bg-slate-700" : "bg-slate-200"
              }`}
            >
              {comment.user_avatar ? (
                <img
                  src={comment.user_avatar}
                  alt={comment.user_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User
                  className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {comment.user_name || "Anonymous"}
                </span>
                {comment.parent_reply_to_name && (
                  <span
                    className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    ↳ replying to @{comment.parent_reply_to_name}
                  </span>
                )}
                <span
                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => onDelete(comment)}
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-500 hover:text-red-400"
                    : "hover:bg-slate-200 text-slate-400 hover:text-red-500"
                }`}
                title="Delete comment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p
            className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            {comment.content}
          </p>
          {isAuthenticated && (
            <button
              onClick={handleReplyClick}
              className={`mt-2 text-xs font-medium ${
                isDark
                  ? "text-emerald-400 hover:text-emerald-300"
                  : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              Reply
            </button>
          )}
        </div>

        {isReplying && (
          <div
            className={`px-4 pb-4 ${isDark ? "border-t border-slate-700" : "border-t border-slate-200"}`}
          >
            <div className="flex items-center gap-2 mt-3 mb-2">
              <span
                className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"} font-medium`}
              >
                ↳ Replying to @{replyingTo.user_name || "Anonymous"}
              </span>
              <button
                onClick={onCancelReply}
                className={`text-xs ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder="Write a reply..."
                className={`flex-1 text-sm ${isDark ? "bg-slate-700 border-slate-600" : ""}`}
                rows={2}
                autoFocus
              />
              <Button
                onClick={() => onReply(comment)}
                disabled={isSubmitting || !replyContent.trim()}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {directReplyCount > 0 && (
          <div
            className={`px-4 pb-4 ${isDark ? "border-t border-slate-700" : "border-t border-slate-200"}`}
          >
            {!showReplies ? (
              <button
                onClick={() => setShowReplies(true)}
                className={`mt-3 flex items-center gap-2 text-xs font-medium ${
                  isDark
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
                {totalReplyCount} {totalReplyCount === 1 ? "reply" : "replies"}
              </button>
            ) : (
              <>
                <div className="mt-3 mb-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {totalReplyCount}{" "}
                    {totalReplyCount === 1 ? "reply" : "replies"}
                  </span>
                  <button
                    onClick={() => {
                      setShowReplies(false);
                      setShowAllReplies(false);
                    }}
                    className={`flex items-center gap-1 text-xs font-medium ${
                      isDark
                        ? "text-slate-400 hover:text-slate-300"
                        : "text-slate-500 hover:text-slate-600"
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    Hide
                  </button>
                </div>
                <div className="ml-4 pl-4 space-y-3 border-l-2 border-emerald-500/30">
                  {repliesToShow?.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isDark={isDark}
                      isAuthenticated={isAuthenticated}
                      isSubmitting={isSubmitting}
                      replyingTo={replyingTo}
                      replyContent={replyContent}
                      onReply={onReply}
                      onCancelReply={onCancelReply}
                      onSetReplyingTo={onSetReplyingTo}
                      onReplyContentChange={onReplyContentChange}
                      onDelete={onDelete}
                      currentUserId={currentUserId}
                      depth={depth + 1}
                    />
                  ))}
                </div>

                <div className="mt-3 ml-8 flex items-center gap-3">
                  {hasMoreReplies && !showAllReplies && (
                    <button
                      onClick={() => setShowAllReplies(true)}
                      className={`flex items-center gap-2 text-xs font-medium ${
                        isDark
                          ? "text-emerald-400 hover:text-emerald-300"
                          : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                      Show {remainingCount} more{" "}
                      {remainingCount === 1 ? "reply" : "replies"}
                    </button>
                  )}

                  {showAllReplies && hasMoreReplies && (
                    <button
                      onClick={() => setShowAllReplies(false)}
                      className={`flex items-center gap-2 text-xs font-medium ${
                        isDark
                          ? "text-emerald-400 hover:text-emerald-300"
                          : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                      Show fewer replies
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
