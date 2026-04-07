import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { useWordListHistory, useHSKProgress } from "@/hooks/useHSK";
import { useLearnedWords } from "@/hooks/useLearnedWords";
import { useSavedWords } from "@/hooks/useSavedWords";
import { socialApi, uploadApi, authApi, marketApi } from "@/lib/api";
import type { Post, PostVisibility, AnonymityLevel } from "@/types/social";
import type { MarketPost } from "@/types/market";
import { MARKET_CATEGORIES, MARKET_CONDITIONS } from "@/types/market";
import { PostChatIndicator } from "@/components/PostChatIndicator";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Mail,
  Hash,
  Building2,
  GraduationCap,
  Phone,
  Globe,
  Calendar,
  Edit2,
  Lock,
  Save,
  Shield,
  Clock,
  Camera,
  Upload,
  X,
  Crop,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  AlertCircle,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Trash2,
  Edit,
  Loader2,
  Globe2,
  Users,
  AlertTriangle,
  UserCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  MapPin,
  LogOut,
  Send,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  BookOpen,
  BookmarkCheck,
  ListChecks,
  Target,
  Award,
  FolderOpen,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const departments = [
  "Computer Science & Technology",
  "Economics",
  "Civil Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Water Resources",
  "Business Administration",
  "Other",
];

const currentYears = [
  { value: "1", label: "1st Year (Freshman)" },
  { value: "2", label: "2nd Year (Sophomore)" },
  { value: "3", label: "3rd Year (Junior)" },
  { value: "4", label: "4th Year (Senior)" },
  { value: "5", label: "5th Year" },
  { value: "6", label: "6th Year" },
];

