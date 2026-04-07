import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { adminMarketApi, marketApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/AuthGuard";
import type { MarketPost, MarketBuyRequest, MarketStats } from "@/types/market";
import { MARKET_CATEGORIES } from "@/types/market";
import {
  ShoppingCart,
  ChevronLeft,
  Loader2,
  Trash2,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Package,
  AlertCircle,
  DollarSign as DollarIcon,
  FileText,
  Download,
  Plus,
  X,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type TabType = "posts" | "requests" | "stats" | "chat";

function AdminMarketContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<MarketPost[]>([]);
  const [buyRequests, setBuyRequests] = useState<MarketBuyRequest[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedRequest, setSelectedRequest] =
    useState<MarketBuyRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    phoneNumber: "",
    images: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminMarketApi.getPosts(
        statusFilter || undefined,
        categoryFilter || undefined,
      );
      if (response.success && response.data?.posts) {
        setPosts(response.data.posts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      toast.error("Failed to fetch posts");
      setPosts([]);
    }
    setIsLoading(false);
  }, [statusFilter, categoryFilter]);

  const fetchBuyRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminMarketApi.getBuyRequests(
        statusFilter || undefined,
      );
      if (response.success && response.data?.requests) {
        setBuyRequests(response.data.requests);
      } else {
        setBuyRequests([]);
      }
    } catch (error) {
      toast.error("Failed to fetch buy requests");
      setBuyRequests([]);
    }
    setIsLoading(false);
  }, [statusFilter]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminMarketApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      toast.error("Failed to fetch stats");
      setStats(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "requests") {
      fetchBuyRequests();
    } else {
      fetchStats();
    }
  }, [activeTab, statusFilter, categoryFilter, fetchPosts, fetchBuyRequests, fetchStats]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await adminMarketApi.deletePost(postId);
      if (response.success) {
        toast.success("Post deleted");
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleProcessRequest = async (
    requestId: string,
    status: "approved" | "rejected" | "completed",
  ) => {
    setIsProcessing(true);
    try {
      const response = await adminMarketApi.processBuyRequest(
        requestId,
        status,
        adminNotes || undefined,
      );
      if (response.success) {
        toast.success(`Request ${status}`);
        setSelectedRequest(null);
        setAdminNotes("");
        fetchBuyRequests();
      }
    } catch (error) {
      toast.error("Failed to process request");
    }
    setIsProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500";
      case "approved":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const getCategoryLabel = (value: string) => {
    return MARKET_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  const handleCreatePost = async () => {
    if (
      !newPost.title ||
      !newPost.description ||
      !newPost.price ||
      !newPost.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await adminMarketApi.createPost({
        title: newPost.title,
        description: newPost.description,
        price: parseFloat(newPost.price),
        category: newPost.category,
        condition: newPost.condition || "good",
        phone_number: newPost.phoneNumber,
        images: newPost.images,
      });

      if (response.success) {
        toast.success("Post created successfully");
        setIsCreatePostOpen(false);
        setNewPost({
          title: "",
          description: "",
          price: "",
          category: "",
          condition: "",
          phoneNumber: "",
          images: [],
        });
        fetchPosts();
      } else {
        toast.error(response.message || "Failed to create post");
      }
    } catch (error) {
      toast.error("Failed to create post");
    }
    setIsSubmitting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentImages = newPost.images || [];
    const remainingSlots = 4 - currentImages.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    setIsUploadingImages(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("images", file);
      });

      const response = await marketApi.uploadImages(formData);

      if (response.success && Array.isArray(response.urls) && response.urls.length > 0) {
        setNewPost((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...response.urls],
        }));
        toast.success(`${response.urls.length} image(s) uploaded`);
      } else {
        toast.error(response.message || "Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload images");
    }

    setIsUploadingImages(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setNewPost((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleExportCSV = () => {
    if (posts.length === 0) {
      toast.error("No posts to export");
      return;
    }

    const headers = [
      "ID",
      "Title",
      "Description",
      "Price",
      "Category",
      "Condition",
      "Status",
      "Views",
      "Likes",
      "Comments",
      "Seller",
      "Phone",
      "Created At",
    ];

    const rows = posts.map((post) => [
      post.id,
      `"${post.title.replace(/"/g, '""')}"`,
      `"${post.description.replace(/"/g, '""')}"`,
      post.price,
      getCategoryLabel(post.category),
      post.condition,
      post.status,
      post.views || 0,
      post.like_count || 0,
      post.comment_count || 0,
      post.user_name || "Unknown",
      post.phone_number || "",
      new Date(post.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `market-posts-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Posts exported to CSV");
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/admin"
          className={`inline-flex items-center gap-2 mb-6 ${
            isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Market Management
          </h1>
          <Button
            onClick={() => setIsCreatePostOpen(true)}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "posts" ? "default" : "outline"}
            onClick={() => setActiveTab("posts")}
            className={
              activeTab === "posts" ? "bg-emerald-500 hover:bg-emerald-600" : ""
            }
          >
            <Package className="w-4 h-4 mr-2" />
            Posts
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "outline"}
            onClick={() => setActiveTab("requests")}
            className={
              activeTab === "requests"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : ""
            }
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Buy Requests
          </Button>
          <Button
            variant={activeTab === "chat" ? "default" : "outline"}
            onClick={() => setActiveTab("chat")}
            className={
              activeTab === "chat" ? "bg-emerald-500 hover:bg-emerald-600" : ""
            }
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            className={
              activeTab === "stats" ? "bg-emerald-500 hover:bg-emerald-600" : ""
            }
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Statistics
          </Button>
        </div>

        {activeTab === "posts" && (
          <div>
            <div className="flex gap-4 mb-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-300"
                } border`}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="removed">Removed</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-300"
                } border`}
              >
                <option value="">All Categories</option>
                {MARKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className={`ml-auto ${isDark ? "border-slate-700" : ""}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <Package
                  className={`w-12 h-12 mx-auto mb-3 ${
                    isDark ? "text-slate-700" : "text-slate-300"
                  }`}
                />
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                  No posts found
                </p>
              </div>
            ) : (
              <div
                className={`rounded-xl overflow-hidden ${
                  isDark
                    ? "bg-slate-900 border border-slate-800"
                    : "bg-white border border-slate-200"
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDark ? "bg-slate-800" : "bg-slate-50"}>
                      <tr>
                        <th
                          className={`px-4 py-3 text-left text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Item
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Price
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Category
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Views
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Created
                        </th>
                        <th
                          className={`px-4 py-3 text-right text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}
                    >
                      {posts.map((post) => (
                        <tr
                          key={post.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {post.images && post.images[0] ? (
                                <img
                                  src={post.images[0]}
                                  alt={post.title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    isDark ? "bg-slate-800" : "bg-slate-100"
                                  }`}
                                >
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <div
                                  className={`font-medium ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {post.title}
                                </div>
                                <div
                                  className={`text-xs ${
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }`}
                                >
                                  by {post.user_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-emerald-500">
                              ¥{post.price.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className={isDark ? "bg-slate-800" : ""}
                            >
                              {getCategoryLabel(post.category)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`${getStatusColor(post.status)} text-white border-0`}
                            >
                              {post.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                isDark ? "text-slate-300" : "text-slate-600"
                              }
                            >
                              {post.views || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/market/${post.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            <div className="flex gap-4 mb-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-300"
                } border`}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : buyRequests.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign
                  className={`w-12 h-12 mx-auto mb-3 ${
                    isDark ? "text-slate-700" : "text-slate-300"
                  }`}
                />
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                  No buy requests found
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {buyRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-xl ${
                      isDark
                        ? "bg-slate-900 border border-slate-800"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            isDark ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          <DollarIcon className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3
                            className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {request.post_title}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Buyer: {request.buyer_name}
                            </span>
                            <span
                              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Seller: {request.seller_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-emerald-500 font-medium">
                              ¥{request.total_amount.toLocaleString()}
                            </span>
                            <span
                              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              (¥{request.original_price} + ¥
                              {request.platform_fee} fee)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getStatusColor(request.status)} text-white border-0`}
                        >
                          {request.status}
                        </Badge>
                        {request.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                    <div
                      className={`mt-3 pt-3 border-t ${
                        isDark ? "border-slate-800" : "border-slate-200"
                      }`}
                    >
                      <span
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="text-center py-12">
            <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Market Chat Management
            </h3>
            <p className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              View and manage all buyer-seller conversations
            </p>
            <Link to="/admin/market/chat">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat Management
              </Button>
            </Link>
          </div>
        )}

        {activeTab === "stats" && (
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : stats ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  className={`p-6 rounded-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Total Posts
                      </div>
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {stats.totalPosts}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <div
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Active Posts
                      </div>
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {stats.activePosts}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-amber-500/10">
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Sold Items
                      </div>
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {stats.soldPosts}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <DollarSign className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <div
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Total Buy Requests
                      </div>
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {stats.totalBuyRequests}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <div
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Pending Requests
                      </div>
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {stats.pendingBuyRequests}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <div
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Total Revenue
                      </div>
                      <div className="text-2xl font-bold text-emerald-500">
                        ¥{stats.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setSelectedRequest(null);
            setAdminNotes("");
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Process Buy Request
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Item:
                </span>
                <span
                  className={`ml-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {selectedRequest.post_title}
                </span>
              </div>
              <div>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Buyer:
                </span>
                <span
                  className={`ml-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {selectedRequest.buyer_name}
                </span>
              </div>
              <div>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Seller:
                </span>
                <span
                  className={`ml-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {selectedRequest.seller_name}
                </span>
              </div>
              <div>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Total Amount:
                </span>
                <span className="ml-2 text-emerald-500 font-bold">
                  ¥{selectedRequest.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : ""}`}
              >
                Admin Notes (Optional)
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this transaction..."
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() =>
                  handleProcessRequest(selectedRequest.id, "approved")
                }
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={() =>
                  handleProcessRequest(selectedRequest.id, "completed")
                }
                disabled={isProcessing}
                className="bg-green-500 hover:bg-green-600"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </>
                )}
              </Button>
              <Button
                onClick={() =>
                  handleProcessRequest(selectedRequest.id, "rejected")
                }
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCreatePostOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCreatePostOpen(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Create Market Post
              </h3>
              <button
                onClick={() => setIsCreatePostOpen(false)}
                className={`p-2 rounded-lg ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  placeholder="Item title"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                >
                  Description *
                </label>
                <Textarea
                  value={newPost.description}
                  onChange={(e) =>
                    setNewPost({ ...newPost, description: e.target.value })
                  }
                  placeholder="Describe your item..."
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Price (¥) *
                  </label>
                  <input
                    type="number"
                    value={newPost.price}
                    onChange={(e) =>
                      setNewPost({ ...newPost, price: e.target.value })
                    }
                    placeholder="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Category *
                  </label>
                  <select
                    value={newPost.category}
                    onChange={(e) =>
                      setNewPost({ ...newPost, category: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    <option value="">Select category</option>
                    {MARKET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Condition
                  </label>
                  <select
                    value={newPost.condition}
                    onChange={(e) =>
                      setNewPost({ ...newPost, condition: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newPost.phoneNumber}
                    onChange={(e) =>
                      setNewPost({ ...newPost, phoneNumber: e.target.value })
                    }
                    placeholder="Contact number"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`text-sm font-medium mb-1 block ${isDark ? "text-slate-300" : ""}`}
                >
                  Images (Max 4)
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(newPost.images || []).map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {(newPost.images || []).length < 4 && (
                  <label
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                      isDark
                        ? "border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                        : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {isUploadingImages ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                          Add Images
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isUploadingImages}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreatePostOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMarketPage() {
  return (
    <AdminGuard>
      <AdminMarketContent />
    </AdminGuard>
  );
}
