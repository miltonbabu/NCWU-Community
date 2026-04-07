import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi, uploadApi } from "@/lib/api";
import type {
  Post,
  CreatePostData,
  PostVisibility,
  AnonymityLevel,
} from "@/types/social";
import {
  Heart,
  MessageCircle,
  Send,
  Globe,
  Users,
  GraduationCap,
  AlertTriangle,
  User,
  UserCircle,
  Eye,
  Clock,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  Pin,
  Lock,
  Image,
  Smile,
  MapPin,
  Tag,
  X,
  Navigation,
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

interface SocialFeedSectionProps {
  isDark: boolean;
}

export function SocialFeedSection({ isDark }: SocialFeedSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadPosts = async () => {
      const response = await socialApi.getFeed(1, 5);
      if (response.success && response.data) {
        setPosts(response.data.posts);
      }
      setIsLoading(false);
    };
    loadPosts();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowPostComposer(false);
    toast.success("Post created successfully!");
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const response = await socialApi.deletePost(postId);
    if (response.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted successfully!");
    }
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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-3 h-3" />;
      case "department":
        return <Users className="w-3 h-3" />;
      case "department_year":
        return <GraduationCap className="w-3 h-3" />;
      case "emergency":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getVisibilityLabel = (post: Post) => {
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className={`text-2xl sm:text-3xl font-bold chinese-gradient-text`}
          >
            Community Feed
          </h2>
          <p
            className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Connect with fellow students and stay updated
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated && (
            <Button onClick={() => setShowPostComposer(true)} size="sm">
              <Send className="w-4 h-4 mr-2" />
              New Post
            </Button>
          )}
          <Link to="/social">
            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {!isAuthenticated && (
        <Card
          className={`mb-4 ${
            isDark
              ? "bg-amber-900/20 border-amber-700"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-600"}`}
              />
              <p
                className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}
              >
                <Link to="/login" className="underline font-medium">
                  Login
                </Link>{" "}
                to create posts, like, and comment
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : posts.length === 0 ? (
        <Card
          className={
            isDark
              ? "bg-slate-800/50 border-slate-700"
              : "bg-white border-slate-200"
          }
        >
          <CardContent className="p-8 text-center">
            <MessageCircle
              className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
            />
            <h3
              className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
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
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className={`w-full cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isDark
                  ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800/70"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              } ${post.is_pinned ? "ring-2 ring-blue-500" : ""} ${
                post.is_emergency ? "ring-2 ring-red-500" : ""
              }`}
              onClick={() => {
                navigate(`/social?post=${post.id}`);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {post.author ? (
                      <Avatar className="w-9 h-9">
                        <AvatarImage
                          src={post.author.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {post.author.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="w-9 h-9">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {post.author?.full_name || "Anonymous"}
                        </span>
                        {post.is_pinned && (
                          <Badge variant="secondary" className="text-xs py-0">
                            <Pin className="w-2 h-2 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {post.is_emergency && (
                          <Badge variant="destructive" className="text-xs py-0">
                            <AlertTriangle className="w-2 h-2 mr-1" />
                            Emergency
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {getVisibilityIcon(post.visibility)}
                          {getVisibilityLabel(post)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {post.user_id === user?.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(post);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                {(post.feeling || post.location) && (
                  <div className="flex items-center gap-3 mb-2 text-xs">
                    {post.feeling && (
                      <span
                        className={isDark ? "text-amber-400" : "text-amber-600"}
                      >
                        {post.feeling}
                      </span>
                    )}
                    {post.location && (
                      <span
                        className={`flex items-center gap-1 ${isDark ? "text-red-400" : "text-red-600"}`}
                      >
                        <MapPin className="w-3 h-3" />
                        {post.location}
                      </span>
                    )}
                  </div>
                )}
                <p
                  className={`text-sm whitespace-pre-wrap line-clamp-4 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                >
                  {post.content}
                </p>
                {post.images &&
                  post.images.length > 0 &&
                  (post.post_type === "gallery" ? (
                    <div className="mt-3">
                      {post.images.length === 1 ? (
                        <div className="relative rounded-lg overflow-hidden flex items-center justify-center">
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
                              className="flex items-center justify-center"
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
                          <div className="flex items-center justify-center row-span-2">
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
                                className="flex items-center justify-center"
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
                              className="relative flex items-center justify-center"
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
                    <div className="mt-3 flex flex-row gap-2 overflow-x-auto pb-2">
                      {post.images.slice(0, 5).map((image, index) => (
                        <div
                          key={index}
                          className={`flex-shrink-0 relative overflow-hidden rounded-lg flex items-center justify-center ${
                            post.images!.length === 1
                              ? "w-full max-w-md"
                              : "w-40 sm:w-48"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-40 sm:h-48 object-contain rounded-lg transition-opacity"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/social?tag=${encodeURIComponent(tag)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors ${
                            isDark
                              ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          #{tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1 h-7 ${
                        post.is_liked
                          ? "text-red-500 hover:text-red-600"
                          : isDark
                            ? "text-slate-400 hover:text-slate-300"
                            : "text-slate-500 hover:text-slate-600"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      disabled={!isAuthenticated}
                    >
                      <Heart
                        className={`w-3 h-3 ${post.is_liked ? "fill-current" : ""}`}
                      />
                      {post.like_count > 0 && (
                        <span className="text-xs">{post.like_count}</span>
                      )}
                    </Button>
                    <Link
                      to={`/social?post=${post.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 h-7 ${
                          isDark
                            ? "text-slate-400 hover:text-slate-300"
                            : "text-slate-500 hover:text-slate-600"
                        }`}
                      >
                        <MessageCircle className="w-3 h-3" />
                        {post.comment_count > 0 && (
                          <span className="text-xs">{post.comment_count}</span>
                        )}
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.is_locked && (
                      <Lock className="w-3 h-3 text-slate-400" />
                    )}
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {post.visibility === "public" ? "Everyone" : "Limited"}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <PostComposerDialog
        open={showPostComposer}
        onOpenChange={setShowPostComposer}
        isDark={isDark}
        onPostCreated={handlePostCreated}
      />

      <EditPostDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        isDark={isDark}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
}

interface PostComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  onPostCreated: (post: Post) => void;
}

function PostComposerDialog({
  open,
  onOpenChange,
  isDark,
  onPostCreated,
}: PostComposerDialogProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [anonymityLevel, setAnonymityLevel] = useState<AnonymityLevel>("full");
  const [isEmergency, setIsEmergency] = useState(false);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feeling, setFeeling] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagsInput, setShowTagsInput] = useState(false);

  const feelings = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😍", label: "Loved" },
    { emoji: "😎", label: "Cool" },
    { emoji: "🤔", label: "Thinking" },
    { emoji: "🎉", label: "Celebrating" },
    { emoji: "💪", label: "Motivated" },
    { emoji: "❤️", label: "Love" },
    { emoji: "🔥", label: "Excited" },
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
    if (!content.trim() && selectedImages.length === 0) {
      toast.error("Please enter some content or add photos");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];

      if (selectedImages.length > 0) {
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

      const data: CreatePostData = {
        content,
        images: uploadedImageUrls,
        feeling: feeling || undefined,
        location: location || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        visibility,
        anonymity_level: anonymityLevel,
        is_emergency: isEmergency,
      };

      if (visibility === "department" || visibility === "department_year") {
        data.target_departments = targetDepartments;
      }
      if (visibility === "department_year") {
        data.target_years = targetYears;
      }

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
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share something with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className={isDark ? "bg-slate-700 border-slate-600" : ""}
          />

          {imagePreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
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
              className={isDark ? "border-slate-700" : ""}
            >
              <Image className="w-4 h-4 text-green-500 mr-1" /> Photo
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
              className={
                feeling
                  ? "border-amber-500 bg-amber-500/10"
                  : isDark
                    ? "border-slate-700"
                    : ""
              }
            >
              <Smile className="w-4 h-4 text-amber-500 mr-1" />{" "}
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
              className={
                location
                  ? "border-red-500 bg-red-500/10"
                  : isDark
                    ? "border-slate-700"
                    : ""
              }
            >
              <MapPin className="w-4 h-4 text-red-500 mr-1" />{" "}
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
              className={
                tags
                  ? "border-blue-500 bg-blue-500/10"
                  : isDark
                    ? "border-slate-700"
                    : ""
              }
            >
              <Tag className="w-4 h-4 text-blue-500 mr-1" /> Tag
            </Button>
          </div>

          {showFeelingPicker && (
            <div
              className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <div className="flex flex-wrap gap-2">
                {feelings.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => {
                      setFeeling(`${f.emoji} Feeling ${f.label}`);
                      setShowFeelingPicker(false);
                    }}
                    className={`px-2 py-1 rounded-full text-xs ${feeling.includes(f.label) ? "bg-amber-500 text-white" : isDark ? "bg-slate-700 text-slate-200" : "bg-white text-slate-700"}`}
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
                    className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-500"
                  >
                    <X className="w-3 h-3 inline mr-1" />
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location..."
                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${isDark ? "bg-slate-700 text-white" : "bg-white text-slate-900"}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={async () => {
                    if (navigator.geolocation) {
                      try {
                        const pos = await new Promise<GeolocationPosition>(
                          (resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(
                              resolve,
                              reject,
                              { enableHighAccuracy: true, timeout: 10000 },
                            );
                          },
                        );
                        setLocation(
                          `📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
                        );
                        toast.success("Location detected!");
                      } catch {
                        toast.error("Could not get location");
                      }
                    } else {
                      toast.error("Geolocation not supported");
                    }
                  }}
                  className={isDark ? "border-slate-600" : ""}
                >
                  <Navigation className="w-4 h-4" />
                </Button>
                {location && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setLocation("")}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {showTagsInput && (
            <div
              className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., study, exam, help (comma separated)"
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? "bg-slate-700 text-white" : "bg-white text-slate-900"}`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Visibility
              </label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as PostVisibility)}
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-700 border-slate-600" : ""}
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
                      Department
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
              <label className="text-sm font-medium mb-2 block">Identity</label>
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
          </div>

          {(visibility === "department" ||
            visibility === "department_year") && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Departments
              </label>
              <Select
                value={targetDepartments[0] || ""}
                onValueChange={(v) => setTargetDepartments([v])}
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-700 border-slate-600" : ""}
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CST">Computer Science</SelectItem>
                  <SelectItem value="Economics">Economics</SelectItem>
                  <SelectItem value="Civil">Civil Engineering</SelectItem>
                  <SelectItem value="Electrical">
                    Electrical Engineering
                  </SelectItem>
                  <SelectItem value="Mechanical">
                    Mechanical Engineering
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {visibility === "department_year" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Years
              </label>
              <Select
                value={targetYears[0]?.toString() || ""}
                onValueChange={(v) => setTargetYears([parseInt(v)])}
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-700 border-slate-600" : ""}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emergency"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="emergency" className="text-sm">
              Mark as Emergency/Help Post
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={isDark ? "border-slate-700" : ""}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setVisibility(post.visibility);
      setIsEmergency(post.is_emergency);
      setImages(post.images || []);
      setNewImages([]);
      setNewImagePreviews([]);
      setTargetDepartments(post.target_departments || []);
      setTargetYears(post.target_years || []);
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
        target_departments:
          visibility === "department" || visibility === "department_year"
            ? targetDepartments
            : undefined,
        target_years:
          visibility === "department_year" ? targetYears : undefined,
      });

      if (response.success && response.data) {
        onPostUpdated(response.data);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className={isDark ? "bg-slate-700 border-slate-600" : ""}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Visibility
              </label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as PostVisibility)}
              >
                <SelectTrigger
                  className={isDark ? "bg-slate-700 border-slate-600" : ""}
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
                      Department & Year
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
              <label className="text-sm font-medium mb-2 block">Identity</label>
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
                      Profile Icon Only
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

          {visibility === "department" || visibility === "department_year" ? (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Departments
              </label>
              <Select
                value={targetDepartments[0] || ""}
                onValueChange={(v) => setTargetDepartments([v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CST">Computer Science</SelectItem>
                  <SelectItem value="Economics">Economics</SelectItem>
                  <SelectItem value="Civil">Civil Engineering</SelectItem>
                  <SelectItem value="Electrical">
                    Electrical Engineering
                  </SelectItem>
                  <SelectItem value="Mechanical">
                    Mechanical Engineering
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {visibility === "department_year" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Years
              </label>
              <Select
                value={targetYears[0]?.toString() || ""}
                onValueChange={(v) => setTargetYears([parseInt(v)])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-emergency"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="edit-emergency" className="text-sm">
              Mark as Emergency/Help Post
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Edit className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
