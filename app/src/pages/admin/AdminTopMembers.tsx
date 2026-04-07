import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Trophy,
  Crown,
  Medal,
  Star,
  TrendingUp,
  Calendar,
  Trash2,
  Gift,
  Users,
  BarChart3,
  Target,
  Flame,
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface TopMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  student_id: string;
  activity_score: number;
  rank: number;
  period: "weekly" | "monthly" | "all_time";
  badge_name: string;
  badge_icon: string;
  prize?: string;
  created_at: string;
  stats: {
    hsk_quizzes: number;
    discord_messages: number;
    language_exchanges: number;
    posts: number;
    likes: number;
    comments: number;
    schedule_views: number;
  };
}

const rankBadges = [
  {
    rank: 1,
    name: "Champion",
    icon: "👑",
    color: "from-amber-400 to-yellow-500",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-400",
  },
  {
    rank: 2,
    name: "Runner-up",
    icon: "🥈",
    color: "from-slate-300 to-gray-400",
    bgColor: "bg-slate-400/20",
    textColor: "text-slate-300",
  },
  {
    rank: 3,
    name: "Third Place",
    icon: "🥉",
    color: "from-orange-400 to-amber-500",
    bgColor: "bg-orange-500/20",
    textColor: "text-orange-400",
  },
];

const activityIcons = {
  hsk_quizzes: Target,
  discord_messages: Flame,
  language_exchanges: Users,
  posts: BarChart3,
  likes: Star,
  comments: Medal,
  schedule_views: Calendar,
};

