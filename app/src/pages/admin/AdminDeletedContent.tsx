import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { adminDeletedContentApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/AuthGuard";
import {
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileText,
  MessageCircle,
  MessageSquare,
  ShoppingCart,
  Globe,
  Database,
  HardDrive,
  Loader2,
  Eye,
  X,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DeletedItem {
  id: string;
  type: string;
  content?: string;
  title?: string;
  description?: string;
  author_name?: string;
  author_id?: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  post_id?: string;
  user_id?: string;
  sender_id?: string;
  images?: string;
  [key: string]: unknown;
}

interface StorageStats {
  posts: { active: number; deleted: number };
  comments: { active: number; deleted: number };
  discordMessages: { active: number; deleted: number };
  languageExchangeMessages: { active: number; deleted: number };
  marketPosts: { active: number; deleted: number };
  totalDeleted: number;
}

function AdminDeletedContentPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user: currentUser } = useAuth();

  const [items, setItems] = useState<DeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<DeletedItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const itemsPerPage = 20;

  const loadDeletedContent = useCallback(async () => {
    setIsLoading(true);
    const typeParam = selectedType === "all" ? undefined : selectedType;
    const response = await adminDeletedContentApi.getDeletedContent(
      typeParam,
      searchQuery,
      currentPage,
      itemsPerPage,
    );
    if (response.success && response.data) {
      setItems(response.data.items || []);
      setTotalItems(response.data.pagination?.total || 0);
      setHasMore(response.data.pagination?.hasMore || false);
    } else {
      toast.error(response.message || "Failed to load deleted content");
    }
    setIsLoading(false);
  }, [selectedType, searchQuery, currentPage]);

  const loadStorageStats = useCallback(async () => {
    const response = await adminDeletedContentApi.getStorageStats();
    if (response.success && response.data) {
      setStorageStats(response.data);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchQuery]);

  useEffect(() => {
    loadDeletedContent();
    loadStorageStats();
  }, [
    selectedType,
    searchQuery,
    currentPage,
    loadDeletedContent,
    loadStorageStats,
  ]);

  const handleHardDelete = async (item: DeletedItem) => {
    if (
      !window.confirm(
        `Are you sure you want to PERMANENTLY delete this ${item.type}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    let response;

    switch (item.type) {
      case "post":
        response = await adminDeletedContentApi.hardDeletePost(item.id);
        break;
      case "comment":
        response = await adminDeletedContentApi.hardDeleteComment(item.id);
        break;
      case "market_post":
        response = await adminDeletedContentApi.hardDeleteMarketPost(item.id);
        break;
      case "discord_message":
        response = await adminDeletedContentApi.hardDeleteDiscordMessage(
          item.id,
        );
        break;
      case "language_exchange_message":
        response =
          await adminDeletedContentApi.hardDeleteLanguageExchangeMessage(
            item.id,
          );
        break;
      default:
        toast.error("Unknown content type");
        setIsDeleting(false);
        return;
    }

    if (response.success) {
      toast.success(`${item.type} permanently deleted`);
      loadDeletedContent();
      loadStorageStats();
      setIsDetailDialogOpen(false);
      setSelectedItem(null);
    } else {
      toast.error(response.message || "Failed to delete");
    }
    setIsDeleting(false);
  };

  const handleRestore = async (item: DeletedItem) => {
    if (
      !window.confirm(
        `Are you sure you want to RESTORE this ${item.type}? It will be visible again.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    let response;

    switch (item.type) {
      case "post":
        response = await adminDeletedContentApi.restorePost(item.id);
        break;
      case "comment":
        response = await adminDeletedContentApi.restoreComment(item.id);
        break;
      case "market_post":
        response = await adminDeletedContentApi.restoreMarketPost(item.id);
        break;
      case "discord_message":
        response = await adminDeletedContentApi.restoreDiscordMessage(item.id);
        break;
      case "language_exchange_message":
        response = await adminDeletedContentApi.restoreLanguageExchangeMessage(
          item.id,
        );
        break;
      default:
        toast.error("Unknown content type");
        setIsDeleting(false);
        return;
    }

    if (response.success) {
      toast.success(`${item.type} restored successfully`);
      loadDeletedContent();
      loadStorageStats();
      setIsDetailDialogOpen(false);
      setSelectedItem(null);
    } else {
      toast.error(response.message || "Failed to restore");
    }
    setIsDeleting(false);
  };

  const handleBulkCleanup = async () => {
    setIsCleaningUp(true);
    const response = await adminDeletedContentApi.bulkCleanup(cleanupDays);
    if (response.success) {
      toast.success(response.message || "Cleanup completed");
      loadDeletedContent();
      loadStorageStats();
      setIsCleanupDialogOpen(false);
    } else {
      toast.error(response.message || "Cleanup failed");
    }
    setIsCleaningUp(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="w-4 h-4" />;
      case "comment":
        return <MessageCircle className="w-4 h-4" />;
      case "market_post":
        return <ShoppingCart className="w-4 h-4" />;
      case "discord_message":
        return <MessageSquare className="w-4 h-4" />;
      case "language_exchange_message":
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "post":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "comment":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "market_post":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "discord_message":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "language_exchange_message":
        return "bg-teal-500/20 text-teal-400 border-teal-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "No content";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex">
        <aside
          className={`w-64 min-h-screen ${
            isDark ? "bg-slate-900" : "bg-white border-r border-slate-200"
          }`}
        >
          <div className="p-6">
            <Link
              to="/admin"
              className={`flex items-center gap-3 mb-10 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Deleted Content</h1>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Admin Panel
                </p>
              </div>
            </Link>

            <Link
              to="/admin"
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Deleted Content Management
                </h1>
                <p
                  className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  View and permanently delete soft-deleted content to save
                  storage
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    loadDeletedContent();
                    loadStorageStats();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const csvContent = [
                      ["Type", "ID", "Content", "Author", "Deleted At"].join(
                        ",",
                      ),
                      ...items.map((item) =>
                        [
                          item.type,
                          item.id,
                          `"${(item.content || item.title || item.description || "").replace(/"/g, '""')}"`,
                          item.author_name || "Unknown",
                          item.deleted_at || "N/A",
                        ].join(","),
                      ),
                    ].join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `deleted-content-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success("Exported to CSV");
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setIsCleanupDialogOpen(true)}
                  className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  <Database className="w-4 h-4" />
                  Bulk Cleanup
                </Button>
              </div>
            </div>

            {storageStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Posts
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {storageStats.posts.deleted}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {storageStats.posts.active} active
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Comments
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {storageStats.comments.deleted}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {storageStats.comments.active} active
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-purple-500" />
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Market
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {storageStats.marketPosts.deleted}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {storageStats.marketPosts.active} active
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Discord
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {storageStats.discordMessages.deleted}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {storageStats.discordMessages.active} active
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-teal-500" />
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Lang Exchange
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {storageStats.languageExchangeMessages.deleted}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {storageStats.languageExchangeMessages.active} active
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="w-4 h-4 text-red-500" />
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Total Deleted
                    </span>
                  </div>
                  <p className={`text-2xl font-bold text-red-500`}>
                    {storageStats.totalDeleted}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    items in trash
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger
                  className={`w-48 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}
                >
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                  <SelectItem value="market_posts">Market Posts</SelectItem>
                  <SelectItem value="discord_messages">
                    Discord Messages
                  </SelectItem>
                  <SelectItem value="language_exchange_messages">
                    Language Exchange
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-md">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
                <input
                  type="text"
                  placeholder="Search by content, author, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                      : "bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              className={`rounded-xl ${
                isDark ? "bg-slate-800" : "bg-white border border-slate-200"
              } overflow-hidden`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Trash2
                    className={`w-16 h-16 mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                  />
                  <p
                    className={`text-lg font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No deleted content found
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {selectedType === "all"
                      ? "The trash is empty"
                      : `No deleted ${selectedType} found`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {items.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`p-4 flex items-center justify-between hover:${
                        isDark ? "bg-slate-700/50" : "bg-slate-50"
                      } transition-colors`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-2 rounded-lg ${getTypeColor(item.type)}`}
                        >
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={getTypeColor(item.type)}
                            >
                              {item.type.replace("_", " ")}
                            </Badge>
                            {item.author_name && (
                              <span
                                className={`text-sm ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                by {item.author_name}
                              </span>
                            )}
                          </div>
                          <p
                            className={`truncate ${
                              isDark ? "text-slate-200" : "text-slate-700"
                            }`}
                          >
                            {truncateText(
                              item.content ||
                                item.title ||
                                item.description ||
                                "",
                            )}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Deleted:{" "}
                            {item.deleted_at
                              ? formatDate(item.deleted_at)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item)}
                          className="gap-1 text-green-500 border-green-500 hover:bg-green-500/10"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleHardDelete(item)}
                          className="gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hard Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalItems > itemsPerPage && (
              <div
                className={`flex items-center justify-between mt-4 p-4 rounded-xl ${isDark ? "bg-slate-800" : "bg-white border border-slate-200"}`}
              >
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span
                    className={`px-3 py-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent
          className={isDark ? "bg-slate-900 border-slate-700" : ""}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              Deleted Content Details
            </DialogTitle>
            <DialogDescription>
              View details and permanently delete this content
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={getTypeColor(selectedItem.type)}
                >
                  {selectedItem.type.replace("_", " ")}
                </Badge>
              </div>
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  <strong>ID:</strong> {selectedItem.id}
                </p>
                {selectedItem.author_name && (
                  <p
                    className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    <strong>Author:</strong> {selectedItem.author_name}
                  </p>
                )}
                {selectedItem.created_at && (
                  <p
                    className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedItem.created_at)}
                  </p>
                )}
                {selectedItem.deleted_at && (
                  <p
                    className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    <strong>Deleted:</strong>{" "}
                    {formatDate(selectedItem.deleted_at)}
                  </p>
                )}
              </div>
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <p
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Content:
                </p>
                <p
                  className={`text-sm whitespace-pre-wrap ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {selectedItem.content ||
                    selectedItem.title ||
                    selectedItem.description ||
                    "No content available"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedItem && handleRestore(selectedItem)}
              disabled={isDeleting}
              className="gap-2 text-green-500 border-green-500 hover:bg-green-500/10"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Restore
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleHardDelete(selectedItem)}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Hard Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
        <DialogContent
          className={isDark ? "bg-slate-900 border-slate-700" : ""}
        >
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-2 ${isDark ? "text-white" : ""}`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Bulk Cleanup
            </DialogTitle>
            <DialogDescription>
              Permanently delete all soft-deleted content older than a specified
              number of days
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              This will permanently remove all content that was deleted more
              than the specified number of days ago. This action cannot be
              undone.
            </p>
            <div className="flex items-center gap-4">
              <label
                className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Delete content older than:
              </label>
              <Select
                value={cleanupDays.toString()}
                onValueChange={(v) => setCleanupDays(parseInt(v))}
              >
                <SelectTrigger
                  className={`w-32 ${isDark ? "bg-slate-800 border-slate-700" : ""}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCleanupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkCleanup}
              disabled={isCleaningUp}
              className="gap-2"
            >
              {isCleaningUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Run Cleanup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDeletedContent() {
  return (
    <AdminGuard>
      <AdminDeletedContentPage />
    </AdminGuard>
  );
}
