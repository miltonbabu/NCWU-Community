import { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { marketApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CommentItem } from "@/components/CommentItem";
import type { MarketPost, MarketComment } from "@/types/market";
import { MARKET_CATEGORIES, MARKET_CONDITIONS } from "@/types/market";
import {
  ShoppingCart,
  ChevronLeft,
  Loader2,
  Heart,
  MessageCircle,
  Eye,
  Phone,
  ExternalLink,
  Share2,
  CheckCircle,
  DollarSign,
  Shield,
  User,
  Clock,
  Tag,
  Trash2,
  Send,
  Sparkles,
  Edit,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";

export default function MarketPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [post, setPost] = useState<MarketPost | null>(null);
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<MarketComment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBuyRequest, setShowBuyRequest] = useState(false);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketApi.getPost(id!);
      if (response.success && response.data) {
        setPost(response.data);
        setIsLiked(response.data.user_liked || false);
      } else {
        toast.error("Post not found");
        navigate("/market");
      }
    } catch (error) {
      toast.error("Failed to fetch post");
      navigate("/market");
    }
    setIsLoading(false);
  }, [id, navigate]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await marketApi.getComments(id!);
      if (response.success && response.data) {
        console.log(
          "Fetched comments:",
          JSON.stringify(
            response.data.map((c: any) => ({
              id: c.id,
              parent_id: c.parent_id,
              content: c.content?.substring(0, 20),
              repliesCount: c.replies?.length,
            })),
            null,
            2,
          ),
        );
        setComments(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments");
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id, fetchPost, fetchComments]);

  useEffect(() => {
    const buyParam = searchParams.get("buy");
    if (
      buyParam === "true" &&
      post &&
      !post.is_sold &&
      isAuthenticated &&
      user?.id !== post.user_id
    ) {
      setShowBuyRequest(true);
      searchParams.delete("buy");
      setSearchParams(searchParams);
    }
  }, [searchParams, post, isAuthenticated, user, setSearchParams]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (isLiked) {
        const response = await marketApi.unlikePost(id!);
        if (response.success) {
          setIsLiked(false);
          if (post) {
            setPost({ ...post, like_count: (post.like_count || 1) - 1 });
          }
        }
      } else {
        const response = await marketApi.likePost(id!);
        if (response.success) {
          setIsLiked(true);
          if (post) {
            setPost({ ...post, like_count: (post.like_count || 0) + 1 });
          }
        }
      }
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await marketApi.addComment(id!, newComment.trim());
      if (response.success && response.data) {
        setComments([response.data, ...comments]);
        setNewComment("");
        if (post) {
          setPost({ ...post, comment_count: (post.comment_count || 0) + 1 });
        }
        toast.success("Comment added");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
    setIsSubmitting(false);
  };

  const handleReply = async (parentComment: MarketComment) => {
    if (!isAuthenticated) {
      toast.error("Please login to reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Sending reply:", {
        postId: id,
        content: replyContent.trim(),
        parentId: parentComment.id,
        parentComment,
      });
      const response = await marketApi.addComment(
        id!,
        replyContent.trim(),
        parentComment.id,
      );
      console.log("Reply response:", response);
      if (response.success) {
        setReplyContent("");
        setReplyingTo(null);
        if (post) {
          setPost({ ...post, comment_count: (post.comment_count || 0) + 1 });
        }
        toast.success("Reply added");
        const commentsResponse = await marketApi.getComments(id!);
        if (commentsResponse.success && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      }
    } catch (error) {
      toast.error("Failed to add reply");
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (comment: MarketComment) => {
    if (!isAuthenticated) {
      toast.error("Please login to delete comment");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await marketApi.deleteComment(id!, comment.id);
      if (response.success) {
        if (post) {
          setPost({
            ...post,
            comment_count: Math.max(0, (post.comment_count || 0) - 1),
          });
        }
        toast.success("Comment deleted");
        const commentsResponse = await marketApi.getComments(id!);
        if (commentsResponse.success && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      } else {
        toast.error(
          response.error || response.message || "Failed to delete comment",
        );
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleMarkAsSold = async () => {
    if (!post) return;

    try {
      const response = await marketApi.markAsSold(post.id);
      if (response.success) {
        toast.success("Item marked as sold. It will be removed in 1 hour.");
        fetchPost();
      }
    } catch (error) {
      toast.error("Failed to mark as sold");
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await marketApi.deletePost(post.id);
      if (response.success) {
        toast.success("Post deleted");
        navigate("/market");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleBuyRequest = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to request purchase");
      return;
    }

    if (!post) return;

    setIsSubmitting(true);
    try {
      const response = await marketApi.createBuyRequest(post.id);
      if (response.success) {
        toast.success("Buy request sent to admin for processing");
        setShowBuyRequest(false);
      } else {
        toast.error((response as any).error || "Failed to create buy request");
      }
    } catch (error: any) {
      console.error("Buy request error:", error);
      toast.error(error?.message || "Failed to create buy request");
    }
    setIsSubmitting(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: post?.title,
      text: `Check out this item: ${post?.title} - ¥${post?.price}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleCall = () => {
    if (post?.phone_number) {
      window.location.href = `tel:${post.phone_number}`;
    }
  };

  const isNewPost = (createdAt: string) => {
    return differenceInHours(new Date(), new Date(createdAt)) < 24;
  };

  const getCategoryLabel = (value: string) => {
    return MARKET_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  const getConditionLabel = (value: string) => {
    return MARKET_CONDITIONS.find((c) => c.value === value)?.label || value;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-emerald-500";
      case "like_new":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "fair":
        return "bg-amber-500";
      default:
        return "bg-slate-500";
    }
  };

  const calculatePlatformFee = (price: number) => {
    return Math.round(price * 0.07 * 100) / 100;
  };

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

  if (!post) {
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Navigation />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <ShoppingCart
            className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
          />
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            Post not found
          </p>
          <Button onClick={() => navigate("/market")} className="mt-4">
            Back to Market
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Navigation />

      <main className="pt-16 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/market"
            className={`inline-flex items-center gap-2 mb-6 ${
              isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Market
          </Link>

          <div
            className={`rounded-2xl overflow-hidden ${
              isDark
                ? "bg-slate-900/80 border border-slate-800 backdrop-blur-xl"
                : "bg-white/80 border border-slate-200 backdrop-blur-xl shadow-lg"
            }`}
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative">
                {post.images && post.images.length > 0 ? (
                  <div>
                    <div
                      className="relative h-80 md:h-full cursor-pointer"
                      onClick={() => setSelectedImage(post.images[0])}
                    >
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      {post.is_sold && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <div className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-xl flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            SOLD
                          </div>
                        </div>
                      )}
                    </div>
                    {post.images.length > 1 && (
                      <div className="flex gap-2 p-4 overflow-x-auto">
                        {post.images.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`${post.title} ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => setSelectedImage(img)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-80 md:h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <ShoppingCart className="w-24 h-24 text-white/50" />
                  </div>
                )}

                {isNewPost(post.created_at) && !post.is_sold && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-emerald-500 text-white border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      New
                    </Badge>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge
                      className={`${getConditionColor(post.condition)} text-white border-0 mb-2`}
                    >
                      {getConditionLabel(post.condition)}
                    </Badge>
                    <h1
                      className={`text-2xl md:text-3xl font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {post.title}
                    </h1>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-500">
                      ¥{post.price.toLocaleString()}
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {post.currency}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge
                    variant="secondary"
                    className={isDark ? "bg-slate-800" : "bg-slate-100"}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {getCategoryLabel(post.category)}
                  </Badge>
                  {post.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={
                        isDark ? "border-slate-700" : "border-slate-300"
                      }
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div
                  className={`prose max-w-none mb-6 ${isDark ? "prose-invert" : ""}`}
                >
                  <p
                    className={`whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {post.description}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-4 mb-6 text-sm ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {post.like_count || 0} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.comment_count || 0} comments
                  </span>
                </div>

                <div
                  className={`flex items-center gap-3 mb-6 p-4 rounded-xl ${
                    isDark ? "bg-slate-800/50" : "bg-slate-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDark ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  >
                    {post.user_avatar ? (
                      <img
                        src={post.user_avatar}
                        alt={post.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User
                        className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      />
                    )}
                  </div>
                  <div>
                    <div
                      className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {post.user_name || "Anonymous"}
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>

                {!post.is_sold && (
                  <div className="space-y-3">
                    {/* Debug: isAuthenticated={isAuthenticated ? 'true' : 'false'}, isOwner={isOwner ? 'true' : 'false'} */}
                    {post.phone_number && isAuthenticated && (
                      <Button
                        onClick={handleCall}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Seller
                      </Button>
                    )}

                    {isAuthenticated && !isOwner && (
                      <Button
                        onClick={() =>
                          navigate(`/market/chat?postId=${post.id}`)
                        }
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with Seller
                      </Button>
                    )}

                    {!isAuthenticated && (
                      <Button
                        onClick={() =>
                          navigate("/login", {
                            state: { from: `/market/${post.id}` },
                          })
                        }
                        variant="outline"
                        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Login to Chat with Seller
                      </Button>
                    )}

                    <Button
                      onClick={() => setShowBuyRequest(true)}
                      variant="outline"
                      className={`w-full ${
                        isDark
                          ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                          : "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Buy via Trusted Admin (+7% fee)
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={handleLike}
                        className={isDark ? "border-slate-700" : ""}
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                        />
                        {isLiked ? "Liked" : "Like"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className={isDark ? "border-slate-700" : ""}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>

                    {isOwner && (
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <Link to={`/market/edit/${post.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          onClick={handleMarkAsSold}
                          variant="outline"
                          className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Sold
                        </Button>
                        <Button
                          onClick={handleDelete}
                          variant="outline"
                          className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {post.reference_links && post.reference_links.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3
                      className={`text-sm font-semibold mb-3 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Reference Links
                    </h3>
                    <div className="space-y-2">
                      {post.reference_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 text-sm hover:underline ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`mt-4 rounded-2xl p-6 ${
              isDark
                ? "bg-slate-900/80 border border-slate-800 backdrop-blur-xl"
                : "bg-white/80 border border-slate-200 backdrop-blur-xl shadow-lg"
            }`}
          >
            <h2
              className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Comments ({comments.length})
            </h2>

            {isAuthenticated && !post.is_sold && (
              <div className="flex gap-3 mb-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className={`flex-1 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                  rows={2}
                />
                <Button
                  onClick={handleComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div
                className={`text-center py-3 mb-4 rounded-lg ${
                  isDark ? "bg-slate-800/50" : "bg-slate-100"
                }`}
              >
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                  <Link
                    to="/login"
                    className="text-emerald-500 hover:underline"
                  >
                    Login
                  </Link>{" "}
                  to comment
                </p>
              </div>
            )}

            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-6">
                  <MessageCircle
                    className={`w-10 h-10 mx-auto mb-2 ${
                      isDark ? "text-slate-700" : "text-slate-300"
                    }`}
                  />
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isDark={isDark}
                    isAuthenticated={isAuthenticated}
                    isSubmitting={isSubmitting}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    onReply={handleReply}
                    onCancelReply={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    onSetReplyingTo={setReplyingTo}
                    onReplyContentChange={setReplyContent}
                    onDelete={handleDeleteComment}
                    currentUserId={user?.id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}

      {showBuyRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowBuyRequest(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <h3
                className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Buy via Trusted Admin
              </h3>
            </div>

            <p
              className={`mb-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              A 7% platform fee will be added for secure transaction handling by
              our admin team.
            </p>

            <div
              className={`p-4 rounded-xl mb-4 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <div className="flex justify-between mb-2">
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Item Price:
                </span>
                <span className={isDark ? "text-white" : "text-slate-900"}>
                  ¥{post.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Platform Fee (7%):
                </span>
                <span className="text-emerald-500">
                  ¥{calculatePlatformFee(post.price).toLocaleString()}
                </span>
              </div>
              <div
                className={`flex justify-between pt-2 border-t ${
                  isDark ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <span
                  className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Total:
                </span>
                <span className="font-bold text-emerald-500">
                  ¥
                  {(
                    post.price + calculatePlatformFee(post.price)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBuyRequest(false)}
                className={`flex-1 ${isDark ? "border-slate-700" : ""}`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBuyRequest}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <DollarSign className="w-4 h-4 mr-2" />
                )}
                Request Purchase
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