function AdminTopMembers() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "monthly" | "all_time"
  >("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    member: TopMember | null;
  }>({ open: false, member: null });
  const [prizeDialog, setPrizeDialog] = useState<{
    open: boolean;
    member: TopMember | null;
  }>({ open: false, member: null });
  const [prizeInput, setPrizeInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopMembers();
  }, [selectedPeriod]);

  const fetchTopMembers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/admin/top-members?period=${selectedPeriod}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setTopMembers(data.data);
      }
    } catch (error) {
      console.error("Error fetching top members:", error);
      toast.error("Failed to fetch top members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/admin/top-members/calculate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period: selectedPeriod }),
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Top members recalculated successfully");
        fetchTopMembers();
      }
    } catch (error) {
      console.error("Error refreshing top members:", error);
      toast.error("Failed to refresh top members");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.member) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/admin/top-members/${deleteDialog.member.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Top member removed successfully");
        setTopMembers(
          topMembers.filter((m) => m.id !== deleteDialog.member?.id),
        );
        setDeleteDialog({ open: false, member: null });
      }
    } catch (error) {
      console.error("Error deleting top member:", error);
      toast.error("Failed to remove top member");
    }
  };

  const handleAssignPrize = async () => {
    if (!prizeDialog.member || !prizeInput.trim()) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/admin/top-members/${prizeDialog.member.id}/prize`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prize: prizeInput }),
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Prize assigned successfully");
        setTopMembers(
          topMembers.map((m) =>
            m.id === prizeDialog.member?.id ? { ...m, prize: prizeInput } : m,
          ),
        );
        setPrizeDialog({ open: false, member: null });
        setPrizeInput("");
      }
    } catch (error) {
      console.error("Error assigning prize:", error);
      toast.error("Failed to assign prize");
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all top members for this period?",
      )
    )
      return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/admin/top-members?period=${selectedPeriod}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("All top members cleared");
        setTopMembers([]);
      }
    } catch (error) {
      console.error("Error clearing top members:", error);
      toast.error("Failed to clear top members");
    }
  };

  const filteredMembers = topMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getRankBadge = (rank: number) => {
    return (
      rankBadges.find((b) => b.rank === rank) || {
        name: `Rank ${rank}`,
        icon: "🏆",
        color: "from-indigo-400 to-purple-500",
        bgColor: "bg-indigo-500/20",
        textColor: "text-indigo-400",
      }
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Top Members Management
                </h1>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Manage weekly, monthly, and all-time top performing members
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"} shadow-lg`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {topMembers.filter((m) => m.period === "weekly").length}
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Weekly Top Members
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"} shadow-lg`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {topMembers.filter((m) => m.period === "monthly").length}
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Monthly Top Members
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"} shadow-lg`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {topMembers.filter((m) => m.period === "all_time").length}
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  All-Time Top Members
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div
          className={`p-6 rounded-2xl border mb-6 ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"} shadow-lg`}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <Filter
                className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              />
              <Select
                value={selectedPeriod}
                onValueChange={(value) =>
                  setSelectedPeriod(value as "weekly" | "monthly" | "all_time")
                }
              >
                <SelectTrigger
                  className={`w-40 ${isDark ? "bg-slate-700 border-slate-600" : "bg-slate-100 border-slate-200"}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              />
              <Input
                placeholder="Search by name, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${isDark ? "bg-slate-700 border-slate-600" : "bg-slate-100 border-slate-200"}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Recalculate
              </Button>
              <Button
                onClick={handleClearAll}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-rose-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Top Members List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div
            className={`p-12 rounded-2xl border text-center ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}
          >
            <Trophy
              className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
            />
            <h3
              className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              No Top Members Yet
            </h3>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Click "Recalculate" to generate top members based on activity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => {
              const badge = getRankBadge(member.rank);
              return (
                <div
                  key={member.id}
                  className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
                    isDark
                      ? "bg-slate-800/50 border-white/10 hover:border-white/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank & User Info */}
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div
                        className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${badge.color} shadow-lg`}
                      >
                        {badge.icon}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-14 h-14 ring-2 ring-offset-2 ring-amber-500/50">
                        {member.avatar_url ? (
                          <AvatarImage src={member.avatar_url} />
                        ) : (
                          <AvatarFallback
                            className={`bg-gradient-to-br ${badge.color} text-white text-lg font-bold`}
                          >
                            {member.full_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {member.full_name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.bgColor} ${badge.textColor}`}
                          >
                            {badge.name}
                          </span>
                          {member.prize && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              {member.prize}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {member.department} • {member.student_id}
                        </p>
                        <p
                          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          Activity Score:{" "}
                          <span className="font-bold text-amber-500">
                            {member.activity_score}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 max-w-md">
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(member.stats).map(([key, value]) => {
                          const Icon =
                            activityIcons[key as keyof typeof activityIcons];
                          return (
                            <div
                              key={key}
                              className={`p-2 rounded-lg text-center ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                            >
                              <Icon
                                className={`w-4 h-4 mx-auto mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              />
                              <p
                                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {value}
                              </p>
                              <p
                                className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                {key.replace("_", " ")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setPrizeInput(member.prize || "");
                          setPrizeDialog({ open: true, member });
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-teal-600"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Prize
                      </Button>
                      <Button
                        onClick={() => setDeleteDialog({ open: true, member })}
                        size="sm"
                        variant="destructive"
                        className="bg-gradient-to-r from-red-500 to-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog({ open, member: deleteDialog.member })
          }
        >
          <DialogContent
            className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Remove Top Member
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <strong>{deleteDialog.member?.full_name}</strong> from the top
                members list? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, member: null })}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Prize Assignment Dialog */}
        <Dialog
          open={prizeDialog.open}
          onOpenChange={(open) =>
            setPrizeDialog({ open, member: prizeDialog.member })
          }
        >
          <DialogContent
            className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-500" />
                Assign Prize
              </DialogTitle>
              <DialogDescription>
                Assign a prize to{" "}
                <strong>{prizeDialog.member?.full_name}</strong> for their
                achievement.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter prize (e.g., Gift Card, Certificate, etc.)"
                value={prizeInput}
                onChange={(e) => setPrizeInput(e.target.value)}
                className={
                  isDark
                    ? "bg-slate-700 border-slate-600"
                    : "bg-slate-100 border-slate-200"
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPrizeDialog({ open: false, member: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignPrize}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Assign Prize
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AdminTopMembers;
