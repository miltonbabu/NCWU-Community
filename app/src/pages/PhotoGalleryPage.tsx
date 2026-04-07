import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { galleryApi } from "@/lib/api";
import type { Post } from "@/types/social";
import {
  Camera,
  Heart,
  MessageCircle,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Trash2,
  MapPin,
  Tag,
  Loader2,
  Image as ImageIcon,
  Plus,
  Search,
  Grid3X3,
  LayoutGrid,
  Clock,
  Upload,
  User,
  Eye,
  Sparkles,
  ImagePlus,
  Pin,
  Edit,
  Home,
  Users,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { getImageAspectRatio, getMasonryHeightClass } from "@/lib/utils";

interface GalleryPost extends Omit<Post, "user_id"> {
  author_name?: string;
  author_avatar?: string | null;
  author_department?: string | null;
  user_id?: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  comments?: { author_name?: string; author_avatar?: string | null; content: string }[];
}

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

// Helper to safely parse JSON fields that might be strings or arrays
const safeParseArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
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

export default function PhotoGalleryPage() {
  const { isAuthenticated, user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GalleryPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (tagFilter) filters.tag = tagFilter;
      const res = await galleryApi.getPosts(1, 50, filters);
      console.log("Gallery API response:", res.data);
      let loadedPosts: GalleryPost[] = [];
      if (res?.data?.success && res?.data?.data?.posts) {
        loadedPosts = res.data.data.posts || [];
      } else if (res?.data?.posts) {
        loadedPosts = res.data.posts || [];
      }
      setPosts(loadedPosts);

      // Load aspect ratios for all posts
      const ratios: Record<string, number> = {};
      for (const post of loadedPosts) {
        const images = safeParseArray(post.images);
        if (images[0]) {
          try {
            ratios[post.id] = await getImageAspectRatio(images[0]);
          } catch {
            ratios[post.id] = 1; // Default to square
          }
        }
      }
      setAspectRatios(ratios);
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
    setLoading(false);
  }, [searchQuery, tagFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle post query param from homepage
  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId && posts.length > 0) {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        openPost(post);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, posts]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [imagePreviews]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imagePreviews.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    const newPreviews: ImagePreview[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (imagePreviews.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    const newPreviews: ImagePreview[] = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleCreatePost = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (imagePreviews.length === 0) {
      toast.error("At least one image is required");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please login to create a post");
      return;
    }

    try {
      setSubmitting(true);
      setUploading(true);
      setUploadProgress(0);

      console.log("Uploading images...", imagePreviews);

      // Upload images with progress simulation
      const formData = new FormData();
      imagePreviews.forEach((preview) => {
        formData.append("images", preview.file);
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadRes = await galleryApi.uploadImages(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log("Upload response:", uploadRes);

      if (!uploadRes?.success) {
        throw new Error(uploadRes?.message || "Image upload failed");
      }

      const imageUrls =
        uploadRes.data?.images || uploadRes.data?.urls || uploadRes.urls || [];
      console.log("Image URLs:", imageUrls);

      if (imageUrls.length === 0) {
        throw new Error("No image URLs returned from upload");
      }

      // Store uploaded URLs for preview
      setUploadedImageUrls(imageUrls);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      console.log("Creating post with images:", imageUrls);
      await galleryApi.createPost({
        content: description || title,
        images: imageUrls,
        title: title.trim(),
        location: location.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        post_type: "gallery",
        visibility: "public",
      });

      toast.success("Post created successfully!");
      resetForm();
      setCreateOpen(false);
      loadPosts();
    } catch (err: any) {
      console.error("Failed to create post:", err);
      toast.error(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setTagsInput("");
    imagePreviews.forEach((item) => URL.revokeObjectURL(item.preview));
    setImagePreviews([]);
    setUploadedImageUrls([]);
  };

  const openPost = (post: GalleryPost) => {
    setSelectedPost(post);
    setCurrentImageIndex(0);
    if (post.comments) {
      setComments(post.comments);
    }
  };

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
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
              ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1) }
              : p,
          ),
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  likes_count: Math.max(0, (prev.likes_count || 1) - 1),
                }
              : null,
          );
        }
      } else {
        await galleryApi.likePost(postId);
        setLikedPosts((prev) => new Set([...prev, postId]));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likes_count: (p.likes_count || 0) + 1 }
              : p,
          ),
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) =>
            prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null,
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      toast.error("Failed to update like");
    } finally {
      setLikingId(null);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }

    try {
      setSubmittingComment(true);
      const res = await galleryApi.addComment(selectedPost.id, {
        content: commentInput.trim(),
      });

      if (res.success) {
        toast.success("Comment added");
        setCommentInput("");

        // Refresh post to get updated comments
        const postRes = await galleryApi.getPost(selectedPost.id);
        if (postRes.success && postRes.data) {
          setSelectedPost(postRes.data);
          setPosts((prev) =>
            prev.map((p) => (p.id === selectedPost.id ? postRes.data! : p)),
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

  const handleDeletePost = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await galleryApi.deletePost(postId);
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error("Failed to delete post");
    }
  };

  const openEditDialog = (post: GalleryPost) => {
    const tags = safeParseArray(post.tags);
    const images = safeParseArray(post.images);
    setEditingPost(post);
    setEditTitle(post.title || "");
    setEditDescription(post.content || "");
    setEditLocation(post.location || "");
    setEditTags(tags.join(", "));
    setEditExistingImages(images);
    setEditNewImages([]);
    setEditNewPreviews([]);
    setEditOpen(true);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (editExistingImages.length + editNewImages.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
    setEditNewImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setEditNewPreviews((prev) => [...prev, url]);
    });
  };

  const removeEditExistingImage = (index: number) => {
    setEditExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeEditNewImage = (index: number) => {
    setEditNewImages((prev) => prev.filter((_, i) => i !== index));
    setEditNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleEditPost = async () => {
    if (!editingPost) return;
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (editExistingImages.length + editNewImages.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    try {
      setEditSubmitting(true);
      setEditUploading(true);

      let newImageUrls: string[] = [];
      if (editNewImages.length > 0) {
        const uploadRes = await galleryApi.uploadImages(editNewImages);
        console.log("Edit upload response:", uploadRes);
        if (!uploadRes?.success) {
          throw new Error(uploadRes?.message || "Image upload failed");
        }
        newImageUrls =
          uploadRes.data?.images ||
          uploadRes.data?.urls ||
          uploadRes.urls ||
          [];
        console.log("New image URLs:", newImageUrls);
      }

      setEditUploading(false);

      const allImages = [...editExistingImages, ...newImageUrls];
      const tags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      console.log("Updating post with data:", {
        id: editingPost.id,
        content: editDescription.trim(),
        title: editTitle.trim(),
        location: editLocation.trim(),
        tags,
        images: allImages,
      });

      await galleryApi.updatePost(editingPost.id, {
        content: editDescription.trim(),
        title: editTitle.trim(),
        location: editLocation.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        images: allImages,
      });

      toast.success("Post updated successfully");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? {
                ...p,
                title: editTitle.trim(),
                content: editDescription.trim(),
                location: editLocation.trim(),
                tags: tags,
                images: allImages,
              }
            : p,
        ),
      );

      if (selectedPost?.id === editingPost.id) {
        setSelectedPost({
          ...selectedPost,
          title: editTitle.trim(),
          content: editDescription.trim(),
          location: editLocation.trim(),
          tags: tags,
          images: allImages,
        });
      }

      setEditOpen(false);
      setEditingPost(null);
      editNewPreviews.forEach((url) => URL.revokeObjectURL(url));
    } catch (err) {
      console.error("Failed to update post:", err);
      toast.error("Failed to update post");
    } finally {
      setEditSubmitting(false);
      setEditUploading(false);
    }
  };

  const handleShare = async (post: GalleryPost, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Photo Gallery Post",
          text: post.content || "",
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          fallbackCopyLink(post);
        }
      }
    } else {
      fallbackCopyLink(post);
    }
  };

  const fallbackCopyLink = (post: GalleryPost) => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const nextImage = () => {
    const images = safeParseArray(selectedPost?.images);
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    const images = safeParseArray(selectedPost?.images);
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPost) return;
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") setSelectedPost(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPost]);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      !tagFilter ||
      (() => {
        const tags = safeParseArray(post.tags);
        return tags.some((tag) =>
          tag.toLowerCase().includes(tagFilter.toLowerCase()),
        );
      })();

    return matchesSearch && matchesTag;
  });

  // Sort posts: pinned first, then by date
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });

  // Get all unique tags for suggestions
  const allTags = Array.from(
    new Set(posts.flatMap((post) => safeParseArray(post.tags))),
  ).slice(0, 10);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-300 ${
          isDark
            ? "bg-gray-900/80 border-gray-800/50"
            : "bg-white/80 border-gray-200/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isDark
                    ? "bg-gradient-to-br from-blue-600 to-purple-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-500"
                } shadow-lg shadow-blue-500/25`}
              >
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Photo Gallery
                </h1>
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Share your moments with the community
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`ml-2 ${
                  isDark
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {posts.length} photos
              </Badge>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                to="/social"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </Link>
              <Link
                to="/market"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Market</span>
              </Link>
            </div>

            {/* Create Post Button */}
            {isAuthenticated && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    className={`gap-2 shadow-lg transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-900/25"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-blue-500/25"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-blue-500" />
                      Create New Post
                    </DialogTitle>
                    <DialogDescription>
                      Share your photos with the community
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    {/* Image Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                        isDark
                          ? "border-gray-600 hover:border-blue-500 bg-gray-800/50 hover:bg-gray-800"
                          : "border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          isDark ? "bg-gray-700" : "bg-gray-200"
                        }`}
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">
                        Drag & drop images here, or click to select
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Up to 10 images (JPG, PNG, GIF)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Uploading...</span>
                          <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <div
                          className={`h-2 rounded-full overflow-hidden ${
                            isDark ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Uploaded Images Preview (Cloudinary URLs) */}
                    {uploadedImageUrls.length > 0 && !uploading && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Images uploaded successfully!
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {uploadedImageUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500/50"
                            >
                              <img
                                src={url}
                                alt={`Uploaded ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <div className="bg-green-500 rounded-full p-1">
                                  <Plus className="h-3 w-3 text-white rotate-45" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image Previews (Local) */}
                    {imagePreviews.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Selected Images</p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {imagePreviews.map((preview) => (
                            <div
                              key={preview.id}
                              className="relative group aspect-square"
                            >
                              <img
                                src={preview.preview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(preview.id);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Give your post a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        className={isDark ? "bg-gray-800 border-gray-700" : ""}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Tell us about your photos..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className={isDark ? "bg-gray-800 border-gray-700" : ""}
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Location
                      </label>
                      <Input
                        placeholder="Where was this taken?"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        maxLength={200}
                        className={isDark ? "bg-gray-800 border-gray-700" : ""}
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        Tags
                      </label>
                      <Input
                        placeholder="nature, travel, sunset... (comma separated)"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className={isDark ? "bg-gray-800 border-gray-700" : ""}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      className={`w-full gap-2 ${
                        isDark
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      }`}
                      onClick={handleCreatePost}
                      disabled={
                        uploading ||
                        submitting ||
                        !title.trim() ||
                        imagePreviews.length === 0
                      }
                    >
                      {uploading || submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploading ? "Uploading..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Publish Post
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${
                  isDark ? "bg-gray-800/50 border-gray-700" : "bg-white"
                }`}
              />
            </div>
            <div className="relative sm:w-64">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by tag..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className={`pl-10 ${
                  isDark ? "bg-gray-800/50 border-gray-700" : "bg-white"
                }`}
              />
            </div>
            {/* View Mode Toggle */}
            <div
              className={`flex items-center gap-1 p-1 rounded-lg ${
                isDark ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("masonry")}
                className={`gap-2 ${
                  viewMode === "masonry"
                    ? isDark
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Masonry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`gap-2 ${
                  viewMode === "grid"
                    ? isDark
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </Button>
            </div>
          </div>

          {/* Popular Tags */}
          {allTags.length > 0 && !searchQuery && !tagFilter && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"} py-1`}
              >
                Popular:
              </span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <div className="absolute inset-0 h-12 w-12 animate-pulse bg-blue-500/20 rounded-full blur-xl" />
            </div>
            <span className="mt-4 text-lg text-gray-500">
              Loading gallery...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                isDark ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              {isAuthenticated
                ? "Be the first to share your photos with the community!"
                : "Sign in to start sharing your memories with others."}
            </p>
            {!isAuthenticated && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => (window.location.href = "/login")}
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && posts.length > 0 && sortedPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                isDark ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setTagFilter("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Masonry Layout */}
        {!loading && sortedPosts.length > 0 && viewMode === "masonry" && (
          <div
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
            style={{ columnFill: "balance" }}
          >
            {sortedPosts.map((post, index) => {
              const images = safeParseArray(post.images);
              const coverImage = images[0];
              const authorName = post.author_name || "Anonymous";
              // Use actual image aspect ratio for masonry effect
              const aspectRatio = aspectRatios[post.id] || 1;
              const aspectClass = getMasonryHeightClass(aspectRatio);

              return (
                <Card
                  key={post.id}
                  className={`break-inside-avoid cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
                    isDark
                      ? "bg-gray-900 border-gray-800 hover:border-gray-700"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => openPost(post)}
                >
                  {/* Cover Image with Hover Overlay */}
                  <div
                    className={`relative ${aspectClass} overflow-hidden bg-gray-200`}
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={post.title || "Gallery image"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Title & Stats */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2">
                          {post.title || "Untitled"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Image count badge */}
                    {images.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 bg-black/60 text-white border-0"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {images.length}
                      </Badge>
                    )}

                    {/* Pinned badge - always visible */}
                    {post.is_pinned && (
                      <Badge className="absolute bottom-2 left-2 bg-amber-500 text-white border-0 gap-1 z-10">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </Badge>
                    )}

                    {/* Action buttons on hover */}
                    <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`p-2 rounded-full transition-colors ${
                          likedPosts.has(post.id)
                            ? "bg-red-500 text-white"
                            : "bg-black/50 text-white hover:bg-black/70"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleShare(post, e)}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 ring-2 ring-offset-1 ring-offset-background ring-gray-200 dark:ring-gray-700">
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {authorName[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {authorName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(post.created_at || "")}
                      </span>
                    </div>

                    {/* Tags Preview */}
                    {(() => {
                      const tags = safeParseArray(post.tags);
                      return tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`text-xs ${
                                isDark
                                  ? "border-gray-700 text-gray-400"
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{tags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Grid Layout */}
        {!loading && filteredPosts.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPosts.map((post) => {
              const images = safeParseArray(post.images);
              const coverImage = images[0];
              const authorName = post.author_name || "Anonymous";

              return (
                <Card
                  key={post.id}
                  className={`cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
                    isDark
                      ? "bg-gray-900 border-gray-800 hover:border-gray-700"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => openPost(post)}
                >
                  {/* Cover Image with Hover Overlay */}
                  <div className="relative aspect-square overflow-hidden bg-gray-200">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={post.title || "Gallery image"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2">
                          {post.title || "Untitled"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Image count badge */}
                    {images.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 bg-black/60 text-white border-0"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {images.length}
                      </Badge>
                    )}

                    {/* Pinned badge - always visible */}
                    {post.is_pinned && (
                      <Badge className="absolute bottom-2 left-2 bg-amber-500 text-white border-0 gap-1 z-10">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </Badge>
                    )}

                    {/* Action buttons on hover */}
                    <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`p-2 rounded-full transition-colors ${
                          likedPosts.has(post.id)
                            ? "bg-red-500 text-white"
                            : "bg-black/50 text-white hover:bg-black/70"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleShare(post, e)}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 ring-2 ring-offset-1 ring-offset-background ring-gray-200 dark:ring-gray-700">
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {authorName[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {authorName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(post.created_at || "")}
                      </span>
                    </div>

                    {(() => {
                      const tags = safeParseArray(post.tags);
                      return tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`text-xs ${
                                isDark
                                  ? "border-gray-700 text-gray-400"
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {tags.length > 2 && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isDark
                                  ? "border-gray-700 text-gray-400"
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              +{tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Post Detail Dialog */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => {
          if (!open) setSelectedPost(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0">
          {selectedPost &&
            (() => {
              const selectedImages = safeParseArray(selectedPost.images);
              const selectedTags = safeParseArray(selectedPost.tags);
              return (
                <div className="flex flex-col lg:flex-row max-h-[85vh]">
                  {/* Image Carousel Section */}
                  <div className="lg:w-2/3 relative bg-black flex items-center justify-center min-h-[40vh] lg:min-h-[85vh] max-h-[50vh] lg:max-h-[85vh]">
                    {selectedImages.length > 0 ? (
                      <>
                        <img
                          src={selectedImages[currentImageIndex]}
                          alt={`${selectedPost.title} - Image ${currentImageIndex + 1}`}
                          className="max-w-full max-h-[50vh] lg:max-h-[85vh] object-contain"
                        />

                        {/* Navigation Arrows */}
                        {selectedImages.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                prevImage();
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nextImage();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>

                            {/* Image Counter */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                              {currentImageIndex + 1} / {selectedImages.length}
                            </div>

                            {/* Thumbnail Strip */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[80%] overflow-x-auto pb-2">
                              {selectedImages.map((img, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(idx);
                                  }}
                                  className={`flex-shrink-0 w-10 h-10 rounded overflow-hidden border-2 transition-all ${
                                    idx === currentImageIndex
                                      ? "border-blue-500"
                                      : "border-transparent opacity-60 hover:opacity-100"
                                  }`}
                                >
                                  <img
                                    src={img}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-24 w-24 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="lg:w-1/3 flex flex-col max-h-[45vh] lg:max-h-[85vh] overflow-y-auto">
                    <div className="p-4 space-y-3 flex-1">
                      {/* Header with close button */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h2 className="text-xl font-bold mb-2">
                            {selectedPost.title || "Gallery Post"}
                          </h2>
                          {selectedPost.content && (
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm">
                              {selectedPost.content}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPost(null)}
                          className="flex-shrink-0"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Author Info */}
                      <div className="flex items-center gap-3 pb-3 border-b dark:border-gray-800">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={selectedPost.author_avatar || undefined}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {(selectedPost.author_name ||
                              "U")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {selectedPost.author_name || "Anonymous"}
                            </p>
                            {selectedPost.is_pinned && (
                              <Badge className="bg-amber-500 text-white border-0 gap-1 text-xs">
                                <Pin className="h-3 w-3" />
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(selectedPost.created_at || "")}
                          </p>
                        </div>
                      </div>

                      {/* Location & Tags */}
                      <div className="space-y-2">
                        {selectedPost.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedPost.location}</span>
                          </div>
                        )}
                        {selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                onClick={() => {
                                  setTagFilter(tag);
                                  setSelectedPost(null);
                                }}
                              >
                                <Tag className="w-3 h-3" /> {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center gap-3 py-3 border-y dark:border-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-2 ${
                            likedPosts.has(selectedPost.id)
                              ? "text-red-500"
                              : ""
                          }`}
                          onClick={() => handleLike(selectedPost.id)}
                          disabled={likingId === selectedPost.id}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              likedPosts.has(selectedPost.id)
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          <span>{selectedPost.likes_count || 0}</span>
                          {likingId === selectedPost.id && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleShare(selectedPost)}
                        >
                          <Share2 className="h-5 w-5" />
                          Share
                        </Button>

                        <div className="flex items-center gap-1 text-gray-500 ml-auto text-sm">
                          <MessageCircle className="h-4 w-4" />
                          <span>{selectedPost.comments_count || 0}</span>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="space-y-3 flex-1">
                        <h3 className="font-semibold">Comments</h3>

                        {/* Comment Input */}
                        {isAuthenticated && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Write a comment..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              className={`flex-1 ${
                                isDark ? "bg-gray-800 border-gray-700" : ""
                              }`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment();
                                }
                              }}
                            />
                            <Button
                              onClick={handleAddComment}
                              disabled={
                                !commentInput.trim() || submittingComment
                              }
                              size="icon"
                            >
                              {submittingComment ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="max-h-[15vh] overflow-y-auto space-y-3 pr-2">
                          {comments && comments.length > 0 ? (
                            comments.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage
                                    src={comment.author_avatar || undefined}
                                  />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                    {(comment.author_name ||
                                      "U")[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-medium text-sm">
                                      {comment.author_name || "Anonymous"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(comment.created_at || "")}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1 break-words">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500 py-4 text-sm">
                              No comments yet. Be the first!
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Edit & Delete Buttons (Author Only) */}
                      {user && selectedPost.user_id === user.id && (
                        <div className="pt-3 border-t dark:border-gray-800 flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => {
                              setSelectedPost(null);
                              openEditDialog(selectedPost);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 gap-2"
                            onClick={() => handleDeletePost(selectedPost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-500" />
              Edit Post
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit your gallery post details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter post title"
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your photos..."
                rows={3}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Where was this taken?"
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="travel, nature, friends (comma separated)"
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate tags with commas
              </p>
            </div>

            {/* Images Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Images * ({editExistingImages.length + editNewImages.length}/10)
              </label>

              {/* Existing Images */}
              {editExistingImages.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Current images</p>
                  <div className="grid grid-cols-5 gap-2">
                    {editExistingImages.map((img, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative group"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditExistingImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images to Add */}
              {editNewPreviews.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">
                    New images to add
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {editNewPreviews.map((img, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative group"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditNewImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Images Button */}
              {editExistingImages.length + editNewImages.length < 10 && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={editFileInputRef}
                    onChange={handleEditImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Plus className="w-4 h-4" />
                    Add Photos
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-background pt-4 border-t mt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={handleEditPost}
                  disabled={
                    editSubmitting ||
                    !editTitle.trim() ||
                    editExistingImages.length + editNewImages.length === 0
                  }
                >
                  {editUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : editSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
