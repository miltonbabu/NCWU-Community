import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Flag,
  Search,
  Ban,
  Unlock,
  Clock,
  User,
  AlertTriangle,
  MessageSquare,
  Users,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  Home,
  ArrowLeft,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

interface FlagData {
  id: string;
  user_id: string;
  flag_type: string;
  reason: string;
  source: string;
  source_id: string | null;
  content_preview: string | null;
  detected_words: string[];
  restriction_type: string;
  restriction_days: number;
  restricted_features: string[];
  restricted_at: string;
  restriction_ends_at: string | null;
  is_active: number;
  created_at: string;
  admin_id: string | null;
  user_name: string | null;
  user_student_id: string | null;
  user_avatar_url: string | null;
  admin_name: string | null;
  appeal_message: string | null;
  appeal_submitted_at: string | null;
  appeal_status: string;
  appeal_reviewed_at: string | null;
  appeal_reviewed_by: string | null;
}

interface FlagStats {
  totalFlags: number;
  activeRestrictions: number;
  expiredRestrictions: number;
  bySource: { source: string; count: number }[];
}

interface FlagsResponse {
  flags: FlagData[];
  total: number;
}

const ITEMS_PER_PAGE = 10;

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FlagData[]>([]);
  const [stats, setStats] = useState<FlagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlag, setSelectedFlag] = useState<FlagData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [banDays, setBanDays] = useState<number>(7);
  const [deleting, setDeleting] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: statusFilter,
      });
      if (sourceFilter !== "all") {
        params.append("source", sourceFilter);
      }

      const response = await adminApi.getFlags(params.toString());
      if (response.success && response.data) {
        setFlags(response.data.flags);
        setTotalPages(
          Math.ceil(response.data.pagination.total / ITEMS_PER_PAGE),
        );
      }
    } catch (error) {
      console.error("Error fetching flags:", error);
      toast.error("Failed to fetch flags");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sourceFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApi.getFlagStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching flag stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    fetchStats();
  }, [page, statusFilter, sourceFilter, fetchFlags, fetchStats]);

  const handleBan = async () => {
    if (!selectedFlag) return;

    try {
      const response = await adminApi.extendBan(selectedFlag.id, banDays);
      if (response.success) {
        toast.success(
          `Ban extended by ${banDays === 36500 ? "lifetime" : `${banDays} days`}`,
        );
        fetchFlags();
        fetchStats();
        setShowBanDialog(false);
        setSelectedFlag(null);
      } else {
        toast.error(response.message || "Failed to extend ban");
      }
    } catch (error) {
      console.error("Error extending ban:", error);
      toast.error("Failed to extend ban");
    }
  };

  const handleUnban = async (flagId: string) => {
    try {
      const response = await adminApi.unbanUserFlag(flagId);
      if (response.success) {
        toast.success("User unbanned successfully");
        fetchFlags();
        fetchStats();
      } else {
        toast.error(response.message || "Failed to unban user");
      }
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    }
  };

  const handleDeleteFlag = async () => {
    if (!selectedFlag) return;
    setDeleting(true);
    try {
      const response = await adminApi.deleteFlag(selectedFlag.id);
      if (response.success) {
        toast.success("Flag data deleted successfully");
        fetchFlags();
        fetchStats();
        setShowDeleteDialog(false);
        setSelectedFlag(null);
      } else {
        toast.error(response.message || "Failed to delete flag");
      }
    } catch (error) {
      console.error("Error deleting flag:", error);
      toast.error("Failed to delete flag");
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveAppeal = async (flagId: string) => {
    try {
      const response = await adminApi.approveAppeal(flagId);
      if (response.success) {
        toast.success("Appeal approved - restriction lifted");
        fetchFlags();
        fetchStats();
      } else {
        toast.error(response.message || "Failed to approve appeal");
      }
    } catch (error) {
      console.error("Error approving appeal:", error);
      toast.error("Failed to approve appeal");
    }
  };

  const handleRejectAppeal = async (flagId: string) => {
    try {
      const response = await adminApi.rejectAppeal(flagId);
      if (response.success) {
        toast.success("Appeal rejected");
        fetchFlags();
        fetchStats();
      } else {
        toast.error(response.message || "Failed to reject appeal");
      }
    } catch (error) {
      console.error("Error rejecting appeal:", error);
      toast.error("Failed to reject appeal");
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "social_post":
      case "social_comment":
        return <MessageSquare className="w-4 h-4" />;
      case "discord":
        return <Users className="w-4 h-4" />;
      case "language_exchange":
        return <Globe className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      social_post: "Social Post",
      social_comment: "Social Comment",
      discord: "Discord",
      language_exchange: "Language Exchange",
    };
    return labels[source] || source;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Lifetime";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (flag: FlagData) => {
    if (!flag.restriction_ends_at) return false;
    return new Date(flag.restriction_ends_at) < new Date();
  };

  const filteredFlags = flags.filter((flag) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        flag.user_name?.toLowerCase().includes(query) ||
        flag.user_student_id?.toLowerCase().includes(query) ||
        flag.reason.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-7 h-7 text-rose-500" />
                Flag Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Manage flagged users and content restrictions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Flags
                  </p>
                  <p className="text-3xl font-bold mt-1">{stats.totalFlags}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Flag className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    Active Restrictions
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.activeRestrictions}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Ban className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">
                    Expired
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.expiredRestrictions}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Unlock className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">
                    Social Flags
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.bySource?.find((s) => s.source === "social_post")
                      ?.count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, student ID, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-800"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="social_post">Social Post</SelectItem>
                  <SelectItem value="social_comment">Social Comment</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="language_exchange">
                    Language Exchange
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                Loading flags...
              </p>
            </div>
          ) : filteredFlags.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                No flags found
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          flag.is_active && !isExpired(flag)
                            ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500"
                            : "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        {flag.user_avatar_url ? (
                          <img
                            src={flag.user_avatar_url}
                            alt={flag.user_name || "User"}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                        ) : (
                          <User
                            className={`w-5 h-5 ${
                              flag.is_active && !isExpired(flag)
                                ? "text-red-600 dark:text-red-400"
                                : "text-slate-500"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {flag.user_name || "Unknown User"}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            ({flag.user_student_id})
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              flag.is_active && !isExpired(flag)
                                ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                                : "border-slate-300 text-slate-500"
                            }`}
                          >
                            {getSourceIcon(flag.source)}
                            <span className="ml-1">
                              {getSourceLabel(flag.source)}
                            </span>
                          </Badge>
                          {flag.is_active && !isExpired(flag) ? (
                            <Badge className="bg-red-500 text-white text-xs hover:bg-red-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                            >
                              Expired
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                          {flag.reason}
                        </p>
                        {flag.detected_words &&
                          flag.detected_words.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {flag.detected_words
                                .slice(0, 5)
                                .map((word, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs font-medium"
                                  >
                                    {word}
                                  </span>
                                ))}
                              {flag.detected_words.length > 5 && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md text-xs">
                                  +{flag.detected_words.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(flag.restriction_ends_at)}
                          </span>
                          <span>{flag.restriction_days} days</span>
                        </div>

                        {/* Appeal Section */}
                        {flag.appeal_status === "pending" && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                Appeal Pending
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                              {flag.appeal_message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              Submitted: {formatDate(flag.appeal_submitted_at)}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveAppeal(flag.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectAppeal(flag.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {flag.appeal_status === "approved" && (
                          <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                              Appeal approved - restriction lifted
                            </span>
                          </div>
                        )}

                        {flag.appeal_status === "rejected" && (
                          <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex items-center gap-2">
                            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm text-red-700 dark:text-red-300">
                              Appeal rejected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFlag(flag);
                          setShowDetails(true);
                        }}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {flag.is_active && !isExpired(flag) ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFlag(flag);
                              setShowBanDialog(true);
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Extend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnban(flag.id)}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <Unlock className="w-4 h-4 mr-1" />
                            Unban
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFlag(flag);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-white dark:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="bg-white dark:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                Flag Details
              </DialogTitle>
            </DialogHeader>
            {selectedFlag && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    {selectedFlag.user_avatar_url ? (
                      <img
                        src={selectedFlag.user_avatar_url}
                        alt={selectedFlag.user_name || "User"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedFlag.user_name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedFlag.user_student_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Reason
                    </p>
                    <p className="text-slate-900 dark:text-white">
                      {selectedFlag.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Source
                    </p>
                    <p className="text-slate-900 dark:text-white">
                      {getSourceLabel(selectedFlag.source)}
                    </p>
                  </div>

                  {selectedFlag.content_preview && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Content Preview
                      </p>
                      <p className="text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                        {selectedFlag.content_preview}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Detected Words
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedFlag.detected_words.map((word, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm font-medium"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Restriction Days
                      </p>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {selectedFlag.restriction_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Ends At
                      </p>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {formatDate(selectedFlag.restriction_ends_at)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Restricted Features
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedFlag.restricted_features.map(
                        (feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Ban Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                Extend Ban Duration
              </DialogTitle>
              <DialogDescription>
                Select the additional duration to extend this user's ban.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[3, 7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    variant={banDays === days ? "default" : "outline"}
                    onClick={() => setBanDays(days)}
                    className="w-full"
                  >
                    {days} days
                  </Button>
                ))}
                <Button
                  variant={banDays === 36500 ? "default" : "outline"}
                  onClick={() => setBanDays(36500)}
                  className="w-full col-span-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  Lifetime
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBan}
                className="bg-red-600 hover:bg-red-700"
              >
                Extend Ban
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Flag Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Delete Flag Data
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this flag record? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedFlag && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">User:</span>{" "}
                  {selectedFlag.user_name || "Unknown"} (
                  {selectedFlag.user_student_id})
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-medium">Reason:</span>{" "}
                  {selectedFlag.reason}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteFlag}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete Flag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
