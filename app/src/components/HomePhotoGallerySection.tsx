import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  ArrowRight,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { galleryApi } from "@/lib/api";
import type { Post } from "@/types/social";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GalleryPost extends Post {
  author_name?: string;
  author_avatar?: string | null;
  comments?: {
    author_name?: string;
    author_avatar?: string | null;
    content: string;
  }[];
}

interface HomePhotoGallerySectionProps {
  isDark: boolean;
}

const safeParseArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const CollageImage = ({
  images,
  _isDark,
}: {
  images: string[];
  _isDark?: boolean;
}) => {
  const count = images.length;

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-800">
        <Camera className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="w-full h-full relative">
        <img
          src={images[0]}
          alt="Gallery"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full">
        <img
          src={images[0]}
          alt="Gallery"
          className="w-full h-full object-cover"
        />
        <img
          src={images[1]}
          alt="Gallery"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full">
        <img
          src={images[0]}
          alt="Gallery"
          className="w-full h-full object-cover col-span-1 row-span-2"
        />
        <div className="grid grid-rows-2 gap-1">
          <img
            src={images[1]}
            alt="Gallery"
            className="w-full h-full object-cover"
          />
          <img
            src={images[2]}
            alt="Gallery"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 w-full h-full relative">
      <img
        src={images[0]}
        alt="Gallery"
        className="w-full h-full object-cover"
      />
      <img
        src={images[1]}
        alt="Gallery"
        className="w-full h-full object-cover"
      />
      <img
        src={images[2]}
        alt="Gallery"
        className="w-full h-full object-cover"
      />
      <div className="relative">
        <img
          src={images[3]}
          alt="Gallery"
          className="w-full h-full object-cover"
        />
        {count > 4 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">+{count - 4}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function HomePhotoGallerySection({
  isDark,
}: HomePhotoGallerySectionProps) {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] =
    useState<GalleryPost | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await galleryApi.getPosts(1, 2);
        console.log("Homepage gallery response:", res?.data);
        const postsData = res?.data?.data?.posts || res?.data?.posts || [];
        setPosts(postsData.slice(0, 2));
      } catch (err) {
        console.error("Failed to load gallery posts:", err);
      }
      setLoading(false);
    };
    loadPosts();
  }, []);

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      setLikingId(postId);
      const isLiked = likedPosts.has(postId);

      if (isLiked) {
        await galleryApi.unlikePost(postId);
        setLikedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? { ...p, likes_count: Math.max(0, ((p as any).likes_count || 1) - 1) }
              : p,
          ),
        );
      } else {
        await galleryApi.likePost(postId);
        setLikedPosts((prev) => new Set([...prev, postId]));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, like_count: (p.like_count || 0) + 1 } : p,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      toast.error("Failed to update like");
    } finally {
      setLikingId(null);
    }
  };

  const handleOpenComment = (post: GalleryPost, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setSelectedPostForComment(post);
    setComments(post.comments || []);
    setCommentDialogOpen(true);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedPostForComment) return;
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }

    try {
      setSubmittingComment(true);
      const res = await galleryApi.addComment(
        selectedPostForComment.id,
        commentInput.trim(),
      );

      if (res.success) {
        toast.success("Comment added");
        setCommentInput("");

        // Refresh post to get updated comments
        const postRes = await galleryApi.getPost(selectedPostForComment.id);
        if (postRes.success && postRes.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSelectedPostForComment(postRes.data as any as GalleryPost);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setComments((postRes.data as any as GalleryPost).comments || []);
          setPosts((prev) =>
            prev.map((p) =>
              p.id === selectedPostForComment.id
                ? { ...p, comments_count: ((p as any).comments_count || 0) + 1 }
                : p,
            ),
          );
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`rounded-2xl p-8 ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}
      >
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className={`rounded-2xl p-8 ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}
      >
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-4 text-orange-400" />
          <h3
            className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Photo Gallery
          </h3>
          <p
            className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Share your moments with the community
          </p>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            <Camera className="w-4 h-4" />
            View Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${isDark ? "bg-orange-500/20" : "bg-orange-100"}`}
          >
            <Camera className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Photo Gallery
            </h2>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Latest moments from our community
            </p>
          </div>
        </div>
        <Link
          to="/gallery"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDark
              ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
              : "bg-orange-100 text-orange-600 hover:bg-orange-200"
          }`}
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {posts.map((post) => {
          const images = safeParseArray(post.images);
          const isLiked = likedPosts.has(post.id);

          return (
            <div
              key={post.id}
              className={`group overflow-hidden rounded-2xl ${
                isDark ? "bg-slate-800" : "bg-white"
              } shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
            >
              <Link to={`/gallery?post=${post.id}`} className="block">
                <div className="relative h-64 sm:h-72 lg:h-80 overflow-hidden">
                  <CollageImage images={images} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {images.length}
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4 sm:p-5">
                <Link to={`/gallery?post=${post.id}`} className="block">
                  <h3
                    className={`font-semibold text-lg mb-1.5 line-clamp-2 hover:text-orange-500 transition-colors ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {post.title || "Untitled"}
                  </h3>
                  {post.content && (
                    <p
                      className={`text-sm mb-3 line-clamp-2 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {post.content}
                    </p>
                  )}
                </Link>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isDark ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    by {post.author_name || "Anonymous"}
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      disabled={likingId === post.id}
                      className={`flex items-center gap-1.5 text-sm transition-all ${
                        isLiked
                          ? "text-red-500"
                          : isDark
                            ? "text-slate-400 hover:text-slate-300"
                            : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {likingId === post.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart
                          className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                        />
                      )}
                      {(post as any).likes_count || post.like_count || 0}
                    </button>
                    <button
                      onClick={(e) => handleOpenComment(post, e)}
                      className={`flex items-center gap-1.5 text-sm transition-all ${
                        isDark
                          ? "text-slate-400 hover:text-slate-300"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {(post as any).comments_count || post.comment_count || 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/30"
        >
          <Camera className="w-5 h-5" />
          Share Your Photos
        </Link>
      </div>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent
          className={`sm:max-w-md ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-slate-900"}>
              Comments
            </DialogTitle>
            <DialogDescription
              className={isDark ? "text-slate-400" : "text-slate-600"}
            >
              {selectedPostForComment?.title || "View and add comments"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[300px] pr-2">
            {comments.length === 0 ? (
              <div
                className={`text-center py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                No comments yet. Be the first!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author_avatar || ""} />
                      <AvatarFallback
                        className={isDark ? "bg-slate-700" : "bg-slate-200"}
                      >
                        {(comment.author_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {comment.author_name || "Anonymous"}
                      </p>
                      <p
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {isAuthenticated && (
            <div className="flex gap-2 mt-4">
              <Input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className={
                  isDark
                    ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    : ""
                }
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentInput.trim() || submittingComment}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
