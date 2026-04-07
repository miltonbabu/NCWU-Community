import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { marketApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PostChatIndicator } from "@/components/PostChatIndicator";
import { MarketMessageNotification } from "@/components/MarketMessageNotification";
import type { MarketPost } from "@/types/market";
import { MARKET_CATEGORIES, MARKET_CONDITIONS } from "@/types/market";
import {
  ShoppingCart,
  ChevronLeft,
  Loader2,
  Heart,
  MessageCircle,
  Eye,
  Plus,
  Filter,
  X,
  Phone,
  ExternalLink,
  Sparkles,
  CheckCircle,
  DollarSign,
  MessageSquare,
  Tag,
  Clock,
  Shield,
  Scale,
  Search,
  Share2,
  Globe,
  CreditCard,
  ArrowRight,
  Home,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const isNewPost = (date: string) => {
  const postDate = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  return diffInHours < 24;
};

const getConditionColor = (condition: string) => {
  switch (condition) {
    case "new":
      return "bg-emerald-500";
    case "like_new":
      return "bg-teal-500";
    case "good":
      return "bg-blue-500";
    case "fair":
      return "bg-amber-500";
    case "poor":
      return "bg-orange-500";
    default:
      return "bg-slate-500";
  }
};

const getConditionLabel = (condition: string) => {
  return (
    MARKET_CONDITIONS.find((c) => c.value === condition)?.label || condition
  );
};

const getCategoryLabel = (category: string) => {
  return MARKET_CATEGORIES.find((c) => c.value === category)?.label || category;
};

const formatTimeAgo = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export default function MarketPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<MarketPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [sharePost, setSharePost] = useState<MarketPost | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleShareToSocial = (post: MarketPost) => {
    const shareContent = `🛒 ${post.title}\n\n💰 Price: ¥${post.price.toLocaleString()}\n📦 Condition: ${getConditionLabel(post.condition)}\n📂 Category: ${getCategoryLabel(post.category)}\n\n${post.description || ""}\n\n🔗 View item: ${window.location.origin}/market/${post.id}\n\n#MarketPlace #SecondHand #ForSale`;
    const shareHeading = `Selling: ${post.title}`;

    navigate(
      `/social?share=true&heading=${encodeURIComponent(shareHeading)}&content=${encodeURIComponent(shareContent)}&images=${encodeURIComponent(JSON.stringify(post.images || []))}`,
    );
  };

  const handleShareToDiscord = (post: MarketPost) => {
    const shareContent = `🛒 ${post.title}\n\n💰 Price: ¥${post.price.toLocaleString()}\n📦 Condition: ${getConditionLabel(post.condition)}\n📂 Category: ${getCategoryLabel(post.category)}\n\n${post.description || ""}\n\n🔗 View item: ${window.location.origin}/market/${post.id}\n\n#MarketPlace #SecondHand #ForSale`;
    navigate(
      `/discord?share=true&content=${encodeURIComponent(shareContent)}&images=${encodeURIComponent(JSON.stringify(post.images || []))}`,
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketApi.getPosts({
        category: selectedCategory || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: 12,
      });
      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postsData = (response.data as any).data || response.data;
        const postsArray = Array.isArray(postsData) ? postsData : [];
        setPosts(postsArray);
        setTotalPages(response.data.totalPages || 1);
        const liked = new Set<string>();
        postsArray.forEach((post: MarketPost) => {
          if (post.user_liked) liked.add(post.id);
        });
        setLikedPosts(liked);
      }
    } catch (error) {
      toast.error("Failed to fetch posts");
    }
    setIsLoading(false);
  }, [selectedCategory, minPrice, maxPrice, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleClearFilters = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (likedPosts.has(postId)) {
        const response = await marketApi.unlikePost(postId);
        if (response.success) {
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, like_count: Math.max(0, (p.like_count || 1) - 1) }
                : p,
            ),
          );
        }
      } else {
        const response = await marketApi.likePost(postId);
        if (response.success) {
          setLikedPosts((prev) => new Set(prev).add(postId));
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, like_count: (p.like_count || 0) + 1 }
                : p,
            ),
          );
        }
      }
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Navigation />

      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md ${
          isDark
            ? "bg-slate-950/95 border-slate-800"
            : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section - Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1
                  className={`text-base sm:text-lg font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Second-Hand Market
                </h1>
                <p
                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"} hidden sm:block`}
                >
                  Click any post to see more info
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Navigation Links */}
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1 sm:gap-2 px-2 sm:px-3 ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    Home
                  </span>
                </Button>
              </Link>
              <Link to="/social">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1 sm:gap-2 px-2 sm:px-3 ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    Social
                  </span>
                </Button>
              </Link>

              {isAuthenticated && <MarketMessageNotification />}
              {isAuthenticated && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/market/chat")}
                    className={`${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" : "border-slate-300 text-slate-600 hover:bg-slate-100"} gap-1 sm:gap-2 px-2 sm:px-3`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                      Messages
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/market/create")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 gap-1 sm:gap-2 px-2 sm:px-4"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">Post</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Always Expanded Under Nav */}
      <div
        className={`border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3
              className={`font-semibold text-xs sm:text-sm ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Filters & Search
            </h3>
            {(selectedCategory || minPrice || maxPrice || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="mb-2 sm:mb-3">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label
                className={`text-xs mb-1 block ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                <option value="">All</option>
                {MARKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`text-xs mb-1 block ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Min ¥
              </label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className={`text-xs sm:text-sm ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
              />
            </div>

            <div>
              <label
                className={`text-xs mb-1 block ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Max ¥
              </label>
              <Input
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`text-xs sm:text-sm ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules Section - Hidden on mobile, shown as collapsible */}
      <div
        className={`border-b hidden sm:block ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-blue-50 border-blue-100"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${isDark ? "bg-blue-900/30" : "bg-blue-100"} shrink-0`}
            >
              <Scale
                className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`}
              />
            </div>
            <div className="flex-1">
              <h3
                className={`font-semibold text-sm mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Marketplace Rules
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                <div className="flex items-start gap-1.5">
                  <Shield
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-600"}
                  >
                    Be honest: Accurate descriptions
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Shield
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-600"}
                  >
                    Fair pricing: Based on condition
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-600"}
                  >
                    Safe meetups: Public campus areas
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-600"}
                  >
                    Trusted payment: Alipay, WeChat, etc.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-600"}
                  >
                    Respect: Professional communication
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <main className="pt-4 sm:pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-6">
            {/* Category Sidebar */}
            <div className="hidden lg:block w-48 shrink-0">
              <div
                className={`rounded-xl border p-4 sticky top-24 ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <h3
                  className={`font-semibold text-sm mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-emerald-500 text-white"
                        : isDark
                          ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    All Items
                  </button>
                  {MARKET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat.value
                          ? "bg-emerald-500 text-white"
                          : isDark
                            ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-500" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingCart
                    className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${
                      isDark ? "text-slate-700" : "text-slate-300"
                    }`}
                  />
                  <p
                    className={`text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No items found. Be the first to post!
                  </p>
                  {isAuthenticated && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/market/create")}
                      className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Item
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/market/${post.id}`}
                        className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl ${
                          isDark
                            ? "bg-slate-900 border border-slate-800"
                            : "bg-white border border-slate-200 shadow-sm"
                        } ${isNewPost(post.created_at) ? "ring-2 ring-emerald-500" : ""}`}
                      >
                        {isNewPost(post.created_at) && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-emerald-500 text-white border-0 text-xs py-0 px-1.5">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              New
                            </Badge>
                          </div>
                        )}

                        {post.is_sold && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-base flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              SOLD
                            </div>
                          </div>
                        )}

                        <div className="relative h-36 sm:h-44 lg:h-48 overflow-hidden">
                          {post.images && post.images.length > 0 ? (
                            <img
                              src={post.images[0]}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-white/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between">
                            <Badge
                              className={`${getConditionColor(post.condition)} text-white border-0 text-xs py-0.5 sm:py-1 px-1.5 sm:px-2`}
                            >
                              {getConditionLabel(post.condition)}
                            </Badge>
                            <div className="text-white font-bold text-base sm:text-lg lg:text-xl">
                              ¥{post.price.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-3 lg:p-4">
                          <h3
                            className={`text-sm sm:text-base lg:text-lg font-bold line-clamp-1 mb-1.5 sm:mb-2 ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {post.title}
                          </h3>

                          {post.description && (
                            <p
                              className={`text-xs line-clamp-2 mb-2 sm:mb-3 ${
                                isDark ? "text-slate-400" : "text-slate-600"
                              }`}
                            >
                              {post.description}
                            </p>
                          )}

                          <div
                            className={`flex items-center justify-between text-xs mb-2 pb-2 border-b ${
                              isDark
                                ? "text-slate-500 border-slate-700"
                                : "text-slate-500 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span className="truncate max-w-20 sm:max-w-none">
                                {getCategoryLabel(post.category)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(post.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className={
                                  isDark ? "text-slate-500" : "text-slate-400"
                                }
                              >
                                <Eye className="w-3 h-3 inline" />{" "}
                                {post.views || 0}
                              </span>
                              <span
                                className={
                                  isDark ? "text-slate-500" : "text-slate-400"
                                }
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 inline ${likedPosts.has(post.id) ? "fill-red-500 text-red-500" : ""}`}
                                />{" "}
                                {post.like_count || 0}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSharePost(post);
                                setShowShareDialog(true);
                              }}
                              className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                                isDark
                                  ? "text-emerald-400 hover:bg-emerald-900/20"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              <Share2 className="w-3 h-3 inline mr-1" />
                              Share
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex gap-1.5">
                              <Link
                                to={`/market/${post.id}`}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                                  isDark
                                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                                }`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </Link>
                              {isAuthenticated && user?.id !== post.user_id && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/market/chat?postId=${post.id}`);
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                                    isDark
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : "bg-blue-500 hover:bg-blue-600 text-white"
                                  }`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  Contact
                                </button>
                              )}
                              <Link
                                to={`/market/${post.id}?buy=true`}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                                  isDark
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                Buy Safe
                              </Link>
                            </div>
                          </div>

                          {user && post.user_id === user.id && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <PostChatIndicator
                                postId={post.id}
                                isOwner={true}
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                          currentPage === 1
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-emerald-100 dark:hover:bg-slate-800"
                        } ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                                  currentPage === pageNum
                                    ? "bg-emerald-500 text-white"
                                    : `hover:bg-emerald-100 dark:hover:bg-slate-800 ${isDark ? "text-slate-300" : "text-slate-700"}`
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                          currentPage === totalPages
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-emerald-100 dark:hover:bg-slate-800"
                        } ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      {showShareDialog && sharePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowShareDialog(false)}
        >
          <div
            className={`w-full max-w-md mx-auto rounded-xl border ${
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Share Post
                </h3>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className={`p-1 rounded-lg ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                >
                  <X
                    className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Post Preview */}
              <div
                className={`mb-4 p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <div className="flex gap-3">
                  {sharePost.images && sharePost.images.length > 0 && (
                    <img
                      src={sharePost.images[0]}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {sharePost.title}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      ¥{sharePost.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowShareDialog(false);
                    handleShareToSocial(sharePost);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isDark
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Share to Social Feed</p>
                    <p
                      className={`text-xs ${isDark ? "text-emerald-200" : "text-emerald-100"}`}
                    >
                      Create a post with item details
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowShareDialog(false);
                    handleShareToDiscord(sharePost);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isDark
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Share to Discord</p>
                    <p
                      className={`text-xs ${isDark ? "text-indigo-200" : "text-indigo-100"}`}
                    >
                      Share in a group chat
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
