import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useRTL } from "@/hooks/useRTL";
import { useAuth } from "@/contexts/AuthContext";
import { useRestriction } from "@/hooks/useRestriction";
import { socialApi, uploadApi } from "@/lib/api";
import { RestrictionPopup } from "@/components/RestrictionPopup";
import type {
  Post,
  Comment,
  CreatePostData,
  CreateCommentData,
  PostVisibility,
  AnonymityLevel,
} from "@/types/social";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Pin,
  Lock,
  AlertTriangle,
  Globe,
  Users,
  GraduationCap,
  User,
  UserCircle,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Loader2,
  Image,
  Smile,
  MapPin,
  Tag,
  MoreHorizontal,
  Zap,
  Plus,
  Calendar,
  Award,
  Hash,
  Navigation as NavigationIcon,
  EyeOff,
  VolumeX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SocialCommentItem } from "@/components/SocialCommentItem";

function SocialFeedContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  useRTL();
  const { user, isAuthenticated } = useAuth();
  const { isRestricted, restriction, restrictedFeatures, checkFeature } =
    useRestriction();
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [restrictionFeature, setRestrictionFeature] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);

  const checkRestrictionAndShow = useCallback(
    (feature: string): boolean => {
      if (isRestricted && checkFeature(feature)) {
        setRestrictionFeature(feature);
        setShowRestrictionPopup(true);
        return true;
      }
      return false;
    },
    [isRestricted, checkFeature],
  );
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [prefillContent, setPrefillContent] = useState<string>("");
  const [prefillHeading, setPrefillHeading] = useState<string>("");
  const [searchTag, setSearchTag] = useState<string | null>(null);
  const [showTagSearch, setShowTagSearch] = useState(false);
  const [tagPosts, setTagPosts] = useState<Post[]>([]);
  const [isLoadingTag, setIsLoadingTag] = useState(false);
  const [tagPage, setTagPage] = useState(1);
  const [hasMoreTag, setHasMoreTag] = useState(false);
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("hiddenPosts");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("mutedUsers");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const fetchPostsByTag = useCallback(
    async (tag: string, pageNum: number = 1) => {
      setIsLoadingTag(true);
      try {
        const response = await socialApi.getPostsByTag(tag, pageNum, 10);
        if (response.success && response.data) {
          if (pageNum === 1) {
            setTagPosts(response.data.posts);
          } else {
            setTagPosts((prev) => [...prev, ...response.data!.posts]);
          }
          setHasMoreTag(response.data.pagination.hasMore);
        }
      } catch (error) {
        toast.error("Failed to load posts for this tag");
      } finally {
        setIsLoadingTag(false);
      }
    },
    [],
  );

  const handleTagClick = (tag: string) => {
    const cleanTag = tag.replace("#", "").toLowerCase();
    setSearchTag(cleanTag);
    setTagPage(1);
    setTagPosts([]);
    setShowTagSearch(true);
    fetchPostsByTag(cleanTag, 1);
  };

  const parseContentWithHashtags = (content: string) => {
    const hashtagRegex = /#(\w+)/g;
    const parts: { text: string; isHashtag: boolean; tag?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = hashtagRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: content.slice(lastIndex, match.index),
          isHashtag: false,
        });
      }
      parts.push({ text: match[0], isHashtag: true, tag: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), isHashtag: false });
    }

    return parts;
  };

  const fetchPosts = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setIsLoading(true);
        const response = await socialApi.getFeed(pageNum, 10, emergencyOnly);
        if (response.success && response.data) {
          if (reset) {
            setPosts(response.data.posts);
          } else {
            setPosts((prev) => [...prev, ...response.data!.posts]);
          }
          setHasMore(response.data.pagination.hasMore);
        }
      } catch (error) {
        toast.error("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    },
    [emergencyOnly],
  );

  useEffect(() => {
    document.title = "NCWU Community - Social Feed";
    fetchPosts(1, true);

    // Handle navigation from HSK page with pre-filled content
    const state = location.state as {
      createPost?: boolean;
      postContent?: string;
      postHeading?: string;
    } | null;
    if (state?.createPost && state?.postContent) {
      setPrefillContent(state.postContent);
      setPrefillHeading(state.postHeading || "");
      setShowCreatePost(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }

    // Handle share from market page via URL params
    const shareParam = searchParams.get("share");
    const headingParam = searchParams.get("heading");
    const contentParam = searchParams.get("content");
    const imagesParam = searchParams.get("images");

    if (shareParam === "true" && contentParam) {
      setPrefillContent(decodeURIComponent(contentParam));
      setPrefillHeading(headingParam ? decodeURIComponent(headingParam) : "");
      if (imagesParam) {
        try {
          const images = JSON.parse(decodeURIComponent(imagesParam));
          // Store images for the create post dialog to use
          (window as any).__shareImages = images;
        } catch (e) {
          // Ignore parse errors
        }
      }
      setShowCreatePost(true);
      // Clear the URL params
      searchParams.delete("share");
      searchParams.delete("heading");
      searchParams.delete("content");
      searchParams.delete("images");
      setSearchParams(searchParams);
    }
  }, [emergencyOnly, location.state, searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(1, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId) {
      const scrollToPost = () => {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
          postElement.classList.add("ring-2", "ring-blue-500");
          setTimeout(() => {
            postElement.classList.remove("ring-2", "ring-blue-500");
          }, 3000);
          setSearchParams({});
        }
      };

      if (posts.length > 0) {
        const post = posts.find((p) => p.id === postId);
        if (post) {
          setTimeout(scrollToPost, 100);
        } else {
          socialApi.getPost(postId).then((response) => {
            if (response.success && response.data) {
              setPosts((prev) => [response.data!, ...prev]);
              setTimeout(scrollToPost, 200);
            }
          });
        }
      }
    }
  }, [searchParams, posts]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowCreatePost(false);
    toast.success("Post created successfully!");
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
  };

  const handlePostDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const response = await socialApi.deletePost(postId);
    if (response.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted successfully!");
    } else {
      toast.error(response.message || "Failed to delete post");
    }
  };

  const handleHidePost = (postId: string) => {
    const newHiddenPosts = new Set(hiddenPosts).add(postId);
    setHiddenPosts(newHiddenPosts);
    localStorage.setItem("hiddenPosts", JSON.stringify([...newHiddenPosts]));
    toast.success("Post hidden from your feed");
  };

  const handleMuteUser = (userId: string, userName: string) => {
    const newMutedUsers = new Set(mutedUsers).add(userId);
    setMutedUsers(newMutedUsers);
    localStorage.setItem("mutedUsers", JSON.stringify([...newMutedUsers]));
    toast.success(`You won't see posts from ${userName} anymore`);
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }
    const response = await socialApi.likePost(postId);
    if (response.success && response.data) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              is_liked: response.data!.liked,
              like_count: response.data!.liked
                ? p.like_count + 1
                : p.like_count - 1,
            };
          }
          return p;
        }),
      );
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/social?post=${post.id}`;
    const shareText =
      post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "");

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.author?.full_name
            ? `Post by ${post.author.full_name}`
            : "NCWU Community Post",
          text: shareText,
          url: shareUrl,
        });
        if (isAuthenticated) {
          const response = await socialApi.sharePost(post.id);
          if (response.success) {
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id === post.id) {
                  return { ...p, share_count: p.share_count + 1 };
                }
                return p;
              }),
            );
          }
        }
        toast.success("Post shared!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.log("Share failed or cancelled");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
        if (isAuthenticated) {
          const response = await socialApi.sharePost(post.id);
          if (response.success) {
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id === post.id) {
                  return { ...p, share_count: p.share_count + 1 };
                }
                return p;
              }),
            );
          }
        }
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const openComments = (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
    incrementViewCount(post.id);
  };

  const incrementViewCount = async (postId: string) => {
    try {
      await socialApi.incrementView(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, view_count: (p.view_count || 0) + 1 } : p,
        ),
      );
    } catch {
      // Silent fail - don't disrupt user experience
    }
  };

  const handlePostImageClick = (_post: Post, _imageUrl: string) => {
    incrementViewCount(_post.id);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setShowEditDialog(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
    setShowEditDialog(false);
    setEditingPost(null);
    toast.success("Post updated successfully!");
  };

  const stats = {
    emergencyPosts: posts.filter((p) => p.is_emergency).length,
    pinnedPosts: posts.filter((p) => p.is_pinned).length,
  };

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
      }`}
    >
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6 pt-16">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Community Feed
                </h1>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Connect with fellow students and stay updated
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              isDark
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white border border-slate-200 shadow-sm"
            }`}
          >
            <div className="p-1.5 rounded-md bg-gradient-to-br from-red-500/20 to-red-600/20">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Emergency
              </span>
              <span
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {stats.emergencyPosts}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              isDark
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white border border-slate-200 shadow-sm"
            }`}
          >
            <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Pin className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Pinned
              </span>
              <span
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {stats.pinnedPosts}
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <Button
            variant={emergencyOnly ? "destructive" : "outline"}
            size="sm"
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`gap-2 transition-all duration-200 ${
              emergencyOnly
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                : isDark
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {emergencyOnly ? "Show All Posts" : "View Emergency Posts"}
          </Button>

          <Link to="/profile">
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 ${isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <User className="w-4 h-4" />
              My Posts
            </Button>
          </Link>
        </div>

        {isAuthenticated && (
          <FacebookStyleCreatePostButton
            isDark={isDark}
            user={user}
            onClick={() => {
              if (checkRestrictionAndShow("social_post")) return;
              setShowCreatePost(true);
            }}
          />
        )}

        {!isAuthenticated && (
          <Card
            className={`mb-6 overflow-hidden ${
              isDark
                ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700/50"
                : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isDark ? "text-amber-300" : "text-amber-800"
                    }`}
                  >
                    You're viewing in read-only mode
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-amber-400/80" : "text-amber-600"}`}
                  >
                    <Link
                      to="/login"
                      className="underline font-medium hover:text-amber-500"
                    >
                      Login
                    </Link>{" "}
                    to create posts, like, and comment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts
            .filter(
              (post) =>
                !hiddenPosts.has(post.id) && !mutedUsers.has(post.user_id),
            )
            .map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isDark={isDark}
                isAuthenticated={isAuthenticated}
                currentUserId={user?.id}
                onLike={() => handleLike(post.id)}
                onShare={() => handleShare(post)}
                onOpenComments={() => openComments(post)}
                onImageClick={(imageUrl) =>
                  handlePostImageClick(post, imageUrl)
                }
                onEdit={() => handleEditPost(post)}
                onDelete={() => handlePostDelete(post.id)}
                onTagClick={handleTagClick}
                onHidePost={() => handleHidePost(post.id)}
                onMuteUser={handleMuteUser}
              />
            ))}

          {isLoading && (
            <div className="flex justify-center py-8">
              <div
                className={`p-4 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <Card
              className={`overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
            >
              <CardContent className="p-12 text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                >
                  <MessageCircle
                    className={`w-8 h-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  No posts yet
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Be the first to share something with the community!
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && hasMore && posts.length > 0 && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className={`gap-2 transition-all duration-200 ${
                  isDark
                    ? "border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                    : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <Zap className="w-4 h-4" />
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      </main>

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        isDark={isDark}
        user={user}
        onPostCreated={handlePostCreated}
        prefillContent={prefillContent}
        prefillHeading={prefillHeading}
      />

      <CommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        post={selectedPost}
        isDark={isDark}
        isAuthenticated={isAuthenticated}
        currentUserId={user?.id}
        onPostUpdate={handlePostUpdate}
        checkRestrictionAndShow={checkRestrictionAndShow}
      />

      <EditPostDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        isDark={isDark}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />

      <Dialog open={showTagSearch} onOpenChange={setShowTagSearch}>
        <DialogContent
          className={`sm:max-w-2xl max-h-[80vh] ${isDark ? "bg-slate-900 border-slate-700" : ""}`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-500" />
              <span className={isDark ? "text-white" : ""}>#{searchTag}</span>
            </DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : ""}>
              Posts tagged with #{searchTag}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh]">
            {isLoadingTag ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : tagPosts.length === 0 ? (
              <div className="text-center py-8">
                <Hash
                  className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                />
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                  No posts found with this tag
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tagPosts
                  .filter(
                    (post) =>
                      !hiddenPosts.has(post.id) &&
                      !mutedUsers.has(post.user_id),
                  )
                  .map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isDark={isDark}
                      isAuthenticated={isAuthenticated}
                      currentUserId={user?.id}
                      onLike={() => handleLike(post.id)}
                      onShare={() => handleShare(post)}
                      onOpenComments={() => openComments(post)}
                      onImageClick={(imageUrl) =>
                        handlePostImageClick(post, imageUrl)
                      }
                      onEdit={() => handleEditPost(post)}
                      onDelete={() => handlePostDelete(post.id)}
                      onTagClick={handleTagClick}
                      onHidePost={() => handleHidePost(post.id)}
                      onMuteUser={handleMuteUser}
                    />
                  ))}
                {hasMoreTag && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const nextPage = tagPage + 1;
                        setTagPage(nextPage);
                        fetchPostsByTag(searchTag!, nextPage);
                      }}
                      disabled={isLoadingTag}
                      className={
                        isDark ? "border-slate-700 hover:bg-slate-800" : ""
                      }
                    >
                      {isLoadingTag ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <RestrictionPopup
        isOpen={showRestrictionPopup}
        onClose={() => setShowRestrictionPopup(false)}
        restriction={restriction}
        restrictedFeatures={restrictedFeatures}
        isDark={isDark}
      />

      <Footer />
    </div>
  );
}

interface FacebookStyleCreatePostButtonProps {
  isDark: boolean;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    department?: string | null;
    current_year?: number | null;
  } | null;
  onClick: () => void;
}

function FacebookStyleCreatePostButton({
  isDark,
  user,
  onClick,
}: FacebookStyleCreatePostButtonProps) {
  return (
    <div
      className={`mb-6 rounded-xl overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
          : "bg-white border border-slate-200 shadow-sm"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11 ring-2 ring-offset-2 ring-blue-500/30 ring-offset-transparent">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
              {user?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={onClick}
            className={`flex-1 text-left px-4 py-3 rounded-full transition-all duration-200 ${
              isDark
                ? "bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-600"
            }`}
          >
            What's on your mind, {user?.full_name?.split(" ")[0]}?
          </button>
        </div>
      </div>

      <div
        className={`px-4 pb-3 pt-0 border-t ${isDark ? "border-slate-700/50" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 group ${
              isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
            }`}
          >
            <div className="p-1.5 rounded-md bg-gradient-to-br from-green-500/20 to-green-600/20 group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-200">
              <Image className="w-5 h-5 text-green-500" />
            </div>
            <span
              className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Photo
            </span>
          </button>

          <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 group ${
              isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
            }`}
          >
            <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-500/20 to-amber-600/20 group-hover:from-amber-500/30 group-hover:to-amber-600/30 transition-all duration-200">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <span
              className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Event
            </span>
          </button>

          <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 group ${
              isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
            }`}
          >
            <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-200">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <span
              className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Achievement
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    department?: string | null;
    current_year?: number | null;
  } | null;
  onPostCreated: (post: Post) => void;
  prefillContent?: string;
  prefillHeading?: string;
}

function CreatePostDialog({
  open,
  onOpenChange,
  isDark,
  user,
  onPostCreated,
  prefillContent = "",
  prefillHeading = "",
}: CreatePostDialogProps) {
  const [heading, setHeading] = useState(prefillHeading);
  const [content, setContent] = useState(prefillContent);
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [anonymityLevel, setAnonymityLevel] = useState<AnonymityLevel>("full");
  const [isEmergency, setIsEmergency] = useState(false);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feeling, setFeeling] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagsInput, setShowTagsInput] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  // Update content when prefillContent changes (e.g., when opening from HSK page)
  useEffect(() => {
    if (open && prefillContent) {
      setContent(prefillContent);
    }
  }, [open, prefillContent]);

  // Update heading when prefillHeading changes
  useEffect(() => {
    if (open && prefillHeading) {
      setHeading(prefillHeading);
    }
  }, [open, prefillHeading]);

  // Load shared images from market post share
  useEffect(() => {
    if (open && (window as any).__shareImages) {
      const shareImages = (window as any).__shareImages as string[];
      if (shareImages && shareImages.length > 0) {
        setImagePreviews(shareImages.slice(0, 5));
        delete (window as any).__shareImages;
      }
    }
  }, [open]);

  const feelings = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😍", label: "Loved" },
    { emoji: "😎", label: "Cool" },
    { emoji: "🤔", label: "Thinking" },
    { emoji: "😴", label: "Tired" },
    { emoji: "🎉", label: "Celebrating" },
    { emoji: "💪", label: "Motivated" },
    { emoji: "🙏", label: "Grateful" },
    { emoji: "❤️", label: "Love" },
    { emoji: "🔥", label: "Excited" },
    { emoji: "🌟", label: "Proud" },
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error("You can upload up to 5 images");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setSelectedImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (
      !content.trim() &&
      selectedImages.length === 0 &&
      imagePreviews.length === 0
    ) {
      toast.error("Please enter some content or add photos");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];

      // Check if imagePreviews are URLs (from share) or data URLs (from file upload)
      const hasSharedImages =
        imagePreviews.length > 0 && selectedImages.length === 0;

      if (hasSharedImages) {
        // imagePreviews contain URLs from share, use them directly
        uploadedImageUrls = imagePreviews.filter((url) =>
          url.startsWith("http"),
        );
      } else if (selectedImages.length > 0) {
        toast.loading("Uploading images...");

        const response = await uploadApi.uploadPostImages(selectedImages);

        toast.dismiss();

        if (response.success && response.data) {
          uploadedImageUrls = response.data.map(
            (img: { url: string }) => img.url,
          );
        } else {
          toast.error(response.message || "Failed to upload images");
          setIsSubmitting(false);
          return;
        }
      }

      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Combine heading and content if heading exists
      const finalContent = heading.trim()
        ? `${heading.trim()}\n\n${content}`
        : content;

      const data: CreatePostData = {
        content: finalContent,
        images: uploadedImageUrls,
        feeling: feeling || undefined,
        location: location || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        visibility,
        anonymity_level: anonymityLevel,
        is_emergency: isEmergency,
        target_departments:
          visibility === "department" || visibility === "department_year"
            ? targetDepartments
            : undefined,
        target_years:
          visibility === "department_year" ? targetYears : undefined,
      };

      const response = await socialApi.createPost(data);

      if (response.success && response.data) {
        onPostCreated(response.data);
        setContent("");
        setVisibility("public");
        setAnonymityLevel("full");
        setIsEmergency(false);
        setTargetDepartments([]);
        setTargetYears([]);
        setSelectedImages([]);
        setImagePreviews([]);
        setFeeling("");
        setLocation("");
        setTags("");
        setShowFeelingPicker(false);
        setShowLocationInput(false);
        setShowTagsInput(false);
        setLocationError("");
        toast.success("Post created successfully!");
      } else {
        toast.error(response.message || "Failed to create post");
      }
    } catch (error) {
      console.error("Post creation error:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-xl ${isDark ? "bg-slate-900 border-slate-700" : "bg-white"}`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className={isDark ? "text-white" : ""}>Create Post</span>
          </DialogTitle>
          <DialogDescription className={isDark ? "text-slate-400" : ""}>
            Share something with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {user?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {user?.full_name}
                </span>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as PostVisibility)}
                >
                  <SelectTrigger
                    className={`h-7 text-xs w-auto ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="department">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        Department
                      </div>
                    </SelectItem>
                    <SelectItem value="department_year">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3 h-3" />
                        Dept & Year
                      </div>
                    </SelectItem>
                    <SelectItem value="emergency">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Emergency
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Heading Input */}
          <input
            type="text"
            placeholder="Add a heading (optional)..."
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className={`w-full text-xl font-bold border-0 focus-visible:ring-0 mb-2 ${
              isDark
                ? "bg-slate-800 text-white placeholder:text-slate-500"
                : "bg-transparent text-slate-900 placeholder:text-slate-400"
            }`}
          />

          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className={`resize-none text-lg border-0 focus-visible:ring-0 ${
              isDark
                ? "bg-slate-800 text-white placeholder:text-slate-500"
                : "bg-transparent text-slate-900 placeholder:text-slate-400"
            }`}
          />

          {imagePreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`gap-2 ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
            >
              <Image className="w-4 h-4 text-green-500" />
              Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowFeelingPicker(!showFeelingPicker);
                setShowLocationInput(false);
                setShowTagsInput(false);
              }}
              className={`gap-2 ${feeling ? "border-amber-500 bg-amber-500/10" : ""} ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
            >
              <Smile className="w-4 h-4 text-amber-500" />
              {feeling || "Feeling"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowLocationInput(!showLocationInput);
                setShowFeelingPicker(false);
                setShowTagsInput(false);
              }}
              className={`gap-2 ${location ? "border-red-500 bg-red-500/10" : ""} ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
            >
              <MapPin className="w-4 h-4 text-red-500" />
              {location || "Location"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowTagsInput(!showTagsInput);
                setShowFeelingPicker(false);
                setShowLocationInput(false);
              }}
              className={`gap-2 ${tags ? "border-blue-500 bg-blue-500/10" : ""} ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
            >
              <Tag className="w-4 h-4 text-blue-500" />
              {tags ? "Tags" : "Tag"}
            </Button>
          </div>

          {showFeelingPicker && (
            <div
              className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <p
                className={`text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                How are you feeling?
              </p>
              <div className="flex flex-wrap gap-2">
                {feelings.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => {
                      setFeeling(`${f.emoji} Feeling ${f.label}`);
                      setShowFeelingPicker(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      feeling.includes(f.label)
                        ? "bg-amber-500 text-white"
                        : isDark
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                          : "bg-white hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
                {feeling && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeeling("");
                      setShowFeelingPicker(false);
                    }}
                    className="px-3 py-1.5 rounded-full text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}

          {showLocationInput && (
            <div
              className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <p
                className={`text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Where are you?
              </p>

              {/* Current Location Button */}
              <Button
                variant="outline"
                type="button"
                onClick={async () => {
                  setIsGettingLocation(true);
                  setLocationError("");

                  if (!navigator.geolocation) {
                    setLocationError(
                      "Geolocation is not supported by your browser",
                    );
                    setIsGettingLocation(false);
                    return;
                  }

                  try {
                    const position = await new Promise<GeolocationPosition>(
                      (resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                          resolve,
                          reject,
                          {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 0,
                          },
                        );
                      },
                    );

                    const { latitude, longitude } = position.coords;

                    // Try to get a readable address using reverse geocoding
                    // Using BigDataCloud API (free, no CORS issues)
                    try {
                      const response = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                      );

                      if (!response.ok) {
                        throw new Error(
                          `HTTP error! status: ${response.status}`,
                        );
                      }

                      const data = await response.json();

                      if (data) {
                        // Build location name from BigDataCloud response
                        const parts = [];

                        // Add city/locality
                        if (data.city) parts.push(data.city);
                        else if (data.locality) parts.push(data.locality);
                        else if (data.localityInfo?.administrative?.name) {
                          parts.push(data.localityInfo.administrative.name);
                        }

                        // Add province/state
                        if (data.principalSubdivision) {
                          parts.push(data.principalSubdivision);
                        }

                        // Add country
                        if (data.countryName) {
                          parts.push(data.countryName);
                        }

                        // Build final location string
                        let locationName;
                        if (parts.length > 0) {
                          // Remove duplicates and limit to 3 parts
                          const uniqueParts = [...new Set(parts)].slice(0, 3);
                          locationName = uniqueParts.join(", ");
                        } else {
                          locationName = `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
                        }

                        setLocation(`📍 ${locationName}`);
                        toast.success("Location detected!");
                      } else {
                        setLocation(
                          `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                        );
                        toast.success("Location detected!");
                      }
                    } catch (error) {
                      console.error("Geocoding error:", error);
                      // Fallback: try OpenStreetMap as backup
                      try {
                        const osmResponse = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                          { headers: { "Accept-Language": "en" } },
                        );
                        const osmData = await osmResponse.json();

                        if (osmData && osmData.address) {
                          const addr = osmData.address;
                          const city =
                            addr.city ||
                            addr.town ||
                            addr.village ||
                            addr.municipality ||
                            addr.county;
                          const country = addr.country;

                          if (city && country) {
                            setLocation(`📍 ${city}, ${country}`);
                          } else if (city) {
                            setLocation(`📍 ${city}`);
                          } else if (country) {
                            setLocation(`📍 ${country}`);
                          } else {
                            setLocation(
                              `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                            );
                          }
                        } else {
                          setLocation(
                            `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                          );
                        }
                        toast.success("Location detected!");
                      } catch {
                        setLocation(
                          `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                        );
                        toast.success("Location detected!");
                      }
                    }
                  } catch (error) {
                    const err = error as GeolocationPositionError;
                    let errorMsg = "Could not get your location";

                    switch (err.code) {
                      case err.PERMISSION_DENIED:
                        errorMsg =
                          "Location access denied. Please enable location permissions in your browser settings.";
                        break;
                      case err.POSITION_UNAVAILABLE:
                        errorMsg =
                          "Location information unavailable. Please try again or enter manually.";
                        break;
                      case err.TIMEOUT:
                        errorMsg =
                          "Location request timed out. Please try again.";
                        break;
                    }

                    setLocationError(errorMsg);
                    toast.error(errorMsg);
                  } finally {
                    setIsGettingLocation(false);
                  }
                }}
                disabled={isGettingLocation}
                className={`w-full mb-3 gap-2 ${isDark ? "border-slate-600 hover:bg-slate-700" : ""}`}
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <NavigationIcon className="w-4 h-4" />
                )}
                {isGettingLocation
                  ? "Getting location..."
                  : "Use Current Location"}
              </Button>

              {locationError && (
                <div
                  className={`flex items-start gap-2 p-2 rounded-lg mb-3 text-xs ${isDark ? "bg-red-500/20 text-red-300" : "bg-red-50 text-red-600"}`}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`h-px flex-1 ${isDark ? "bg-slate-700" : "bg-slate-300"}`}
                />
                <span
                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  or enter manually
                </span>
                <div
                  className={`h-px flex-1 ${isDark ? "bg-slate-700" : "bg-slate-300"}`}
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={location.replace(/^📍\s*/, "")}
                  onChange={(e) =>
                    setLocation(e.target.value ? `📍 ${e.target.value}` : "")
                  }
                  placeholder="Enter location..."
                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                    isDark
                      ? "bg-slate-700 text-white placeholder:text-slate-400"
                      : "bg-white text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                {location && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setLocation("");
                      setLocationError("");
                    }}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <p
                className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Enable location services on your phone to use current location
              </p>
            </div>
          )}

          {showTagsInput && (
            <div
              className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <p
                className={`text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Add tags (comma separated)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., study, exam, help"
                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                    isDark
                      ? "bg-slate-700 text-white placeholder:text-slate-400"
                      : "bg-white text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                {tags && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setTags("");
                      setShowTagsInput(false);
                    }}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          isDark
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          <div
            className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Post Settings
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`text-xs font-medium mb-2 block ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Identity Display
                </label>
                <Select
                  value={anonymityLevel}
                  onValueChange={(v) => setAnonymityLevel(v as AnonymityLevel)}
                >
                  <SelectTrigger
                    className={isDark ? "bg-slate-700 border-slate-600" : ""}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Identity
                      </div>
                    </SelectItem>
                    <SelectItem value="icon_only">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        Icon Only
                      </div>
                    </SelectItem>
                    <SelectItem value="anonymous">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Anonymous
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isEmergency
                      ? "bg-red-500/20 border border-red-500/50"
                      : isDark
                        ? "bg-slate-700/50 border border-slate-600 hover:border-red-500/30"
                        : "bg-white border border-slate-200 hover:border-red-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="sr-only"
                  />
                  <AlertTriangle
                    className={`w-5 h-5 ${isEmergency ? "text-red-500" : isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <span
                    className={`text-sm font-medium ${isEmergency ? "text-red-500" : isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Emergency Post
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={isDark ? "border-slate-700 hover:bg-slate-800" : ""}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PostCardProps {
  post: Post;
  isDark: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  onLike: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  onImageClick: (imageUrl: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick: (tag: string) => void;
  onHidePost?: () => void;
  onMuteUser?: (userId: string, userName: string) => void;
}

function PostCard({
  post,
  isDark,
  isAuthenticated,
  currentUserId,
  onLike,
  onShare,
  onOpenComments,
  onImageClick,
  onEdit,
  onDelete,
  onTagClick,
  onHidePost,
  onMuteUser,
}: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const imageScrollRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId === post.user_id;
  const truncatedContent =
    post.content.length > 300 && !showFullContent
      ? post.content.substring(0, 300) + "..."
      : post.content;

  const parseContentWithHashtags = (content: string) => {
    const hashtagRegex = /#(\w+)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: {
      text: string;
      isHashtag: boolean;
      isUrl: boolean;
      tag?: string;
      url?: string;
    }[] = [];
    let lastIndex = 0;
    let match;

    // Find all hashtags and URLs
    const tokens: {
      index: number;
      length: number;
      type: "hashtag" | "url";
      value: string;
      tag?: string;
      url?: string;
    }[] = [];

    // Find hashtags
    while ((match = hashtagRegex.exec(content)) !== null) {
      tokens.push({
        index: match.index,
        length: match[0].length,
        type: "hashtag",
        value: match[0],
        tag: match[1],
      });
    }

    // Find URLs
    while ((match = urlRegex.exec(content)) !== null) {
      tokens.push({
        index: match.index,
        length: match[0].length,
        type: "url",
        value: match[0],
        url: match[0],
      });
    }

    // Sort tokens by index
    tokens.sort((a, b) => a.index - b.index);

    // Build parts
    for (const token of tokens) {
      if (token.index > lastIndex) {
        parts.push({
          text: content.slice(lastIndex, token.index),
          isHashtag: false,
          isUrl: false,
        });
      }
      parts.push({
        text: token.value,
        isHashtag: token.type === "hashtag",
        isUrl: token.type === "url",
        tag: token.tag,
        url: token.url,
      });
      lastIndex = token.index + token.length;
    }

    if (lastIndex < content.length) {
      parts.push({
        text: content.slice(lastIndex),
        isHashtag: false,
        isUrl: false,
      });
    }

    return parts.length > 0
      ? parts
      : [{ text: content, isHashtag: false, isUrl: false }];
  };

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case "public":
        return <Globe className="w-3.5 h-3.5" />;
      case "department":
        return <Users className="w-3.5 h-3.5" />;
      case "department_year":
        return <GraduationCap className="w-3.5 h-3.5" />;
      case "emergency":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const getVisibilityLabel = () => {
    switch (post.visibility) {
      case "public":
        return "Public";
      case "department":
        return post.target_departments?.join(", ") || "Department";
      case "department_year":
        return `${post.target_departments?.join(", ")} - ${post.target_years?.join(", ")}`;
      case "emergency":
        return "Emergency";
      default:
        return "Public";
    }
  };

  const checkScrollButtons = useCallback(() => {
    const container = imageScrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1,
    );
  }, []);

  useEffect(() => {
    const container = imageScrollRef.current;
    if (container && post.images && post.images.length > 1) {
      checkScrollButtons();
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [post.images, checkScrollButtons]);

  const scrollImages = (direction: "left" | "right") => {
    const container = imageScrollRef.current;
    if (!container) return;
    const scrollAmount = 220;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <Card
      id={`post-${post.id}`}
      className={`overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-slate-600"
          : "bg-white border-slate-200 shadow-sm hover:shadow-md"
      } ${post.is_pinned ? "ring-2 ring-amber-500/50" : ""} ${
        post.is_emergency ? "ring-2 ring-red-500/50" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {post.author ? (
              <Avatar className="w-11 h-11 ring-2 ring-offset-2 ring-blue-500/20 ring-offset-transparent">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {post.author.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="w-11 h-11 ring-2 ring-offset-2 ring-slate-500/20 ring-offset-transparent">
                <AvatarFallback
                  className={isDark ? "bg-slate-700" : "bg-slate-200"}
                >
                  <User
                    className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {post.author?.full_name || "Anonymous"}
                </span>
                {post.is_pinned && (
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 ${
                      isDark
                        ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                        : "border-amber-300 text-amber-600 bg-amber-50"
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                    Pinned
                  </Badge>
                )}
                {post.is_locked && (
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 ${
                      isDark
                        ? "border-slate-600 text-slate-400 bg-slate-600/10"
                        : "border-slate-300 text-slate-500 bg-slate-50"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Locked
                  </Badge>
                )}
                {post.is_emergency && (
                  <Badge
                    variant="destructive"
                    className="text-xs gap-1 bg-red-500 hover:bg-red-600"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Emergency
                  </Badge>
                )}
                {post.post_type === "gallery" && (
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 ${
                      isDark
                        ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
                        : "border-orange-300 text-orange-600 bg-orange-50"
                    }`}
                  >
                    <Image className="w-3 h-3" />
                    Gallery
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
          {currentUserId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              >
                {!isOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={onHidePost}
                      className={
                        isDark ? "text-slate-200 focus:bg-slate-700" : ""
                      }
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onMuteUser?.(
                          post.user_id,
                          post.author?.full_name || "Unknown",
                        )
                      }
                      className={
                        isDark ? "text-slate-200 focus:bg-slate-700" : ""
                      }
                    >
                      <VolumeX className="w-4 h-4 mr-2" />
                      Mute User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator
                      className={isDark ? "bg-slate-700" : ""}
                    />
                  </>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={onEdit}
                      className={
                        isDark ? "text-slate-200 focus:bg-slate-700" : ""
                      }
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator
                      className={isDark ? "bg-slate-700" : ""}
                    />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {(post.feeling || post.location) && (
          <div className="flex items-center gap-3 mb-2 text-sm">
            {post.feeling && (
              <span className={isDark ? "text-amber-400" : "text-amber-600"}>
                {post.feeling}
              </span>
            )}
            {post.location && (
              <span
                className={`flex items-center gap-1 ${isDark ? "text-red-400" : "text-red-600"}`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {post.location}
              </span>
            )}
          </div>
        )}
        {/* Render Heading + Content */}
        {(() => {
          // Split content by first double newline to separate heading from body
          const parts = truncatedContent.split("\n\n");
          const hasHeading =
            parts.length > 1 &&
            parts[0].length < 200 &&
            !parts[0].includes("http");
          const heading = hasHeading ? parts[0] : null;
          const body = hasHeading
            ? parts.slice(1).join("\n\n")
            : truncatedContent;

          return (
            <div className="space-y-2">
              {heading && (
                <h3
                  className={`text-xl font-bold leading-tight ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {parseContentWithHashtags(heading).map((part, index) => {
                    if (part.isHashtag) {
                      return (
                        <button
                          key={index}
                          onClick={() => onTagClick(part.tag!)}
                          className={`hover:underline ${
                            isDark
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          {part.text}
                        </button>
                      );
                    } else if (part.isUrl) {
                      return (
                        <a
                          key={index}
                          href={part.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline break-all ${
                            isDark
                              ? "text-emerald-400 hover:text-emerald-300"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {part.text}
                        </a>
                      );
                    } else {
                      return <span key={index}>{part.text}</span>;
                    }
                  })}
                </h3>
              )}
              <p
                className={`whitespace-pre-wrap leading-relaxed ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}
              >
                {parseContentWithHashtags(body).map((part, index) => {
                  if (part.isHashtag) {
                    return (
                      <button
                        key={index}
                        onClick={() => onTagClick(part.tag!)}
                        className={`font-medium hover:underline ${
                          isDark
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        {part.text}
                      </button>
                    );
                  } else if (part.isUrl) {
                    return (
                      <a
                        key={index}
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-medium hover:underline break-all ${
                          isDark
                            ? "text-emerald-400 hover:text-emerald-300"
                            : "text-emerald-600 hover:text-emerald-700"
                        }`}
                      >
                        {part.text}
                      </a>
                    );
                  } else {
                    return <span key={index}>{part.text}</span>;
                  }
                })}
              </p>
            </div>
          );
        })()}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag, index) => (
              <button
                key={index}
                onClick={() => onTagClick(tag)}
                className={`px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors ${
                  isDark
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        {post.content.length > 300 && (
          <Button
            variant="link"
            size="sm"
            className={`p-0 h-auto mt-2 ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
            onClick={() => setShowFullContent(!showFullContent)}
          >
            {showFullContent ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Read more
              </>
            )}
          </Button>
        )}

        {post.images &&
          post.images.length > 0 &&
          (post.post_type === "gallery" ? (
            <div className="mt-3">
              {post.images.length === 1 ? (
                <div
                  className="relative rounded-lg overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => {
                    onImageClick(post.images[0]);
                    setLightboxImage(post.images[0]);
                  }}
                >
                  <img
                    src={post.images[0]}
                    alt="Gallery post"
                    className="w-full h-64 sm:h-80 object-contain"
                    loading="lazy"
                  />
                </div>
              ) : post.images.length === 2 ? (
                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                  {post.images.slice(0, 2).map((image, index) => (
                    <div
                      key={index}
                      className="cursor-pointer flex items-center justify-center"
                      onClick={() => {
                        onImageClick(image);
                        setLightboxImage(image);
                      }}
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-48 sm:h-56 object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : post.images.length === 3 ? (
                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                  <div
                    className="cursor-pointer flex items-center justify-center row-span-2"
                    onClick={() => {
                      onImageClick(post.images[0]);
                      setLightboxImage(post.images[0]);
                    }}
                  >
                    <img
                      src={post.images[0]}
                      alt="Gallery 1"
                      className="w-full h-96 sm:h-[28rem] object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="grid grid-rows-2 gap-1">
                    {post.images.slice(1, 3).map((image, index) => (
                      <div
                        key={index + 1}
                        className="cursor-pointer flex items-center justify-center"
                        onClick={() => {
                          onImageClick(image);
                          setLightboxImage(image);
                        }}
                      >
                        <img
                          src={image}
                          alt={`Gallery ${index + 2}`}
                          className="w-full h-48 object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                  {post.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer flex items-center justify-center"
                      onClick={() => {
                        onImageClick(image);
                        setLightboxImage(image);
                      }}
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-48 sm:h-56 object-contain"
                        loading="lazy"
                      />
                      {index === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-3xl font-bold">
                            +{post.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 relative">
              {canScrollLeft && (
                <button
                  onClick={() => scrollImages("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div
                ref={imageScrollRef}
                className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {post.images.slice(0, 5).map((image, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-lg cursor-pointer group flex-shrink-0 snap-start flex items-center justify-center"
                    onClick={() => {
                      onImageClick(image);
                      setLightboxImage(image);
                    }}
                  >
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="h-48 w-auto min-w-[200px] max-w-[300px] object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center rounded-lg">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                ))}
              </div>
              {canScrollRight && (
                <button
                  onClick={() => scrollImages("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
      </CardContent>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size image"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <CardFooter
        className={`pt-3 ${isDark ? "border-t border-slate-700/50" : "border-t border-slate-100"}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-lg transition-all duration-200 ${
                post.is_liked
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  : isDark
                    ? "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                    : "text-slate-500 hover:text-slate-600 hover:bg-slate-50"
              }`}
              onClick={onLike}
              disabled={!isAuthenticated}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-200 hover:scale-110 ${post.is_liked ? "fill-current" : ""}`}
              />
              {post.like_count > 0 && (
                <span className="text-sm font-medium">{post.like_count}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-lg transition-all duration-200 ${
                isDark
                  ? "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                  : "text-slate-500 hover:text-slate-600 hover:bg-slate-50"
              }`}
              onClick={onOpenComments}
            >
              <MessageCircle className="w-5 h-5" />
              {post.comment_count > 0 && (
                <span className="text-sm font-medium">
                  {post.comment_count}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-lg transition-all duration-200 ${
                isDark
                  ? "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                  : "text-slate-500 hover:text-slate-600 hover:bg-slate-50"
              }`}
              onClick={onShare}
            >
              <Share2 className="w-5 h-5" />
              {post.share_count > 0 && (
                <span className="text-sm font-medium">{post.share_count}</span>
              )}
            </Button>
          </div>
          {(post.view_count || 0) > 0 && (
            <div className="flex items-center gap-2">
              {post.is_locked && (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">
                {post.view_count} views
              </span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  post: Post | null;
  onPostUpdated: (post: Post) => void;
}

function EditPostDialog({
  open,
  onOpenChange,
  isDark,
  post,
  onPostUpdated,
}: EditPostDialogProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [anonymityLevel, setAnonymityLevel] = useState<AnonymityLevel>("full");
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setVisibility(post.visibility);
      setIsEmergency(post.is_emergency);
      setImages(post.images || []);
      setNewImages([]);
      setNewImagePreviews([]);
      setLocation(post.location || "");
      setLocationError("");
      setShowLocationInput(false);
      if (post.is_anonymous) {
        setAnonymityLevel("anonymous");
      } else if (!post.show_profile_icon) {
        setAnonymityLevel("icon_only");
      } else {
        setAnonymityLevel("full");
      }
    }
  }, [post]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + newImages.length + files.length;
    if (totalImages > 5) {
      toast.error("You can have up to 5 images total");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setNewImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!post || !content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];

      if (newImages.length > 0) {
        toast.loading("Uploading new images...");

        const response = await uploadApi.uploadPostImages(newImages);

        toast.dismiss();

        if (response.success && response.data) {
          uploadedImageUrls = response.data.map(
            (img: { url: string }) => img.url,
          );
        } else {
          toast.error(response.message || "Failed to upload images");
          setIsSubmitting(false);
          return;
        }
      }

      const allImages = [...images, ...uploadedImageUrls];

      const response = await socialApi.updatePost(post.id, {
        content,
        images: allImages,
        visibility,
        is_emergency: isEmergency,
        anonymity_level: anonymityLevel,
        location: location || undefined,
      });

      if (response.success && response.data) {
        onPostUpdated(response.data);
        toast.success("Post updated successfully!");
      } else {
        toast.error(response.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Post update error:", error);
      toast.error("Failed to update post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-lg ${isDark ? "bg-slate-900 border-slate-700" : ""}`}
      >
        <DialogHeader>
          <DialogTitle
            className={`flex items-center gap-3 ${isDark ? "text-white" : ""}`}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Edit className="w-5 h-5 text-white" />
            </div>
            Edit Post
          </DialogTitle>
          <DialogDescription className={isDark ? "text-slate-400" : ""}>
            Update your post content and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className={
                isDark ? "bg-slate-800 border-slate-700 text-white" : ""
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
              >
                Visibility
              </label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as PostVisibility)}
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="department">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Department Only
                    </div>
                  </SelectItem>
                  <SelectItem value="department_year">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Dept & Year
                    </div>
                  </SelectItem>
                  <SelectItem value="emergency">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Emergency
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
              >
                Identity
              </label>
              <Select
                value={anonymityLevel}
                onValueChange={(v) => setAnonymityLevel(v as AnonymityLevel)}
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Identity
                    </div>
                  </SelectItem>
                  <SelectItem value="icon_only">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      Icon Only
                    </div>
                  </SelectItem>
                  <SelectItem value="anonymous">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Anonymous
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label
              className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
            >
              Photos ({images.length + newImages.length}/5)
            </label>

            {(images.length > 0 || newImagePreviews.length > 0) && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                {images.map((image, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative group flex-shrink-0"
                  >
                    <img
                      src={image}
                      alt={`Existing ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((preview, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative group flex-shrink-0"
                  >
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg ring-2 ring-green-500"
                    />
                    <button
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-500 rounded text-xs text-white">
                      New
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length + newImages.length >= 5}
              className={`gap-2 ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
            >
              <Image className="w-4 h-4 text-green-500" />
              Add Photos
            </Button>
          </div>

          {/* Location Section */}
          <div>
            <label
              className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
            >
              Location
            </label>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowLocationInput(!showLocationInput)}
              className={`gap-2 ${location ? "border-red-500 bg-red-500/10" : ""} ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
            >
              <MapPin className="w-4 h-4 text-red-500" />
              {location ? "Edit Location" : "Add Location"}
            </Button>

            {showLocationInput && (
              <div
                className={`mt-3 p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                {/* Current Location Button */}
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={async () => {
                    setIsGettingLocation(true);
                    setLocationError("");

                    if (!navigator.geolocation) {
                      setLocationError(
                        "Geolocation is not supported by your browser",
                      );
                      setIsGettingLocation(false);
                      return;
                    }

                    try {
                      const position = await new Promise<GeolocationPosition>(
                        (resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(
                            resolve,
                            reject,
                            {
                              enableHighAccuracy: true,
                              timeout: 15000,
                              maximumAge: 0,
                            },
                          );
                        },
                      );

                      const { latitude, longitude } = position.coords;

                      // Try to get a readable address using reverse geocoding
                      // Using BigDataCloud API (free, no CORS issues)
                      try {
                        const response = await fetch(
                          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                        );

                        if (!response.ok) {
                          throw new Error(
                            `HTTP error! status: ${response.status}`,
                          );
                        }

                        const data = await response.json();

                        if (data) {
                          // Build location name from BigDataCloud response
                          const parts = [];

                          // Add city/locality
                          if (data.city) parts.push(data.city);
                          else if (data.locality) parts.push(data.locality);
                          else if (data.localityInfo?.administrative?.name) {
                            parts.push(data.localityInfo.administrative.name);
                          }

                          // Add province/state
                          if (data.principalSubdivision) {
                            parts.push(data.principalSubdivision);
                          }

                          // Add country
                          if (data.countryName) {
                            parts.push(data.countryName);
                          }

                          // Build final location string
                          let locationName;
                          if (parts.length > 0) {
                            // Remove duplicates and limit to 3 parts
                            const uniqueParts = [...new Set(parts)].slice(0, 3);
                            locationName = uniqueParts.join(", ");
                          } else {
                            locationName = `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
                          }

                          setLocation(`📍 ${locationName}`);
                          toast.success("Location detected!");
                        } else {
                          setLocation(
                            `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                          );
                          toast.success("Location detected!");
                        }
                      } catch (error) {
                        console.error("Geocoding error:", error);
                        // Fallback: try OpenStreetMap as backup
                        try {
                          const osmResponse = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                            { headers: { "Accept-Language": "en" } },
                          );
                          const osmData = await osmResponse.json();

                          if (osmData && osmData.address) {
                            const addr = osmData.address;
                            const city =
                              addr.city ||
                              addr.town ||
                              addr.village ||
                              addr.municipality ||
                              addr.county;
                            const country = addr.country;

                            if (city && country) {
                              setLocation(`📍 ${city}, ${country}`);
                            } else if (city) {
                              setLocation(`📍 ${city}`);
                            } else if (country) {
                              setLocation(`📍 ${country}`);
                            } else {
                              setLocation(
                                `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                              );
                            }
                          } else {
                            setLocation(
                              `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                            );
                          }
                          toast.success("Location detected!");
                        } catch {
                          setLocation(
                            `📍 Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                          );
                          toast.success("Location detected!");
                        }
                      }
                    } catch (error) {
                      const err = error as GeolocationPositionError;
                      let errorMsg = "Could not get your location";

                      switch (err.code) {
                        case err.PERMISSION_DENIED:
                          errorMsg =
                            "Location access denied. Please enable location permissions in your browser settings.";
                          break;
                        case err.POSITION_UNAVAILABLE:
                          errorMsg =
                            "Location information unavailable. Please try again or enter manually.";
                          break;
                        case err.TIMEOUT:
                          errorMsg =
                            "Location request timed out. Please try again.";
                          break;
                      }

                      setLocationError(errorMsg);
                      toast.error(errorMsg);
                    } finally {
                      setIsGettingLocation(false);
                    }
                  }}
                  disabled={isGettingLocation}
                  className={`w-full mb-3 gap-2 ${isDark ? "border-slate-600 hover:bg-slate-700" : ""}`}
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <NavigationIcon className="w-4 h-4" />
                  )}
                  {isGettingLocation
                    ? "Getting location..."
                    : "Use Current Location"}
                </Button>

                {locationError && (
                  <div
                    className={`flex items-start gap-2 p-2 rounded-lg mb-3 text-xs ${isDark ? "bg-red-500/20 text-red-300" : "bg-red-50 text-red-600"}`}
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{locationError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`h-px flex-1 ${isDark ? "bg-slate-700" : "bg-slate-300"}`}
                  />
                  <span
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    or enter manually
                  </span>
                  <div
                    className={`h-px flex-1 ${isDark ? "bg-slate-700" : "bg-slate-300"}`}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location.replace(/^📍\s*/, "")}
                    onChange={(e) =>
                      setLocation(e.target.value ? `📍 ${e.target.value}` : "")
                    }
                    placeholder="Enter location..."
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      isDark
                        ? "bg-slate-700 text-white placeholder:text-slate-400"
                        : "bg-white text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                  {location && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setLocation("");
                        setLocationError("");
                      }}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <p
                  className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Enable location services on your phone to use current location
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-emergency"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="edit-emergency"
              className={`text-sm ${isDark ? "text-slate-300" : ""}`}
            >
              Mark as Emergency/Help Post
            </label>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={isDark ? "border-slate-700 hover:bg-slate-800" : ""}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  isDark: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  onPostUpdate: (post: Post) => void;
  checkRestrictionAndShow: (feature: string) => boolean;
}

function CommentsDialog({
  open,
  onOpenChange,
  post,
  isDark,
  isAuthenticated,
  currentUserId,
  onPostUpdate,
  checkRestrictionAndShow,
}: CommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anonymityLevel, setAnonymityLevel] = useState<AnonymityLevel>("full");
  const loadedPostIdRef = useRef<string | null>(null);

  const fetchComments = useCallback(async (postId: string) => {
    console.log("Fetching comments for post:", postId);
    setIsLoading(true);
    const response = await socialApi.getComments(postId, 1, 1000);
    console.log("Comments response:", response);
    if (response.success && response.data) {
      console.log(
        "Setting comments:",
        response.data.comments.length,
        "comments",
      );
      console.log(
        "Comments data:",
        JSON.stringify(
          response.data.comments.map((c: any) => ({
            id: c.id,
            content: c.content?.substring(0, 20),
            parent_comment_id: c.parent_comment_id,
            repliesCount: c.replies?.length || 0,
            replies: c.replies?.map((r: any) => ({
              id: r.id,
              content: r.content?.substring(0, 20),
              parent_comment_id: r.parent_comment_id,
            })),
          })),
          null,
          2,
        ),
      );
      setComments(response.data.comments);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (open && post) {
      fetchComments(post.id);
    }
  }, [open, post?.id]);

  const handleSubmitComment = async () => {
    if (!post || !newComment.trim()) return;

    if (checkRestrictionAndShow("social_comment")) return;

    setIsSubmitting(true);
    const data: CreateCommentData = {
      content: newComment,
      anonymity_level: anonymityLevel,
    };

    const response = await socialApi.createComment(post.id, data);
    if (response.success) {
      setNewComment("");
      fetchComments(post.id);
      onPostUpdate({
        ...post,
        comment_count: post.comment_count + 1,
      });
      toast.success("Comment posted!");
    }
    setIsSubmitting(false);
  };

  const handleSetReplyingTo = (comment: Comment) => {
    setReplyTo(comment);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyContent("");
  };

  const handleReply = async (parentComment: Comment) => {
    if (!post || !replyContent.trim()) return;

    if (checkRestrictionAndShow("social_comment")) return;

    setIsSubmitting(true);
    const data: CreateCommentData = {
      content: replyContent,
      anonymity_level: anonymityLevel,
      parent_comment_id: parentComment.id,
    };

    console.log("Sending reply:", {
      postId: post.id,
      parentCommentId: parentComment.id,
      data,
    });

    const response = await socialApi.createComment(post.id, data);
    console.log("Reply response:", response);

    if (response.success) {
      setReplyContent("");
      setReplyTo(null);
      console.log("Fetching comments after reply...");
      await fetchComments(post.id);
      console.log("Comments fetched after reply");
      onPostUpdate({
        ...post,
        comment_count: post.comment_count + 1,
      });
      toast.success("Reply posted!");
    }
    setIsSubmitting(false);
  };

  const handleLikeComment = async (comment: Comment) => {
    const response = await socialApi.likeComment(comment.id);
    if (response.success && response.data) {
      fetchComments(post.id);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!confirm("Delete this comment?")) return;
    const response = await socialApi.deleteComment(comment.id);
    if (response.success) {
      fetchComments(post.id);
      if (post) {
        onPostUpdate({
          ...post,
          comment_count: post.comment_count - 1,
        });
      }
      toast.success("Comment deleted");
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-2xl max-h-[80vh] ${isDark ? "bg-slate-900 border-slate-700" : ""}`}
      >
        <DialogHeader>
          <DialogTitle
            className={`flex items-center gap-2 ${isDark ? "text-white" : ""}`}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            Comments
          </DialogTitle>
          <DialogDescription className={isDark ? "text-slate-400" : ""}>
            {post.comment_count} comments on this post
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <SocialCommentItem
                  key={comment.id}
                  comment={comment}
                  isDark={isDark}
                  isAuthenticated={isAuthenticated}
                  isSubmitting={isSubmitting}
                  replyingTo={replyTo}
                  replyContent={replyContent}
                  onReply={handleReply}
                  onCancelReply={handleCancelReply}
                  onSetReplyingTo={handleSetReplyingTo}
                  onReplyContentChange={setReplyContent}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  currentUserId={currentUserId}
                  depth={0}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {isAuthenticated && !post.is_locked && (
          <div
            className={`pt-4 space-y-3 ${isDark ? "border-t border-slate-700" : "border-t"}`}
          >
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className={
                  isDark ? "bg-slate-800 border-slate-700 text-white" : ""
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Select
                value={anonymityLevel}
                onValueChange={(v) => setAnonymityLevel(v as AnonymityLevel)}
              >
                <SelectTrigger
                  className={`w-36 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Identity</SelectItem>
                  <SelectItem value="icon_only">Icon Only</SelectItem>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Comment
              </Button>
            </div>
          </div>
        )}

        {post.is_locked && (
          <div
            className={`pt-4 text-center text-slate-500 text-sm ${isDark ? "border-t border-slate-700" : "border-t"}`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            This post is locked. No new comments allowed.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SocialFeedPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <SocialFeedContent />
    </ThemeProvider>
  );
}