const enrollmentYears = Array.from({ length: 10 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OUTPUT_SIZE = 256;

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function ProfilePageContent() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user, updateProfile, changePassword, isLoading, logout } = useAuth();
  const { clearAllData } = useWordListHistory();
  const { getLevelProgress, getOverallProgress } = useHSKProgress();
  const { learnedWords: learnedWordsData } = useLearnedWords();
  const { savedWords: savedWordsData } = useSavedWords();
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [wordLists, setWordLists] = useState<any[]>([]);
  const [hskExtraLoading, setHskExtraLoading] = useState(true);

  useEffect(() => {
    async function loadHSKExtra() {
      try {
        const [quizRes, bookmarkRes, wordListRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (socialApi as any).get("/hsk/quiz-results").catch(() => ({ data: [] })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (socialApi as any).get("/hsk/bookmarks").catch(() => ({ data: [] })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (socialApi as any).get("/hsk/word-lists").catch(() => ({ data: [] })),
        ]);
        if (quizRes?.data?.success) setQuizResults(quizRes.data.data || []);
        if (bookmarkRes?.data?.success)
          setBookmarks(bookmarkRes.data.data || []);
        if (wordListRes?.data?.success)
          setWordLists(wordListRes.data.data || []);
      } catch {}
      setHskExtraLoading(false);
    }
    loadHSKExtra();
  }, []);
  const overallProgress = getOverallProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [, setMyPosts] = useState<Post[]>([]);
  const [, setIsLoadingPosts] = useState(false);
  const [, setPostsPage] = useState(1);
  const [, setHasMorePosts] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostVisibility, setEditPostVisibility] =
    useState<PostVisibility>("public");
  const [editPostAnonymity, setEditPostAnonymity] =
    useState<AnonymityLevel>("full");
  const [editPostEmergency, setEditPostEmergency] = useState(false);
  const [editPostDialog, setEditPostDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    department: user?.department || "",
    enrollment_year: user?.enrollment_year?.toString() || "",
    current_year: user?.current_year?.toString() || "",
    phone: user?.phone || "",
    country: user?.country || "",
    bio: user?.bio || "",
    avatar_url: user?.avatar_url || "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  // Market states
  const [marketPosts, setMarketPosts] = useState<MarketPost[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  // Avatar editing states
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [, setOriginalFile] = useState<File | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [, setScale] = useState(1);
  const [, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [croppedImageData, setCroppedImageData] = useState<string | null>(null);
  const [hasAvatarChanges, setHasAvatarChanges] = useState(false);

  const [postsWithInteractions, setPostsWithInteractions] = useState<any[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [languageExchangeProfile, setLanguageExchangeProfile] = useState<{
    native_language: string;
    target_language: string;
    proficiency_level: number;
    bio: string;
    interests: string[];
    availability: string[];
    is_active: boolean;
  } | null>(null);
  const [isLoadingExchangeProfile, setIsLoadingExchangeProfile] =
    useState(false);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({
    native_language: "",
    target_language: "",
    proficiency_level: 1,
    bio: "",
    interests: [] as string[],
    availability: [] as string[],
  });

  const [restrictions, setRestrictions] = useState<
    {
      id: string;
      flag_type: string;
      reason: string;
      source: string;
      restriction_type: string;
      restriction_days: number;
      restricted_features: string[];
      restricted_at: string;
      restriction_ends_at: string | null;
      is_active: number;
      is_expired: boolean;
      created_at: string;
      appeal_message: string | null;
      appeal_submitted_at: string | null;
      appeal_status: string;
    }[]
  >([]);
  const [isLoadingRestrictions, setIsLoadingRestrictions] = useState(false);
  const [appealForms, setAppealForms] = useState<Record<string, boolean>>({});
  const [appealMessages, setAppealMessages] = useState<Record<string, string>>(
    {},
  );
  const [submittingAppeal, setSubmittingAppeal] = useState<string | null>(null);

  const fetchRestrictions = useCallback(async () => {
    setIsLoadingRestrictions(true);
    try {
      const response = await authApi.getMyRestrictions();
      if (response.success && response.data) {
        setRestrictions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch restrictions:", error);
    }
    setIsLoadingRestrictions(false);
  }, []);

  useEffect(() => {
    fetchRestrictions();
  }, [fetchRestrictions]);

  const languages = [
    "Chinese",
    "English",
    "Spanish",
    "French",
    "German",
    "Japanese",
    "Korean",
    "Russian",
    "Portuguese",
    "Italian",
    "Arabic",
    "Hindi",
    "Bengali",
    "Turkish",
    "Vietnamese",
    "Thai",
    "Indonesian",
    "Dutch",
    "Polish",
    "Swedish",
    "Other",
  ];

  const interestOptions = [
    "Music",
    "Movies",
    "Sports",
    "Travel",
    "Food",
    "Technology",
    "Art",
    "Reading",
    "Gaming",
    "Photography",
    "Cooking",
    "Fitness",
    "Fashion",
    "Science",
    "History",
    "Literature",
    "Business",
    "Nature",
  ];

  const availabilityOptions = [
    "Weekday Mornings",
    "Weekday Afternoons",
    "Weekday Evenings",
    "Weekend Mornings",
    "Weekend Afternoons",
    "Weekend Evenings",
  ];

  const fetchLanguageExchangeProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success && data.data) {
        setLanguageExchangeProfile(data.data);
        setExchangeForm({
          native_language: data.data.native_language || "",
          target_language: data.data.target_language || "",
          proficiency_level: data.data.proficiency_level || 1,
          bio: data.data.bio || "",
          interests: data.data.interests || [],
          availability: data.data.availability || [],
        });
      }
    } catch (error) {
      console.error("Error fetching language exchange profile:", error);
    }
  };

  useEffect(() => {
    fetchLanguageExchangeProfile();
  }, []);

  // Fetch market posts
  const fetchMarketPosts = async () => {
    setIsLoadingMarket(true);
    try {
      console.log("Fetching market posts...");
      const response = await marketApi.getMyPosts();
      console.log("Market posts response:", response);
      if (response.success && response.data) {
        console.log("Setting market posts:", response.data);
        setMarketPosts(response.data);
      } else {
        console.log("No market posts found or error:", response);
        setMarketPosts([]);
      }
    } catch (error) {
      console.error("Error fetching market posts:", error);
      setMarketPosts([]);
    }
    setIsLoadingMarket(false);
  };

  useEffect(() => {
    fetchMarketPosts();
  }, []);

  const handleMarkAsSold = async (postId: string) => {
    if (!confirm("Mark this item as sold? It will be removed after 1 hour."))
      return;
    try {
      const response = await marketApi.markAsSold(postId);
      if (response.success) {
        toast.success("Item marked as sold");
        fetchMarketPosts();
      }
    } catch (error) {
      toast.error("Failed to mark as sold");
    }
  };

  const handleDeleteMarketPost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await marketApi.deletePost(postId);
      if (response.success) {
        toast.success("Post deleted");
        setMarketPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleJoinLanguageExchange = async () => {
    setIsLoadingExchangeProfile(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      console.log("Submitting language exchange profile:", exchangeForm);

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(exchangeForm),
        },
      );

      const data = await response.json();
      console.log("Language exchange profile response:", data);

      if (data.success) {
        toast.success("Language exchange profile updated!");
        setShowExchangeDialog(false);
        fetchLanguageExchangeProfile();
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating language exchange profile:", error);
      toast.error("Failed to update language exchange profile");
    } finally {
      setIsLoadingExchangeProfile(false);
    }
  };

  const handleLeaveLanguageExchange = async () => {
    if (
      !confirm(
        "Are you sure you want to leave language exchange? Your profile will be hidden from other users.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/language-exchange/profile`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Removed from language exchange");
        setLanguageExchangeProfile(null);
      } else {
        toast.error(data.message || "Failed to leave language exchange");
      }
    } catch (error) {
      toast.error("Failed to leave language exchange");
    }
  };

  const updateProfileField = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return t(
        "profile.errors.invalidFileType",
        "Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return t(
        "profile.errors.fileTooLarge",
        "File is too large. Maximum size is 10MB.",
      );
    }

    return null;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      toast.error(validationError);
      return;
    }

    setOriginalFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });

        // Initialize crop area to center of image with square aspect ratio
        const minDimension = Math.min(img.width, img.height);
        const cropSize = Math.min(
          minDimension * 0.8,
          Math.min(img.width, img.height),
        );

        setCropArea({
          x: (img.width - cropSize) / 2,
          y: (img.height - cropSize) / 2,
          width: cropSize,
          height: cropSize,
        });

        setOriginalImage(event.target?.result as string);
        setScale(1);
        setRotation(0);
        setIsCropDialogOpen(true);
      };

      img.onerror = () => {
        const error = t(
          "profile.errors.invalidImage",
          "Failed to load image. Please try another file.",
        );
        setUploadError(error);
        toast.error(error);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      const error = t(
        "profile.errors.readError",
        "Failed to read file. Please try again.",
      );
      setUploadError(error);
      toast.error(error);
    };

    reader.readAsDataURL(file);
  };

  // Convert data URL to File object
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCropComplete = useCallback(async () => {
    if (!originalImage) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const img = new Image();
    img.onload = async () => {
      ctx.save();

      // Create circular clip path
      ctx.beginPath();
      ctx.arc(
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();

      // Clear canvas
      ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Calculate the source and destination coordinates
      const sourceX = cropArea.x;
      const sourceY = cropArea.y;
      const sourceWidth = cropArea.width;
      const sourceHeight = cropArea.height;

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );

      ctx.restore();

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCroppedImageData(croppedDataUrl);
      setProfileData((prev) => ({ ...prev, avatar_url: croppedDataUrl }));
      setHasAvatarChanges(true);
      setIsCropDialogOpen(false);

      // Automatically upload and save the avatar
      setIsUploadingAvatar(true);
      try {
        const avatarFile = dataURLtoFile(croppedDataUrl, "avatar.jpg");
        const uploadResponse = await uploadApi.uploadAvatar(avatarFile);

        if (uploadResponse.success && uploadResponse.data) {
          const avatarUrl = uploadResponse.data.url;

          const success = await updateProfile({
            avatar_url: avatarUrl,
          });

          if (success) {
            setCroppedImageData(null);
            setOriginalImage(null);
            setOriginalFile(null);
            setHasAvatarChanges(false);
            toast.success(
              t("profile.avatarUpdateSuccess", "Avatar updated successfully!"),
            );
          }
        } else {
          toast.error(uploadResponse.message || "Failed to upload avatar");
        }
      } catch (error) {
        toast.error("An error occurred while saving your avatar");
        console.error(error);
      } finally {
        setIsUploadingAvatar(false);
      }
    };

    img.src = originalImage;
  }, [originalImage, cropArea, t, dataURLtoFile, updateProfile]);

  const handleRemoveAvatar = async () => {
    setCroppedImageData(null);
    setOriginalImage(null);
    setOriginalFile(null);
    setProfileData((prev) => ({ ...prev, avatar_url: "" }));
    setHasAvatarChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Automatically save the removal
    setIsUploadingAvatar(true);
    try {
      const success = await updateProfile({
        avatar_url: "",
      });

      if (success) {
        toast.success(
          t("profile.avatarRemoved", "Profile picture removed successfully!"),
        );
      }
    } catch (error) {
      toast.error("An error occurred while removing your avatar");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = (
      e.currentTarget.parentElement as HTMLElement
    ).getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    setDragStart({
      x: e.clientX * scaleX - cropArea.x,
      y: e.clientY * scaleY - cropArea.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const rect = (
      e.currentTarget.parentElement as HTMLElement
    ).getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;

    const newX = e.clientX * scaleX - dragStart.x;
    const newY = e.clientY * scaleY - dragStart.y;

    // Constrain crop area within image bounds
    const constrainedX = Math.max(
      0,
      Math.min(imageDimensions.width - cropArea.width, newX),
    );
    const constrainedY = Math.max(
      0,
      Math.min(imageDimensions.height - cropArea.height, newY),
    );

    setCropArea((prev) => ({ ...prev, x: constrainedX, y: constrainedY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (direction: "in" | "out") => {
    setCropArea((prev) => {
      const currentSize = prev.width;
      const delta = currentSize * 0.1 * (direction === "in" ? -1 : 1);
      const newSize = Math.max(
        50,
        Math.min(
          Math.min(imageDimensions.width, imageDimensions.height) * 0.9,
          currentSize + delta,
        ),
      );

      // Keep crop area centered when zooming
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;
      let newX = centerX - newSize / 2;
      let newY = centerY - newSize / 2;

      // Constrain to image bounds
      newX = Math.max(0, Math.min(imageDimensions.width - newSize, newX));
      newY = Math.max(0, Math.min(imageDimensions.height - newSize, newY));

      return {
        x: newX,
        y: newY,
        width: newSize,
        height: newSize,
      };
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSaveProfile = async () => {
    setIsUploadingAvatar(true);
    let avatarUrl: string | undefined = profileData.avatar_url;

    try {
      // If there's a cropped image data, upload it first
      if (croppedImageData && croppedImageData.startsWith("data:")) {
        const avatarFile = dataURLtoFile(croppedImageData, "avatar.jpg");
        const uploadResponse = await uploadApi.uploadAvatar(avatarFile);

        if (uploadResponse.success && uploadResponse.data) {
          avatarUrl = uploadResponse.data.url;
        } else {
          toast.error(uploadResponse.message || "Failed to upload avatar");
          setIsUploadingAvatar(false);
          return;
        }
      }

      // If avatar was removed (empty string) and user had an avatar before,
      // we need to explicitly send empty string to remove it
      const avatarRemoved = profileData.avatar_url === "" && user?.avatar_url;
      if (avatarRemoved) {
        avatarUrl = "";
      }

      // Only include avatar_url in update if:
      // 1. There's a new avatar (croppedImageData exists)
      // 2. Avatar was explicitly removed (empty string)
      // 3. There's an existing avatar_url in profileData that's not empty
      const shouldUpdateAvatar =
        croppedImageData ||
        avatarRemoved ||
        (profileData.avatar_url && profileData.avatar_url !== "");

      const updateData: Parameters<typeof updateProfile>[0] = {
        full_name: profileData.full_name,
        department: profileData.department || undefined,
        enrollment_year: profileData.enrollment_year
          ? parseInt(profileData.enrollment_year)
          : undefined,
        current_year: profileData.current_year
          ? parseInt(profileData.current_year)
          : undefined,
        phone: profileData.phone || undefined,
        country: profileData.country || undefined,
        bio: profileData.bio || undefined,
      };

      // Only include avatar_url if it should be updated
      if (shouldUpdateAvatar) {
        updateData.avatar_url = avatarUrl;
      }

      const success = await updateProfile(updateData);

      if (success) {
        setIsEditing(false);
        toast.success(
          t("profile.updateSuccess", "Profile updated successfully!"),
        );
      }
    } catch (error) {
      toast.error("An error occurred while saving your profile");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Separate function to save only avatar changes
  const handleSaveAvatar = async () => {
    setIsUploadingAvatar(true);
    let avatarUrl: string | undefined = profileData.avatar_url;

    try {
      // If there's a cropped image data, upload it first
      if (croppedImageData && croppedImageData.startsWith("data:")) {
        const avatarFile = dataURLtoFile(croppedImageData, "avatar.jpg");
        const uploadResponse = await uploadApi.uploadAvatar(avatarFile);

        if (uploadResponse.success && uploadResponse.data) {
          avatarUrl = uploadResponse.data.url;
        } else {
          toast.error(uploadResponse.message || "Failed to upload avatar");
          setIsUploadingAvatar(false);
          return;
        }
      }

      // If avatar was removed (empty string) and user had an avatar before,
      // we need to explicitly send empty string to remove it
      const avatarRemoved = profileData.avatar_url === "" && user?.avatar_url;
      if (avatarRemoved) {
        avatarUrl = "";
      }

      // Only update if there's something to change
      const shouldUpdateAvatar =
        croppedImageData ||
        avatarRemoved ||
        (profileData.avatar_url && profileData.avatar_url !== "");

      if (!shouldUpdateAvatar) {
        setIsEditingAvatar(false);
        setIsUploadingAvatar(false);
        return;
      }

      const success = await updateProfile({
        avatar_url: avatarUrl,
      });

      if (success) {
        setIsEditingAvatar(false);
        setCroppedImageData(null);
        setOriginalImage(null);
        setOriginalFile(null);
        toast.success(
          t("profile.avatarUpdateSuccess", "Avatar updated successfully!"),
        );
      }
    } catch (error) {
      toast.error("An error occurred while saving your avatar");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelAvatarEdit = () => {
    setIsEditingAvatar(false);
    setCroppedImageData(null);
    setOriginalImage(null);
    setOriginalFile(null);
    setUploadError(null);
    setHasAvatarChanges(false);
    setProfileData((prev) => ({
      ...prev,
      avatar_url: user?.avatar_url || "",
    }));
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};

    if (!passwordData.current_password) {
      errors.current_password = t(
        "auth.errors.currentPasswordRequired",
        "Current password is required",
      );
    }
    if (!passwordData.new_password) {
      errors.new_password = t(
        "auth.errors.newPasswordRequired",
        "New password is required",
      );
    } else if (passwordData.new_password.length < 6) {
      errors.new_password = t(
        "auth.errors.passwordLength",
        "Password must be at least 6 characters",
      );
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = t(
        "auth.errors.passwordMismatch",
        "Passwords do not match",
      );
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const success = await changePassword(
      passwordData.current_password,
      passwordData.new_password,
    );
    if (success) {
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordErrors({});
      toast.success(
        t("profile.passwordChangeSuccess", "Password changed successfully!"),
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Determine which avatar to display
  const displayAvatar =
    croppedImageData || profileData.avatar_url || user?.avatar_url;

  const fetchMyPosts = useCallback(async (pageNum: number, reset = false) => {
    setIsLoadingPosts(true);
    const response = await socialApi.getMyPosts(pageNum, 10);
    if (response.success && response.data) {
      if (reset) {
        setMyPosts(response.data.posts);
      } else {
        setMyPosts((prev) => [...prev, ...response.data!.posts]);
      }
      setHasMorePosts(response.data.pagination.hasMore);
    }
    setIsLoadingPosts(false);
  }, []);

  useEffect(() => {
    fetchMyPosts(1, true);
  }, [fetchMyPosts]);

  const fetchPostsWithInteractions = useCallback(async () => {
    setIsLoadingInteractions(true);
    try {
      const response = await socialApi.getMyPostsWithInteractions();
      if (response.success && response.data) {
        setPostsWithInteractions(response.data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts with interactions:", error);
    }
    setIsLoadingInteractions(false);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await socialApi.getNotifications(1, 50);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter(
          (n: any) => !n.is_read,
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
    setIsLoadingNotifications(false);
  }, []);

  const markNotificationRead = async (notificationId: string) => {
    try {
      const response = await socialApi.markNotificationRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await socialApi.markAllNotificationsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  useEffect(() => {
    fetchPostsWithInteractions();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPostsWithInteractions, fetchNotifications]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await socialApi.deletePost(postId);
      if (response.success) {
        setMyPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success("Post deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setEditPostVisibility(post.visibility);
    setEditPostEmergency(post.is_emergency);
    if (post.is_anonymous) {
      setEditPostAnonymity("anonymous");
    } else if (!post.show_profile_icon) {
      setEditPostAnonymity("icon_only");
    } else {
      setEditPostAnonymity("full");
    }
    setEditPostDialog(true);
  };

  const handleSaveEditPost = async () => {
    if (!editingPost) return;
    const response = await socialApi.updatePost(editingPost.id, {
      content: editPostContent,
      visibility: editPostVisibility,
      is_emergency: editPostEmergency,
      anonymity_level: editPostAnonymity,
    });
    if (response.success && response.data) {
      setMyPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? response.data! : p)),
      );
      setEditPostDialog(false);
      setEditingPost(null);
      toast.success("Post updated successfully");
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe2 className="w-3 h-3" />;
      case "department":
        return <Users className="w-3 h-3" />;
      case "department_year":
        return <GraduationCap className="w-3 h-3" />;
      case "emergency":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Globe2 className="w-3 h-3" />;
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
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-indigo-100 to-slate-100"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/"
            className={`text-sm ${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            ← {t("common.backToHome", "Back to Home")}
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          {/* Avatar Section with Independent Edit */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="w-24 h-24 ring-4 ring-indigo-500/30">
                <AvatarImage
                  src={displayAvatar || ""}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  {user?.full_name ? getInitials(user.full_name) : "U"}
                </AvatarFallback>
              </Avatar>
              {/* Camera overlay - always visible on hover */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setIsEditingAvatar(true)}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Avatar Edit Controls */}
            {isEditingAvatar && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Change Photo
                  </Button>
                  {displayAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                {uploadError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {uploadError}
                  </div>
                )}
                <div
                  className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <p>JPG, PNG, GIF or WebP. Max 10MB.</p>
                </div>
                {hasAvatarChanges && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCancelAvatarEdit}
                    disabled={isUploadingAvatar}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}
                {!hasAvatarChanges && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsEditingAvatar(false)}
                    disabled={isUploadingAvatar}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    Done
                  </Button>
                )}
              </div>
            )}
            {!isEditingAvatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingAvatar(true)}
                className="text-indigo-500 hover:text-indigo-600"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Avatar
              </Button>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h1
              className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {user?.full_name}
            </h1>
            <p
              className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {user?.student_id}
            </p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              {user?.role === "superadmin" && (
                <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  SuperAdmin
                </span>
              )}
              {user?.role === "admin" && (
                <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-500 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {t("auth.admin", "Admin")}
                </span>
              )}
              {user?.is_verified ? (
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded-full flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("auth.verified", "Verified")}
                </span>
              ) : (
                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1  0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("auth.unverified", "Unverified")}
                </span>
              )}
              {user?.auth_provider === "google" && (
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </span>
              )}
            </div>
          </div>
        </div>

        {!user?.is_verified &&
          user?.role !== "admin" &&
          user?.role !== "superadmin" && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                isDark
                  ? "bg-amber-500/10 border border-amber-500/30"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <svg
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3
                  className={`font-medium ${isDark ? "text-amber-400" : "text-amber-700"}`}
                >
                  {t(
                    "profile.verificationPending",
                    "Account Verification Pending",
                  )}
                </h3>
                <p
                  className={`text-sm mt-1 ${isDark ? "text-amber-300/70" : "text-amber-600"}`}
                >
                  {t(
                    "profile.verificationPendingDesc",
                    "Your account is waiting for admin verification. Some features may be limited until verified.",
                  )}
                </p>
              </div>
            </div>
          )}

        {/* Active Restrictions Warning */}
        {restrictions.some((r) => r.is_active && !r.is_expired) && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              isDark
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`}
              />
              <div className="flex-1">
                <h3
                  className={`font-medium ${isDark ? "text-red-400" : "text-red-700"}`}
                >
                  Account Restriction Active
                </h3>
                <p
                  className={`text-sm mt-1 ${isDark ? "text-red-300/70" : "text-red-600"}`}
                >
                  Your account has active restrictions. Some features may be
                  limited.
                </p>

                <div className="mt-3 space-y-2">
                  {restrictions
                    .filter((r) => r.is_active && !r.is_expired)
                    .map((restriction) => (
                      <div
                        key={restriction.id}
                        className={`p-3 rounded-lg ${
                          isDark ? "bg-slate-800/50" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {restriction.reason}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs">
                              <span
                                className={
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }
                              >
                                Source: {restriction.source.replace("_", " ")}
                              </span>
                              <span
                                className={
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }
                              >
                                • Duration: {restriction.restriction_days} days
                              </span>
                            </div>
                            {restriction.restriction_ends_at && (
                              <p
                                className={`text-xs mt-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                              >
                                Expires:{" "}
                                {new Date(
                                  restriction.restriction_ends_at,
                                ).toLocaleString()}
                              </p>
                            )}
                            {restriction.restricted_features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {restriction.restricted_features.map(
                                  (feature) => (
                                    <Badge
                                      key={feature}
                                      variant="outline"
                                      className={`text-xs ${isDark ? "border-red-500/30 text-red-400" : "border-red-200 text-red-600"}`}
                                    >
                                      {feature}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            )}

                            {/* Appeal Section */}
                            {restriction.appeal_status === "none" && (
                              <div className="mt-3">
                                {!appealForms[restriction.id] ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setAppealForms((prev) => ({
                                        ...prev,
                                        [restriction.id]: true,
                                      }))
                                    }
                                    className={`text-xs ${isDark ? "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10" : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"}`}
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    Submit Appeal
                                  </Button>
                                ) : (
                                  <div className="space-y-2">
                                    <Textarea
                                      placeholder="Explain why you believe this restriction should be lifted..."
                                      value={
                                        appealMessages[restriction.id] || ""
                                      }
                                      onChange={(e) =>
                                        setAppealMessages((prev) => ({
                                          ...prev,
                                          [restriction.id]: e.target.value,
                                        }))
                                      }
                                      className={`text-xs ${isDark ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
                                      rows={3}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          const message =
                                            appealMessages[restriction.id];
                                          if (
                                            !message ||
                                            message.trim().length < 10
                                          ) {
                                            toast.error(
                                              "Appeal must be at least 10 characters",
                                            );
                                            return;
                                          }
                                          setSubmittingAppeal(restriction.id);
                                          try {
                                            const response =
                                              await authApi.submitAppeal(
                                                restriction.id,
                                                message,
                                              );
                                            if (response.success) {
                                              toast.success(
                                                "Appeal submitted successfully!",
                                              );
                                              fetchRestrictions();
                                              setAppealForms((prev) => {
                                                const newForms = { ...prev };
                                                delete newForms[restriction.id];
                                                return newForms;
                                              });
                                              setAppealMessages((prev) => {
                                                const newMessages = {
                                                  ...prev,
                                                };
                                                delete newMessages[
                                                  restriction.id
                                                ];
                                                return newMessages;
                                              });
                                            } else {
                                              toast.error(
                                                response.message ||
                                                  "Failed to submit appeal",
                                              );
                                            }
                                          } catch (error) {
                                            toast.error(
                                              "Failed to submit appeal",
                                            );
                                          }
                                          setSubmittingAppeal(null);
                                        }}
                                        disabled={
                                          submittingAppeal === restriction.id
                                        }
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                      >
                                        {submittingAppeal === restriction.id ? (
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : (
                                          <Send className="w-3 h-3 mr-1" />
                                        )}
                                        Submit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setAppealForms((prev) => {
                                            const newForms = { ...prev };
                                            delete newForms[restriction.id];
                                            return newForms;
                                          });
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Appeal Status */}
                            {restriction.appeal_status === "pending" && (
                              <div
                                className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
                              >
                                <Clock
                                  className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                                />
                                <span
                                  className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                                >
                                  Appeal pending review
                                </span>
                              </div>
                            )}

                            {restriction.appeal_status === "approved" && (
                              <div
                                className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${isDark ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"}`}
                              >
                                <Check
                                  className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`}
                                />
                                <span
                                  className={`text-xs ${isDark ? "text-green-400" : "text-green-600"}`}
                                >
                                  Appeal approved - restriction lifted
                                </span>
                              </div>
                            )}

                            {restriction.appeal_status === "rejected" && (
                              <div
                                className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
                              >
                                <X
                                  className={`w-4 h-4 ${isDark ? "text-red-400" : "text-red-600"}`}
                                />
                                <span
                                  className={`text-xs ${isDark ? "text-red-400" : "text-red-600"}`}
                                >
                                  Appeal rejected
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Past Restrictions (Expired) */}
        {restrictions.some((r) => r.is_expired || !r.is_active) && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              isDark
                ? "bg-slate-800/50 border border-slate-700"
                : "bg-slate-100 border border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <Clock
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              />
              <div className="flex-1">
                <h3
                  className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Past Restrictions
                </h3>
                <p
                  className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  You have had restrictions in the past. Please follow community
                  guidelines.
                </p>

                <div className="mt-3 space-y-2">
                  {restrictions
                    .filter((r) => r.is_expired || !r.is_active)
                    .slice(0, 3)
                    .map((restriction) => (
                      <div
                        key={restriction.id}
                        className={`p-3 rounded-lg ${isDark ? "bg-slate-700/30" : "bg-white"}`}
                      >
                        <p
                          className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {restriction.reason}
                        </p>
                        <p
                          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {restriction.restriction_days} days •{" "}
                          {restriction.is_expired ? "Expired" : "Lifted"}:{" "}
                          {restriction.restriction_ends_at
                            ? new Date(
                                restriction.restriction_ends_at,
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList
            className={`grid w-full grid-cols-7 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
          >
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              {t("profile.profile", "Profile")}
            </TabsTrigger>
            <TabsTrigger value="posts">
              <MessageCircle className="w-4 h-4 mr-2" />
              {t("profile.myPosts", "My Posts")}
            </TabsTrigger>
            <TabsTrigger value="market">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Market
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              {t("profile.security", "Security")}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="w-4 h-4 mr-2" />
              {t("profile.activity", "Activity")}
            </TabsTrigger>
            <TabsTrigger value="language-exchange">
              <Globe2 className="w-4 h-4 mr-2" />
              Language Exchange
            </TabsTrigger>
            <TabsTrigger value="hsk">
              <GraduationCap className="w-4 h-4 mr-2" />
              {t("hsk.hsk", "HSK")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className={isDark ? "bg-slate-800/50 border-slate-700" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={isDark ? "text-white" : ""}>
                      {t("profile.personalInfo", "Personal Information")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        "profile.personalInfoDesc",
                        "Your personal details and academic information",
                      )}
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t("common.edit", "Edit")}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("auth.fullName", "Full Name")}</Label>
                        <Input
                          value={profileData.full_name}
                          onChange={(e) =>
                            updateProfileField("full_name", e.target.value)
                          }
                          className={
                            isDark ? "bg-slate-700/50 border-slate-600" : ""
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("auth.department", "Department")}</Label>
                        <Select
                          value={profileData.department}
                          onValueChange={(v) =>
                            updateProfileField("department", v)
                          }
                        >
                          <SelectTrigger
                            className={
                              isDark ? "bg-slate-700/50 border-slate-600" : ""
                            }
                          >
                            <SelectValue
                              placeholder={t(
                                "auth.selectDepartment",
                                "Select department",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("auth.currentYear", "Current Year")}</Label>
                        <Select
                          value={profileData.current_year}
                          onValueChange={(v) =>
                            updateProfileField("current_year", v)
                          }
                        >
                          <SelectTrigger
                            className={
                              isDark ? "bg-slate-700/50 border-slate-600" : ""
                            }
                          >
                            <SelectValue
                              placeholder={t("auth.selectYear", "Select year")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {currentYears.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {t("auth.enrollmentYear", "Enrollment Year")}
                        </Label>
                        <Select
                          value={profileData.enrollment_year}
                          onValueChange={(v) =>
                            updateProfileField("enrollment_year", v)
                          }
                        >
                          <SelectTrigger
                            className={
                              isDark ? "bg-slate-700/50 border-slate-600" : ""
                            }
                          >
                            <SelectValue
                              placeholder={t("auth.selectYear", "Select year")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {enrollmentYears.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("auth.phone", "Phone Number")}</Label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) =>
                            updateProfileField("phone", e.target.value)
                          }
                          className={
                            isDark ? "bg-slate-700/50 border-slate-600" : ""
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("auth.country", "Country")}</Label>
                        <Input
                          value={profileData.country}
                          onChange={(e) =>
                            updateProfileField("country", e.target.value)
                          }
                          className={
                            isDark ? "bg-slate-700/50 border-slate-600" : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("profile.bio", "Bio")}</Label>
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          updateProfileField("bio", e.target.value)
                        }
                        placeholder={t(
                          "profile.bioPlaceholder",
                          "Tell us about yourself...",
                        )}
                        className={
                          isDark ? "bg-slate-700/50 border-slate-600" : ""
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isLoading || isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isUploadingAvatar
                          ? t("common.saving", "Saving...")
                          : t("common.saveChanges", "Save Changes")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setProfileData((prev) => ({
                            ...prev,
                            full_name: user?.full_name || "",
                            department: user?.department || "",
                            enrollment_year:
                              user?.enrollment_year?.toString() || "",
                            current_year: user?.current_year?.toString() || "",
                            phone: user?.phone || "",
                            country: user?.country || "",
                            bio: user?.bio || "",
                          }));
                        }}
                      >
                        {t("common.cancel", "Cancel")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Hash className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.studentId", "Student ID")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.student_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Mail className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.email", "Email")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Building2 className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.department", "Department")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.department || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <GraduationCap className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.currentYear", "Current Year")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.current_year
                              ? `Year ${user.current_year}`
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Calendar className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.enrollmentYear", "Enrollment Year")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.enrollment_year || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Phone className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.phone", "Phone")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.phone || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Globe className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("auth.country", "Country")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.country || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {t("profile.memberSince", "Member Since")}
                          </p>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {user?.created_at
                              ? formatDate(user.created_at)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {user?.bio && (
                      <>
                        <Separator className={isDark ? "bg-slate-700" : ""} />
                        <div>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} mb-2`}
                          >
                            {t("profile.bio", "Bio")}
                          </p>
                          <p
                            className={isDark ? "text-white" : "text-slate-900"}
                          >
                            {user.bio}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language-exchange">
            <Card className={isDark ? "bg-slate-800/50 border-slate-700" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={isDark ? "text-white" : ""}>
                      <Globe2 className="w-5 h-5 inline mr-2" />
                      Language Exchange
                    </CardTitle>
                    <CardDescription>
                      Connect with other users for language practice and
                      cultural exchange
                    </CardDescription>
                  </div>
                  {languageExchangeProfile?.is_active && (
                    <Link to="/hsk?tab=partners">
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        Find Partners
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {languageExchangeProfile?.is_active ? (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg ${isDark ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Check
                          className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`}
                        />
                        <span
                          className={`font-medium ${isDark ? "text-green-400" : "text-green-700"}`}
                        >
                          You are visible in Language Exchange
                        </span>
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-green-300" : "text-green-600"}`}
                      >
                        Other users can find and connect with you for language
                        practice.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Native Language
                        </p>
                        <p
                          className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {languageExchangeProfile.native_language}
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Learning
                        </p>
                        <p
                          className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {languageExchangeProfile.target_language}
                        </p>
                      </div>
                    </div>

                    {languageExchangeProfile.bio && (
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} mb-2`}
                        >
                          About
                        </p>
                        <p className={isDark ? "text-white" : "text-slate-900"}>
                          {languageExchangeProfile.bio}
                        </p>
                      </div>
                    )}

                    {languageExchangeProfile.interests?.length > 0 && (
                      <div>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} mb-2`}
                        >
                          Interests
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {languageExchangeProfile.interests.map((interest) => (
                            <Badge key={interest} variant="secondary">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowExchangeDialog(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLeaveLanguageExchange}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Leave Language Exchange
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe2
                      className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                    />
                    <h3
                      className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Join Language Exchange
                    </h3>
                    <p
                      className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Connect with other users who want to practice languages
                      together. Share your culture and learn from others!
                    </p>
                    <Button onClick={() => setShowExchangeDialog(true)}>
                      <Users className="w-4 h-4 mr-2" />
                      Join Language Exchange
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <div className="space-y-6">
              <Card
                className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDark ? "text-white" : ""}>
                        {t("profile.myPosts", "My Posts")}
                      </CardTitle>
                      <CardDescription>
                        {t(
                          "profile.myPostsDesc",
                          "Manage your posts and see interactions",
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative"
                      >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Button>
                      <Link to="/social">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          View Feed
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {showNotifications && (
                <Card
                  className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle
                        className={`text-lg ${isDark ? "text-white" : ""}`}
                      >
                        <Bell className="w-5 h-5 mr-2 inline" />
                        Notifications
                      </CardTitle>
                      {unreadCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markAllNotificationsRead}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNotifications ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-4">
                        <Bell
                          className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                        />
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() =>
                                markNotificationRead(notification.id)
                              }
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                notification.is_read
                                  ? isDark
                                    ? "bg-slate-700/30"
                                    : "bg-slate-50"
                                  : isDark
                                    ? "bg-indigo-500/20 border border-indigo-500/30"
                                    : "bg-indigo-50 border border-indigo-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage
                                    src={notification.actor?.avatar_url}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {notification.actor?.full_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    <span className="font-medium">
                                      {notification.actor?.full_name}
                                    </span>{" "}
                                    {notification.type === "like"
                                      ? "liked your post"
                                      : notification.type === "comment"
                                        ? "commented on your post"
                                        : notification.type ===
                                            "exchange_request"
                                          ? "wants to connect for language exchange"
                                          : notification.type ===
                                              "exchange_accepted"
                                            ? "accepted your language exchange request"
                                            : notification.type ===
                                                "exchange_rejected"
                                              ? "declined your language exchange request"
                                              : notification.type ===
                                                  "new_exchange_message"
                                                ? "sent you a message"
                                                : "interacted with you"}
                                  </p>
                                  {notification.type === "comment" &&
                                    notification.content && (
                                      <p
                                        className={`text-xs mt-1 truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                      >
                                        "{notification.content}"
                                      </p>
                                    )}
                                  {notification.type === "exchange_request" && (
                                    <p
                                      className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                    >
                                      Click to view and accept/decline
                                    </p>
                                  )}
                                  <p
                                    className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                  >
                                    {formatDistanceToNow(
                                      new Date(notification.created_at),
                                      { addSuffix: true },
                                    )}
                                  </p>
                                </div>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card
                className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
              >
                <CardContent className="pt-6">
                  {isLoadingInteractions &&
                  postsWithInteractions.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : postsWithInteractions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle
                        className={`w-12 h-12 mx-auto mb-4 ${
                          isDark ? "text-slate-600" : "text-slate-300"
                        }`}
                      />
                      <h3
                        className={`text-lg font-medium mb-2 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {t("profile.noPostsYet", "No posts yet")}
                      </h3>
                      <p
                        className={`text-sm mb-4 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {t(
                          "profile.noPostsYetDesc",
                          "You haven't created any posts yet. Start sharing with the community!",
                        )}
                      </p>
                      <Link to="/social">
                        <Button>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Create Your First Post
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {postsWithInteractions.map((post) => (
                        <div
                          key={post.id}
                          className={`p-4 rounded-lg border ${
                            isDark
                              ? "bg-slate-700/50 border-slate-600"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {post.is_emergency && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Emergency
                                </Badge>
                              )}
                              {post.feeling && (
                                <span
                                  className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                                >
                                  {post.feeling}
                                </span>
                              )}
                              {post.location && (
                                <span
                                  className={`text-xs flex items-center gap-1 ${isDark ? "text-red-400" : "text-red-600"}`}
                                >
                                  <MapPin className="w-3 h-3" />
                                  {post.location}
                                </span>
                              )}
                              {post.post_type === "gallery" && (
                                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 gap-1">
                                  <Camera className="w-3 h-3" />
                                  Gallery
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditPost(post)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {post.post_type === "gallery" &&
                            post.images &&
                            post.images.length > 0 && (
                              <div className="mb-3 -mt-1">
                                <img
                                  src={post.images[0]}
                                  alt="Gallery featured"
                                  className="w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() =>
                                    window.open(post.images[0], "_blank")
                                  }
                                />
                              </div>
                            )}

                          <p
                            className={`text-sm mb-2 ${
                              isDark ? "text-slate-200" : "text-slate-700"
                            }`}
                          >
                            {post.content}
                          </p>

                          {post.images && post.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto mb-3">
                              {post.images.map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Post image ${idx + 1}`}
                                  className="h-20 w-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(img, "_blank")}
                                />
                              ))}
                            </div>
                          )}

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {post.tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
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

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                {post.total_likes || post.like_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-blue-500" />
                                {post.total_comments || post.comment_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="w-3 h-3" />
                                {post.share_count}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedPost(
                                expandedPost === post.id ? null : post.id,
                              )
                            }
                          >
                            {expandedPost === post.id ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide Interactions
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show Interactions
                              </>
                            )}
                          </Button>

                          {expandedPost === post.id && (
                            <div
                              className={`mt-4 pt-4 border-t ${isDark ? "border-slate-600" : "border-slate-200"}`}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4
                                    className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    <Heart className="w-4 h-4 text-red-500" />
                                    Liked by ({post.likers?.length || 0})
                                  </h4>
                                  <ScrollArea className="h-32">
                                    {post.likers?.length > 0 ? (
                                      <div className="space-y-2">
                                        {post.likers.map(
                                          (liker: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50"
                                            >
                                              <Avatar className="w-6 h-6">
                                                <AvatarImage
                                                  src={liker.avatar_url}
                                                />
                                                <AvatarFallback className="text-xs">
                                                  {liker.full_name?.[0] || "U"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 min-w-0">
                                                <p
                                                  className={`text-xs font-medium truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                                >
                                                  {liker.full_name}
                                                </p>
                                                <p
                                                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                                >
                                                  {formatDistanceToNow(
                                                    new Date(liker.liked_at),
                                                    { addSuffix: true },
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <p
                                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                      >
                                        No likes yet
                                      </p>
                                    )}
                                  </ScrollArea>
                                </div>

                                <div>
                                  <h4
                                    className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    <MessageCircle className="w-4 h-4 text-blue-500" />
                                    Comments ({post.commenters?.length || 0})
                                  </h4>
                                  <ScrollArea className="h-32">
                                    {post.commenters?.length > 0 ? (
                                      <div className="space-y-2">
                                        {post.commenters.map(
                                          (commenter: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50"
                                            >
                                              <div className="flex items-center gap-2 mb-1">
                                                <Avatar className="w-6 h-6">
                                                  <AvatarImage
                                                    src={commenter.avatar_url}
                                                  />
                                                  <AvatarFallback className="text-xs">
                                                    {commenter.full_name?.[0] ||
                                                      "U"}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <p
                                                  className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                                >
                                                  {commenter.full_name}
                                                </p>
                                              </div>
                                              <p
                                                className={`text-xs ml-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                              >
                                                "{commenter.comment_preview}"
                                                {commenter.comment_preview
                                                  .length >= 100 && "..."}
                                              </p>
                                              <p
                                                className={`text-xs ml-8 mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                              >
                                                {formatDistanceToNow(
                                                  new Date(
                                                    commenter.commented_at,
                                                  ),
                                                  { addSuffix: true },
                                                )}
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <p
                                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                      >
                                        No comments yet
                                      </p>
                                    )}
                                  </ScrollArea>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market">
            <div className="space-y-6">
              <Card
                className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDark ? "text-white" : ""}>
                        My Market Posts
                      </CardTitle>
                      <CardDescription>
                        Manage your items for sale
                      </CardDescription>
                    </div>
                    <Link to="/market/create">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Post New Item
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingMarket ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                  ) : marketPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart
                        className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                      />
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        You haven't posted any items yet
                      </p>
                      <Link to="/market/create">
                        <Button variant="outline" className="mt-4">
                          Post Your First Item
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {marketPosts.map((post) => (
                        <div
                          key={post.id}
                          className={`p-4 rounded-xl ${
                            isDark ? "bg-slate-700/30" : "bg-slate-100"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              {post.images && post.images[0] ? (
                                <img
                                  src={post.images[0]}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                  <ShoppingCart className="w-8 h-8 text-white/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3
                                    className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    {post.title}
                                  </h3>
                                  <p
                                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    {MARKET_CATEGORIES.find(
                                      (c) => c.value === post.category,
                                    )?.label || post.category}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-emerald-500">
                                    ¥{post.price.toLocaleString()}
                                  </div>
                                  {post.is_sold ? (
                                    <Badge className="bg-red-500 text-white border-0">
                                      Sold
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-500 text-white border-0">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p
                                className={`text-sm mt-1 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {post.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span
                                  className={
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }
                                >
                                  <Eye className="w-3 h-3 inline mr-1" />
                                  {post.views || 0} views
                                </span>
                                <span
                                  className={
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }
                                >
                                  <Heart className="w-3 h-3 inline mr-1" />
                                  {post.like_count || 0} likes
                                </span>
                                <span
                                  className={
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }
                                >
                                  <MessageCircle className="w-3 h-3 inline mr-1" />
                                  {post.comment_count || 0} comments
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                            <Link to={`/market/${post.id}`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Link
                              to={`/market/edit/${post.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            </Link>
                            {!post.is_sold && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsSold(post.id)}
                                className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Sold
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMarketPost(post.id)}
                              className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>

                          {/* Chat indicator for post owner */}
                          <div className="mt-3">
                            <PostChatIndicator
                              postId={post.id}
                              isOwner={true}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card className={isDark ? "bg-slate-800/50 border-slate-700" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>
                  {t("profile.changePassword", "Change Password")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "profile.changePasswordDesc",
                    "Update your password to keep your account secure",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.auth_provider === "google" && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-3 ${
                      isDark
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <div>
                      <p
                        className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-700"}`}
                      >
                        Connected with Google
                      </p>
                      <p
                        className={`text-xs ${isDark ? "text-blue-400/70" : "text-blue-600/70"}`}
                      >
                        You signed in with Google. Your account is secured by
                        Google authentication.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t("auth.currentPassword", "Current Password")}</Label>
                  <Input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        current_password: e.target.value,
                      }))
                    }
                    className={isDark ? "bg-slate-700/50 border-slate-600" : ""}
                  />
                  {passwordErrors.current_password && (
                    <p className="text-red-500 text-xs">
                      {passwordErrors.current_password}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("auth.newPassword", "New Password")}</Label>
                    <Input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          new_password: e.target.value,
                        }))
                      }
                      className={
                        isDark ? "bg-slate-700/50 border-slate-600" : ""
                      }
                    />
                    {passwordErrors.new_password && (
                      <p className="text-red-500 text-xs">
                        {passwordErrors.new_password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {t("auth.confirmPassword", "Confirm New Password")}
                    </Label>
                    <Input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                      className={
                        isDark ? "bg-slate-700/50 border-slate-600" : ""
                      }
                    />
                    {passwordErrors.confirm_password && (
                      <p className="text-red-500 text-xs">
                        {passwordErrors.confirm_password}
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={handleChangePassword} disabled={isLoading}>
                  <Lock className="w-4 h-4 mr-2" />
                  {t("profile.updatePassword", "Update Password")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to logout?")) {
                      logout();
                    }
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className={isDark ? "bg-slate-800/50 border-slate-700" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>
                  {t("profile.accountActivity", "Account Activity")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "profile.accountActivityDesc",
                    "Your recent account activity and statistics",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                  >
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {t("profile.accountCreated", "Account Created")}
                    </p>
                    <p
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {user?.created_at ? formatDate(user.created_at) : "-"}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                  >
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {t("profile.lastUpdated", "Last Updated")}
                    </p>
                    <p
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {user?.updated_at ? formatDate(user.updated_at) : "-"}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                  >
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {t("profile.accountStatus", "Account Status")}
                    </p>
                    <p
                      className={`text-lg font-semibold ${user?.is_banned ? "text-red-500" : "text-green-500"}`}
                    >
                      {user?.is_banned
                        ? t("profile.banned", "Banned")
                        : t("profile.active", "Active")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hsk">
            <div className="space-y-6">
              <Card
                className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDark ? "text-white" : ""}>
                        {t("hsk.myProgress", "My HSK Progress")}
                      </CardTitle>
                      <CardDescription>
                        {t(
                          "hsk.myProgressDesc",
                          "Track your HSK learning journey and activities",
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (
                          confirm(
                            t(
                              "hsk.confirmClearData",
                              "Are you sure you want to clear all your HSK data? This action cannot be undone.",
                            ),
                          )
                        ) {
                          try {
                            await clearAllData();
                            toast.success(
                              t(
                                "hsk.dataCleared",
                                "HSK data cleared successfully",
                              ),
                            );
                          } catch (error) {
                            toast.error(
                              t(
                                "hsk.errorClearingData",
                                "Error clearing HSK data",
                              ),
                            );
                          }
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("hsk.clearData", "Clear Data")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                      >
                        <p
                          className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {t("hsk.totalWordsLearned", "Words Learned")}
                        </p>
                        <p
                          className={`text-xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {overallProgress.totalWordsLearned || 0}
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                      >
                        <p
                          className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {t("hsk.completedLevels", "Levels Completed")}
                        </p>
                        <p
                          className={`text-xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {overallProgress.levelsCompleted || 0}
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                      >
                        <p
                          className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {t("hsk.totalQuizzes", "Quizzes Taken")}
                        </p>
                        <p
                          className={`text-xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {overallProgress.totalQuizzes || 0}
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                      >
                        <p
                          className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {t("hsk.averageScore", "Avg Score")}
                        </p>
                        <p
                          className={`text-xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {overallProgress.overallAverage
                            ? `${overallProgress.overallAverage}%`
                            : "0%"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {t("hsk.levelProgress", "Level Progress")}
                      </h3>
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((level) => {
                          const levelProgress = getLevelProgress(
                            level as 1 | 2 | 3 | 4 | 5 | 6,
                          );
                          const percentage =
                            levelProgress.totalWords > 0
                              ? Math.round(
                                  (levelProgress.wordsLearned /
                                    levelProgress.totalWords) *
                                    100,
                                )
                              : 0;

                          return (
                            <div key={level}>
                              <div className="flex justify-between mb-1">
                                <span
                                  className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                                >
                                  HSK {level}
                                </span>
                                <span
                                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {levelProgress.wordsLearned}/
                                  {levelProgress.totalWords} words
                                </span>
                              </div>
                              <div
                                className={`h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                              >
                                <div
                                  className={`h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 ease-out`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <CardTitle
                        className={`text-base ${isDark ? "text-white" : ""}`}
                      >
                        {t("hsk.learnedWords", "Learned Words")}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-emerald-500/10 text-emerald-500"
                      >
                        {learnedWordsData.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {learnedWordsData.length === 0 ? (
                      <p
                        className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t("hsk.noLearnedWords", "No learned words yet")}
                      </p>
                    ) : (
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-2">
                          {learnedWordsData.slice(0, 20).map((word) => (
                            <div
                              key={word.id}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${isDark ? "bg-slate-700/30" : "bg-slate-50"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                                >
                                  HSK{word.level}
                                </span>
                                <span
                                  className={`font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  {word.chinese}
                                </span>
                                <span
                                  className={`truncate hidden sm:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {word.pinyin}
                                </span>
                              </div>
                              <span
                                className={`shrink-0 ml-2 truncate max-w-[120px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {word.english}
                              </span>
                            </div>
                          ))}
                          {learnedWordsData.length > 20 && (
                            <p
                              className={`text-xs text-center py-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              +{learnedWordsData.length - 20} more
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card
                  className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <CardTitle
                        className={`text-base ${isDark ? "text-white" : ""}`}
                      >
                        {t("hsk.savedWords", "Saved Words")}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-blue-500/10 text-blue-500"
                      >
                        {savedWordsData.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {savedWordsData.length === 0 ? (
                      <p
                        className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t("hsk.noSavedWords", "No saved words yet")}
                      </p>
                    ) : (
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-2">
                          {savedWordsData.slice(0, 20).map((word) => (
                            <div
                              key={word.id}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${isDark ? "bg-slate-700/30" : "bg-slate-50"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}`}
                                >
                                  HSK{word.level}
                                </span>
                                <span
                                  className={`font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  {word.chinese}
                                </span>
                                <span
                                  className={`truncate hidden sm:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {word.pinyin}
                                </span>
                              </div>
                              <span
                                className={`shrink-0 ml-2 truncate max-w-[120px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {word.english}
                              </span>
                            </div>
                          ))}
                          {savedWordsData.length > 20 && (
                            <p
                              className={`text-xs text-center py-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              +{savedWordsData.length - 20} more
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card
                  className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" />
                      <CardTitle
                        className={`text-base ${isDark ? "text-white" : ""}`}
                      >
                        {t("hsk.quizHistory", "Quiz History")}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-amber-500/10 text-amber-500"
                      >
                        {quizResults.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quizResults.length === 0 ? (
                      <p
                        className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t("hsk.noQuizzes", "No quiz results yet")}
                      </p>
                    ) : (
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-2">
                          {quizResults.slice(0, 15).map((q: any, i: number) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${isDark ? "bg-slate-700/30" : "bg-slate-50"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Award
                                  className={`w-4 h-4 shrink-0 ${Number(q.score) >= 80 ? "text-emerald-500" : Number(q.score) >= 60 ? "text-amber-500" : "text-red-500"}`}
                                />
                                <span
                                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  HSK{q.level || q.hsk_level || "?"}
                                </span>
                                <span
                                  className={`truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {q.quiz_type || q.type || "Quiz"}
                                </span>
                              </div>
                              <span
                                className={`shrink-0 ml-2 font-bold ${Number(q.score) >= 80 ? "text-emerald-500" : Number(q.score) >= 60 ? "text-amber-500" : "text-red-500"}`}
                              >
                                {q.score}%
                              </span>
                            </div>
                          ))}
                          {quizResults.length > 15 && (
                            <p
                              className={`text-xs text-center py-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              +{quizResults.length - 15} more
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card
                  className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-purple-500" />
                      <CardTitle
                        className={`text-base ${isDark ? "text-white" : ""}`}
                      >
                        {t("hsk.wordLists", "Word Lists")}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-purple-500/10 text-purple-500"
                      >
                        {wordLists.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {wordLists.length === 0 ? (
                      <p
                        className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t("hsk.noWordLists", "No word lists created")}
                      </p>
                    ) : (
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-2">
                          {wordLists
                            .slice(0, 15)
                            .map((list: any, i: number) => (
                              <div
                                key={i}
                                className={`flex items-center justify-between p-2 rounded-lg text-sm ${isDark ? "bg-slate-700/30" : "bg-slate-50"}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FolderOpen
                                    className={`w-4 h-4 shrink-0 ${isDark ? "text-purple-400" : "text-purple-500"}`}
                                  />
                                  <span
                                    className={`font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    {list.name || list.title || `List ${i + 1}`}
                                  </span>
                                </div>
                                <span
                                  className={`shrink-0 ml-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {list.words?.length || list.word_count || 0}{" "}
                                  words
                                </span>
                              </div>
                            ))}
                          {wordLists.length > 15 && (
                            <p
                              className={`text-xs text-center py-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              +{wordLists.length - 15} more
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card
                className={isDark ? "bg-slate-800/50 border-slate-700" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5 text-rose-500" />
                    <CardTitle
                      className={`text-base ${isDark ? "text-white" : ""}`}
                    >
                      {t("hsk.bookmarks", "Bookmarks")}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-rose-500/10 text-rose-500"
                    >
                      {bookmarks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {bookmarks.length === 0 ? (
                    <p
                      className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {t("hsk.noBookmarks", "No bookmarks saved")}
                    </p>
                  ) : (
                    <ScrollArea className="max-h-[250px]">
                      <div className="flex flex-wrap gap-2">
                        {bookmarks.map((b: any, i: number) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={`${isDark ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}
                          >
                            {b.resource_id || b.word || b.title || `#${i + 1}`}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Crop Dialog */}
        <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
          <DialogContent
            className={`${isDark ? "bg-slate-800 border-slate-700" : ""} max-w-4xl`}
          >
            <DialogHeader>
              <DialogTitle className={isDark ? "text-white" : ""}>
                <Crop className="w-5 h-5 inline mr-2" />
                {t("profile.cropImage", "Crop Profile Picture")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {originalImage && (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main Image with Crop Overlay */}
                  <div className="flex-1">
                    <div
                      className={`relative overflow-hidden rounded-lg ${isDark ? "bg-slate-900" : "bg-slate-100"}`}
                      style={{ maxHeight: "400px" }}
                    >
                      <div className="relative inline-block">
                        <img
                          src={originalImage}
                          alt="Crop preview"
                          className="max-w-full max-h-[400px] object-contain block"
                          draggable={false}
                        />
                        {/* Dark overlay outside crop area */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
                            clipPath: `polygon(
                              0% 0%,
                              100% 0%,
                              100% 100%,
                              0% 100%,
                              0% 0%,
                              ${(cropArea.x / imageDimensions.width) * 100}% ${(cropArea.y / imageDimensions.height) * 100}%,
                              ${(cropArea.x / imageDimensions.width) * 100}% ${((cropArea.y + cropArea.height) / imageDimensions.height) * 100}%,
                              ${((cropArea.x + cropArea.width) / imageDimensions.width) * 100}% ${((cropArea.y + cropArea.height) / imageDimensions.height) * 100}%,
                              ${((cropArea.x + cropArea.width) / imageDimensions.width) * 100}% ${(cropArea.y / imageDimensions.height) * 100}%,
                              ${(cropArea.x / imageDimensions.width) * 100}% ${(cropArea.y / imageDimensions.height) * 100}%
                            )`,
                          }}
                        />
                        {/* Draggable crop area */}
                        <div
                          className="absolute border-4 border-indigo-500 cursor-move rounded-full"
                          style={{
                            left: `${(cropArea.x / imageDimensions.width) * 100}%`,
                            top: `${(cropArea.y / imageDimensions.height) * 100}%`,
                            width: `${(cropArea.width / imageDimensions.width) * 100}%`,
                            height: `${(cropArea.height / imageDimensions.height) * 100}%`,
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        >
                          {/* Corner handles for visual indication */}
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
                          {/* Center crosshair */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/50 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview and Controls */}
                  <div className="flex flex-col items-center gap-4 lg:w-48">
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        Preview
                      </p>
                      <div className="relative">
                        <div
                          className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                            isDark ? "border-slate-600" : "border-slate-200"
                          }`}
                        >
                          {originalImage && (
                            <img
                              src={originalImage}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: `${(cropArea.x / (imageDimensions.width - cropArea.width)) * 100}% ${(cropArea.y / (imageDimensions.height - cropArea.height)) * 100}%`,
                                transform: `scale(${imageDimensions.width / cropArea.width})`,
                                transformOrigin: "top left",
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Round icon preview
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-2 w-full">
                      <p
                        className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Zoom
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom("out")}
                          disabled={
                            cropArea.width >= imageDimensions.width * 0.9
                          }
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span
                          className={`text-sm w-12 text-center ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {Math.round(
                            (imageDimensions.width / cropArea.width) * 100,
                          )}
                          %
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom("in")}
                          disabled={cropArea.width <= 50}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRotate}
                        className="mt-2"
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        Rotate
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <p
                className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {t(
                  "profile.cropInstructions",
                  "Drag the circle to position. Use zoom buttons to resize the crop area.",
                )}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCropDialogOpen(false)}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleCropComplete}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Check className="w-4 h-4 mr-2" />
                {t("profile.applyCrop", "Apply Crop")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editPostDialog} onOpenChange={setEditPostDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>
                Update your post content and settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Content
                </label>
                <Textarea
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  rows={4}
                  className={isDark ? "bg-slate-700 border-slate-600" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Visibility
                  </label>
                  <Select
                    value={editPostVisibility}
                    onValueChange={(v) =>
                      setEditPostVisibility(v as PostVisibility)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe2 className="w-4 h-4" />
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
                  <label className="text-sm font-medium mb-2 block">
                    Identity
                  </label>
                  <Select
                    value={editPostAnonymity}
                    onValueChange={(v) =>
                      setEditPostAnonymity(v as AnonymityLevel)
                    }
                  >
                    <SelectTrigger>
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editEmergency"
                  checked={editPostEmergency}
                  onChange={(e) => setEditPostEmergency(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="editEmergency" className="text-sm">
                  Mark as Emergency/Help Post
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditPostDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEditPost}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
          <DialogContent
            className={isDark ? "bg-slate-800 border-slate-700" : ""}
          >
            <DialogHeader>
              <DialogTitle className={isDark ? "text-white" : ""}>
                Language Exchange Profile
              </DialogTitle>
              <DialogDescription>
                Set up your profile to connect with other language learners
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? "text-white" : ""}>
                    Native Language
                  </Label>
                  <Select
                    value={exchangeForm.native_language}
                    onValueChange={(v) =>
                      setExchangeForm((prev) => ({
                        ...prev,
                        native_language: v,
                      }))
                    }
                  >
                    <SelectTrigger
                      className={isDark ? "bg-slate-700 border-slate-600" : ""}
                    >
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={isDark ? "text-white" : ""}>Learning</Label>
                  <Select
                    value={exchangeForm.target_language}
                    onValueChange={(v) =>
                      setExchangeForm((prev) => ({
                        ...prev,
                        target_language: v,
                      }))
                    }
                  >
                    <SelectTrigger
                      className={isDark ? "bg-slate-700 border-slate-600" : ""}
                    >
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? "text-white" : ""}>
                  Proficiency Level (1-6)
                </Label>
                <Select
                  value={exchangeForm.proficiency_level.toString()}
                  onValueChange={(v) =>
                    setExchangeForm((prev) => ({
                      ...prev,
                      proficiency_level: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger
                    className={isDark ? "bg-slate-700 border-slate-600" : ""}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}{" "}
                        {level === 1
                          ? "(Beginner)"
                          : level === 6
                            ? "(Advanced)"
                            : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? "text-white" : ""}>Bio</Label>
                <Textarea
                  value={exchangeForm.bio}
                  onChange={(e) =>
                    setExchangeForm((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Tell others about yourself and your language goals..."
                  className={isDark ? "bg-slate-700 border-slate-600" : ""}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? "text-white" : ""}>Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <Badge
                      key={interest}
                      variant={
                        exchangeForm.interests.includes(interest)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setExchangeForm((prev) => ({
                          ...prev,
                          interests: prev.interests.includes(interest)
                            ? prev.interests.filter((i) => i !== interest)
                            : [...prev.interests, interest],
                        }));
                      }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? "text-white" : ""}>
                  Availability
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availabilityOptions.map((time) => (
                    <Badge
                      key={time}
                      variant={
                        exchangeForm.availability.includes(time)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setExchangeForm((prev) => ({
                          ...prev,
                          availability: prev.availability.includes(time)
                            ? prev.availability.filter((t) => t !== time)
                            : [...prev.availability, time],
                        }));
                      }}
                    >
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowExchangeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinLanguageExchange}
                disabled={
                  !exchangeForm.native_language ||
                  !exchangeForm.target_language ||
                  isLoadingExchangeProfile
                }
              >
                {isLoadingExchangeProfile ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {languageExchangeProfile?.is_active
                  ? "Update Profile"
                  : "Join Language Exchange"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}
