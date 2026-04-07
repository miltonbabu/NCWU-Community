import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { adminApi, adminSocialApi, adminDeletedContentApi } from "@/lib/api";
import type { Post } from "@/types/social";
import { Link } from "react-router-dom";
import {
  Camera,
  Image,
  Pin,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Heart,
  MessageCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Home,
  Grid3X3,
  Plus,
  Upload,
  Tag,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface GalleryPost extends Post {
  author_name: string | null;
  author_student_id: string | null;
}

function parseArrayField(field: unknown): string[] {
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AdminPhotoGalleryPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] =
    useState<GalleryPost | null>(null);
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newPostImageFiles, setNewPostImageFiles] = useState<File[]>([]);
  const [newPostTags, setNewPostTags] = useState<string[]>([]);
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState("public");
  const [newPostIsPinned, setNewPostIsPinned] = useState(false);
  const [newPostIsEmergency, setNewPostIsEmergency] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const PAGE_SIZE = 15;

  const loadPosts = useCallback(
    async (page = currentPage) => {
      try {
        setLoading(page === 1 && !refreshing);
        const res = await adminApi.getGalleryPosts(
          page,
          searchQuery ? { search: searchQuery } : undefined,
        );
        if (res?.data?.success || res?.data?.posts) {
          setPosts(res.data.posts || []);
          setTotalCount(res.data.pagination?.total || 0);
          const total = res.data.pagination?.total || 0;
          setTotalPages(Math.ceil(total / PAGE_SIZE));
        }
      } catch {}
      setLoading(false);
      setRefreshing(false);
    },
    [currentPage, searchQuery, refreshing],
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts(currentPage);
  };

  const handlePinToggle = async (post: GalleryPost) => {
    try {
      setActionLoadingId(post.id);
      const result = await adminSocialApi.pinPost(post.id);
      console.log("Pin result:", result);

      if (result.success) {
        const newPinnedState = result.data?.is_pinned ?? !post.is_pinned;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, is_pinned: newPinnedState } : p,
          ),
        );
        toast.success(newPinnedState ? "Post pinned" : "Post unpinned");
      } else {
        throw new Error(result.message || "Failed to update pin status");
      }
    } catch (error) {
      console.error("Pin error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update pin status",
      );
    }
    setActionLoadingId(null);
  };

  const handleHardDelete = async () => {
    if (!deleteConfirmPost) return;
    try {
      setActionLoadingId(deleteConfirmPost.id);

      console.log("Deleting post:", deleteConfirmPost.id);
      const deleteResult = await adminDeletedContentApi.hardDeletePost(
        deleteConfirmPost.id,
      );
      console.log("Delete result:", deleteResult);

      if (!deleteResult.success) {
        throw new Error(deleteResult.message || "Failed to delete post");
      }

      toast.success("Post deleted permanently");
      setPosts((prev) => prev.filter((p) => p.id !== deleteConfirmPost.id));
      setDeleteConfirmPost(null);
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete post",
      );
    }
    setActionLoadingId(null);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Post content is required");
      return;
    }

    try {
      setIsCreatingPost(true);

      // Upload images first if there are any
      let uploadedImageUrls = [...newPostImages];
      if (newPostImageFiles.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        newPostImageFiles.forEach((file) => {
          formData.append("images", file);
        });

        const uploadResult = await adminApi.uploadImages(formData);
        if (uploadResult.success && uploadResult.urls) {
          uploadedImageUrls = [...newPostImages, ...uploadResult.urls];
        } else {
          throw new Error("Failed to upload images");
        }
        setUploadingImages(false);
      }

      const result = await adminApi.createPost({
        content: newPostContent,
        title: newPostTitle || undefined,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        tags: newPostTags.length > 0 ? newPostTags : undefined,
        visibility: newPostVisibility,
        is_pinned: newPostIsPinned,
        is_emergency: newPostIsEmergency,
        location: newPostLocation || undefined,
        post_type: "gallery",
      });

      if (result.success) {
        toast.success("Post created successfully");
        setShowCreatePostDialog(false);
        setNewPostContent("");
        setNewPostTitle("");
        setNewPostImages([]);
        setNewPostImageFiles([]);
        setNewPostTags([]);
        setNewPostLocation("");
        setNewPostVisibility("public");
        setNewPostIsPinned(false);
        setNewPostIsEmergency(false);
        loadPosts(1);
      } else {
        throw new Error(result.message || "Failed to create post");
      }
    } catch (error) {
      console.error("Create post error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create post",
      );
      setUploadingImages(false);
    }
    setIsCreatingPost(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 6 images total
    const remainingSlots = 6 - newPostImageFiles.length;
    const selectedFiles = files.slice(0, remainingSlots);

    // Create previews
    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setNewPostImageFiles((prev) => [...prev, ...selectedFiles]);
    setNewPostImages((prev) => [...prev, ...previews]);
  };

  const handleRemoveImage = (index: number) => {
    setNewPostImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPostImages((prev) => prev.filter((_, i) => i !== index));
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const stats = {
    total: totalCount,
    today: posts.filter(
      (p) =>
        new Date(p.created_at).toDateString() === new Date().toDateString(),
    ).length,
    pinned: posts.filter((p) => p.is_pinned).length,
    totalLikes: posts.reduce((sum, p) => sum + (p.like_count || 0), 0),
  };

  return (
    <AdminGuard>
      <div
        className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-gray-50"}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 mb-6 sticky top-0 z-10 backdrop-blur-lg py-2 bg-inherit">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Photo Gallery Management</h1>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Manage all photo gallery posts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreatePostDialog(true)}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className={`gap-2 ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
              >
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className={`gap-2 ${isDark ? "border-slate-700 hover:bg-slate-800" : ""}`}
              >
                <Link to="/gallery">
                  <Grid3X3 className="w-4 h-4" />
                  Gallery
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Posts",
                value: stats.total,
                icon: Image,
                gradient: "from-blue-600 to-blue-400",
                color: "text-blue-400",
              },
              {
                label: "Today's Posts",
                value: stats.today,
                icon: Camera,
                gradient: "from-emerald-600 to-emerald-400",
                color: "text-emerald-400",
              },
              {
                label: "Pinned Posts",
                value: stats.pinned,
                icon: Pin,
                gradient: "from-amber-600 to-amber-400",
                color: "text-amber-400",
              },
              {
                label: "Total Likes",
                value: stats.totalLikes,
                icon: Heart,
                gradient: "from-rose-600 to-rose-400",
                color: "text-rose-400",
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                className={`${isDark ? "bg-slate-800/50 border-slate-700" : ""}`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient}`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card
            className={`${isDark ? "bg-slate-800/50 border-slate-700" : ""} mb-6`}
          >
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, content, or author..."
                  className="pl-9"
                />
              </div>
              <span
                className={`text-sm shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {stats.total} results
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : posts.length === 0 ? (
            <Card
              className={`${isDark ? "bg-slate-800/50 border-slate-700" : ""}`}
            >
              <CardContent className="py-16 text-center">
                <Image
                  className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                />
                <h3
                  className={`font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  No gallery posts found
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No photo gallery posts have been created yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className={`w-full ${isDark ? "text-white" : ""}`}>
                  <thead>
                    <tr
                      className={`border-b ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}
                    >
                      <th className="text-left py-3 px-3 text-xs font-medium uppercase">
                        Preview
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium uppercase">
                        Title
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium uppercase">
                        Author
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium uppercase">
                        Date
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-medium uppercase">
                        ❤️
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-medium uppercase">
                        💬
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-medium uppercase">
                        Status
                      </th>
                      <th className="text-right py-3 px-3 text-xs font-medium uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className={`border-b transition-colors ${
                          isDark
                            ? "border-slate-700/50 hover:bg-slate-800/30"
                            : "border-slate-100 hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 px-3">
                          {(() => {
                            const images = parseArrayField(post.images);
                            return images.length > 0 ? (
                              <img
                                src={images[0]}
                                alt=""
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                              >
                                <Image className="w-5 h-5 text-slate-400" />
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3">
                          <p
                            className={`font-medium text-sm truncate max-w-[180px] ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {post.title ||
                              post.content?.substring(0, 40) ||
                              "Untitled"}
                          </p>
                          {(() => {
                            const images = parseArrayField(post.images);
                            return images.length > 1 ? (
                              <Badge
                                variant="secondary"
                                className="mt-0.5 text-[10px] px-1.5 py-0"
                              >
                                +{images.length - 1} more
                              </Badge>
                            ) : null;
                          })()}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {(post.author_name || "?")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p
                                className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {post.author_name || "Unknown"}
                              </p>
                              <p
                                className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                {post.author_student_id || ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          className={`py-3 px-3 text-sm whitespace-nowrap ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="secondary" className="gap-1">
                            <Heart className="w-3 h-3" /> {post.like_count || 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="secondary" className="gap-1">
                            <MessageCircle className="w-3 h-3" />{" "}
                            {post.comment_count || 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {post.is_pinned ? (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1">
                              <Pin className="w-3 h-3" /> Pinned
                            </Badge>
                          ) : (
                            <span
                              className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              --
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className={`w-44 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                            >
                              <DropdownMenuItem
                                onClick={() => setSelectedPost(post)}
                                className={`gap-2 ${isDark ? "text-slate-300 focus:bg-slate-700" : ""}`}
                              >
                                <Eye className="w-4 h-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePinToggle(post)}
                                disabled={actionLoadingId === post.id}
                                className={`gap-2 ${isDark ? "text-slate-300 focus:bg-slate-700" : ""}`}
                              >
                                {actionLoadingId === post.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Pin className="w-4 h-4" />
                                )}
                                {post.is_pinned ? "Unpin Post" : "Pin Post"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator
                                className={isDark ? "bg-slate-700" : ""}
                              />
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmPost(post)}
                                className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                                Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {posts.map((post) => {
                  const postImages = parseArrayField(post.images);
                  return (
                    <Card
                      key={post.id}
                      className={`${isDark ? "bg-slate-800/50 border-slate-700" : ""}`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {postImages.length > 0 ? (
                          <img
                            src={postImages[0]}
                            alt=""
                            className="w-14 h-14 object-cover rounded-lg shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                          >
                            <Image className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {post.title ||
                              post.content?.substring(0, 30) ||
                              "Untitled"}
                          </p>
                          <p
                            className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {post.author_name || "Unknown"} ·{" "}
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-0.5"
                            >
                              <Heart className="w-3 h-3" />
                              {post.like_count || 0}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-0.5"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {post.comment_count || 0}
                            </Badge>
                            {post.is_pinned && (
                              <Badge className="text-[10px] bg-amber-500/10 text-amber-500">
                                Pinned
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className={`w-44 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                          >
                            <DropdownMenuItem
                              onClick={() => setSelectedPost(post)}
                              className={`gap-2 ${isDark ? "text-slate-300 focus:bg-slate-700" : ""}`}
                            >
                              <Eye className="w-4 h-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePinToggle(post)}
                              disabled={actionLoadingId === post.id}
                              className={`gap-2 ${isDark ? "text-slate-300 focus:bg-slate-700" : ""}`}
                            >
                              {actionLoadingId === post.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Pin className="w-4 h-4" />
                              )}
                              {post.is_pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator
                              className={isDark ? "bg-slate-700" : ""}
                            />
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmPost(post)}
                              className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div
                  className="flex items-center justify-center gap-2 mt-6 pt-4 border-t"
                  style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        className="w-8 h-8 hidden sm:flex"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <span
                    className={`text-sm hidden sm:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          <Dialog
            open={!!selectedPost}
            onOpenChange={(open) => !open && setSelectedPost(null)}
          >
            <DialogContent
              className={`${isDark ? "bg-slate-800 border-slate-700" : ""} max-w-lg`}
            >
              <DialogHeader>
                <DialogTitle>Gallery Post Details</DialogTitle>
              </DialogHeader>
              {selectedPost && (
                <div className="space-y-4">
                  {(() => {
                    const images = parseArrayField(selectedPost.images);
                    return images.length > 0 ? (
                      <>
                        <img
                          src={images[0]}
                          alt={selectedPost.title || ""}
                          className="w-full max-h-[350px] object-cover rounded-lg"
                        />
                        {images.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.slice(1).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                className="w-16 h-16 object-cover rounded-lg cursor-pointer opacity-70 hover:opacity-100 transition-opacity shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : null;
                  })()}
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {selectedPost.title || "Untitled"}
                    </h3>
                    {selectedPost.content &&
                      selectedPost.content !== selectedPost.title && (
                        <p
                          className={`text-sm mt-1 whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {selectedPost.content}
                        </p>
                      )}
                  </div>
                  <div
                    className={`grid grid-cols-2 gap-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide block mb-0.5 text-slate-500">
                        Author
                      </span>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {(selectedPost.author_name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedPost.author_name || "Unknown"}</span>
                      </div>
                      {selectedPost.author_student_id && (
                        <span className="text-xs text-slate-500 ml-8">
                          ID: {selectedPost.author_student_id}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide block mb-0.5 text-slate-500">
                        Posted
                      </span>
                      <p>
                        {new Date(selectedPost.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedPost.location && (
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide block mb-0.5 text-slate-500">
                          Location
                        </span>
                        <p>{selectedPost.location}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide block mb-0.5 text-slate-500">
                        Engagement
                      </span>
                      <div className="flex gap-3">
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart className="w-3.5 h-3.5" />
                          {selectedPost.like_count || 0}
                        </span>
                        <span className="flex items-center gap-1 text-blue-500">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {selectedPost.comment_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const tags = parseArrayField(selectedPost.tags);
                    return tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  {selectedPost.is_pinned && (
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 self-start">
                      <Pin className="w-3 h-3" /> Pinned Post
                    </Badge>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!deleteConfirmPost}
            onOpenChange={(open) => !open && setDeleteConfirmPost(null)}
          >
            <DialogContent
              className={`${isDark ? "bg-slate-800 border-slate-700" : ""} max-w-md`}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" /> Permanently Delete Post?
                </DialogTitle>
                <DialogDescription
                  className={isDark ? "text-slate-400" : "text-slate-600"}
                >
                  This action cannot be undone. The post and all its data will
                  be permanently removed.
                </DialogDescription>
              </DialogHeader>
              {deleteConfirmPost && (
                <div
                  className={`rounded-lg p-3 space-y-1 ${isDark ? "bg-slate-700/30" : "bg-red-50"}`}
                >
                  <p
                    className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {deleteConfirmPost.title ||
                      deleteConfirmPost.content?.substring(0, 60) ||
                      "Untitled"}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    By {deleteConfirmPost.author_name || "Unknown"} ·{" "}
                    {new Date(
                      deleteConfirmPost.created_at,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmPost(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleHardDelete}
                  disabled={actionLoadingId === deleteConfirmPost?.id}
                  className="gap-2"
                >
                  {actionLoadingId === deleteConfirmPost?.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Permanently Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Post Dialog */}
          <Dialog
            open={showCreatePostDialog}
            onOpenChange={setShowCreatePostDialog}
          >
            <DialogContent
              className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-900 border-slate-800" : ""}`}
            >
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Create a new post as an admin. This post will appear in the
                  social feed and gallery.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label
                    className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Title (Optional)
                  </label>
                  <Input
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Enter post title..."
                    className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  />
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Content *
                  </label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    className={`w-full px-3 py-2 rounded-md border ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                  />
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Photos (up to 6)
                  </label>
                  <div className="space-y-2">
                    {/* Image Previews */}
                    {newPostImages.length > 0 && (
                      <div className="grid grid-cols-6 gap-2">
                        {newPostImages.map((preview, index) => (
                          <div
                            key={index}
                            className="relative group aspect-square"
                          >
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    {newPostImages.length < 6 && (
                      <label
                        className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          isDark
                            ? "border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <Upload
                          className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        />
                        <span
                          className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {newPostImages.length === 0
                            ? "Click to upload photos"
                            : `Add ${6 - newPostImages.length} more photo${6 - newPostImages.length > 1 ? "s" : ""}`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}

                    {uploadingImages && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading images...
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Visibility
                  </label>
                  <select
                    value={newPostVisibility}
                    onChange={(e) => setNewPostVisibility(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md border ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                  >
                    <option value="public">Public</option>
                    <option value="students">Students Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Tags (comma-separated)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="news, announcement, event"
                      onChange={(e) =>
                        setNewPostTags(
                          e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        )
                      }
                      className={isDark ? "bg-slate-800 border-slate-700" : ""}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Location (Optional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={newPostLocation}
                      onChange={(e) => setNewPostLocation(e.target.value)}
                      placeholder="Add location..."
                      className={`flex-1 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPostIsPinned}
                      onChange={(e) => setNewPostIsPinned(e.target.checked)}
                      className="rounded"
                    />
                    <span
                      className={`text-sm ${isDark ? "text-slate-300" : ""}`}
                    >
                      Pin to top
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPostIsEmergency}
                      onChange={(e) => setNewPostIsEmergency(e.target.checked)}
                      className="rounded"
                    />
                    <span
                      className={`text-sm ${isDark ? "text-slate-300" : ""}`}
                    >
                      Mark as emergency
                    </span>
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreatePostDialog(false)}
                  disabled={isCreatingPost}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={isCreatingPost || !newPostContent.trim()}
                  className="gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {isCreatingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Create Post
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminGuard>
  );
}
