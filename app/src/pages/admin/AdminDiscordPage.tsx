import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { adminDiscordApi } from "../../lib/api";
import type {
  DiscordGroup,
  DiscordGroupMember,
  AdminDiscordMessage,
  AdminDiscordUser,
  DiscordGroupStats,
  DiscordBan,
} from "../../types/discord";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  MessageSquare,
  Users,
  Hash,
  Trash2,
  Search,
  Eye,
  Circle,
  Plus,
  Activity,
  X,
  Ban,
  ShieldOff,
  UserX,
  Calendar,
  UsersRound,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export default function AdminDiscordPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DiscordGroupStats | null>(null);
  const [groups, setGroups] = useState<DiscordGroup[]>([]);
  const [messages, setMessages] = useState<AdminDiscordMessage[]>([]);
  const [users, setUsers] = useState<AdminDiscordUser[]>([]);
  const [bans, setBans] = useState<DiscordBan[]>([]);
  const [groupMembers, setGroupMembers] = useState<DiscordGroupMember[]>([]);

  const [groupsLoading, setGroupsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bansLoading, setBansLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<
    string | null
  >(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [newGroup, setNewGroup] = useState({
    name: "",
    type: "department",
    department: "",
    year: new Date().getFullYear(),
    description: "",
  });

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserForBan, setSelectedUserForBan] =
    useState<AdminDiscordUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banGroupId, setBanGroupId] = useState<string>("");
  const [banExpiresAt, setBanExpiresAt] = useState<string>("");

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

  const loadStats = useCallback(async () => {
    try {
      const response = await adminDiscordApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      toast.error("Failed to load stats");
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      setGroupsLoading(true);
      const response = await adminDiscordApi.getGroups(1, 100, filter, search);
      if (response.success && response.data) {
        const groupsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).groups || [];
        setGroups(groupsData);
      }
    } catch (error) {
      toast.error("Failed to load groups");
    } finally {
      setGroupsLoading(false);
    }
  }, [filter, search]);

  const loadMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const response = await adminDiscordApi.getMessages(
        1,
        50,
        selectedGroup ?? undefined,
        false,
        search,
      );
      if (response.success && response.data) {
        const messagesData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).messages || [];
        setMessages(messagesData);
      }
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedGroup, search]);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await adminDiscordApi.getUsers(
        1,
        100,
        false,
        userSearch,
      );
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).users || [];
        setUsers(usersData);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  const loadBans = useCallback(async () => {
    try {
      setBansLoading(true);
      const response = await adminDiscordApi.getBans();
      if (response.success && response.data) {
        const bansData = Array.isArray(response.data) ? response.data : [];
        setBans(bansData);
      }
    } catch (error) {
      toast.error("Failed to load bans");
    } finally {
      setBansLoading(false);
    }
  }, []);

  const loadGroupMembers = useCallback(async (groupId: string) => {
    try {
      setMembersLoading(true);
      const response = await adminDiscordApi.getGroupMembers(groupId);
      if (response.success && response.data) {
        setGroupMembers(response.data || []);
      }
    } catch (error) {
      toast.error("Failed to load group members");
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      user &&
      (user.is_admin || user.role === "admin" || user.role === "superadmin")
    ) {
      loadStats();
      loadGroups();
      loadMessages();
      loadUsers();
      loadBans();
    }
  }, [user, loadStats, loadGroups, loadMessages, loadUsers, loadBans]);

  useEffect(() => {
    if (selectedGroupForMembers) {
      loadGroupMembers(selectedGroupForMembers);
    }
  }, [selectedGroupForMembers, loadGroupMembers]);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?") || !user)
      return;

    try {
      const response = await adminDiscordApi.deleteGroup(groupId);
      if (response.success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (selectedGroup === groupId) {
          setSelectedGroup(null);
          loadMessages();
        }
        loadStats();
        toast.success("Group deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const handleDeleteGroupMessages = async (groupId: string) => {
    if (
      !confirm("Are you sure you want to delete all messages in this group?") ||
      !user
    )
      return;

    try {
      const response = await adminDiscordApi.deleteGroupMessages(groupId);
      if (response.success) {
        if (selectedGroup === groupId) {
          loadMessages();
        }
        loadStats();
        toast.success("All messages deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete messages");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const response = await adminDiscordApi.deleteMessage(messageId);
      if (response.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        loadStats();
        toast.success("Message deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.type || !user) return;

    try {
      const response = await adminDiscordApi.createGroup(newGroup);
      if (response.success && response.data) {
        setGroups((prev) => [response.data!, ...prev]);
        setNewGroup({
          name: "",
          type: "department",
          department: "",
          year: new Date().getFullYear(),
          description: "",
        });
        setCreateDialogOpen(false);
        loadStats();
        toast.success("Group created successfully");
      }
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserForBan || !banReason) return;

    try {
      const response = await adminDiscordApi.createBan({
        user_id: selectedUserForBan.user_id,
        group_id: banGroupId || undefined,
        reason: banReason,
        expires_at: banExpiresAt || undefined,
      });

      if (response.success) {
        toast.success("User banned successfully");
        loadBans();
        loadStats();
        loadUsers();
        setBanDialogOpen(false);
        setBanReason("");
        setBanGroupId("");
        setBanExpiresAt("");
        setSelectedUserForBan(null);
      }
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string, groupId?: string) => {
    try {
      const response = await adminDiscordApi.deleteBan(userId, groupId);
      if (response.success) {
        toast.success("User unbanned successfully");
        loadBans();
        loadStats();
        loadUsers();
      }
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const openBanDialog = (u: AdminDiscordUser) => {
    setSelectedUserForBan(u);
    setBanDialogOpen(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (
    !user ||
    (!user.is_admin && user.role !== "admin" && user.role !== "superadmin")
  ) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access this page
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Discord Administration
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage groups, messages, users & bans
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/discord">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Discord
                </Button>
              </Link>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Groups
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {stats?.total_groups || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Messages
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {stats?.total_messages || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Members
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {stats?.total_members || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Banned
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {stats?.total_banned || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Circle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {stats?.active_users_today || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="groups" className="h-full flex flex-col">
          <div className="max-w-7xl mx-auto px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <TabsTrigger
                  value="groups"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Groups
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="bans"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Bans
                  {bans.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 text-xs bg-red-500"
                    >
                      {bans.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 w-[200px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (selectedGroup ? loadMessages() : loadGroups())
                    }
                  />
                </div>

                <Select
                  value={filter || "all-types"}
                  onValueChange={(value) =>
                    setFilter(value === "all-types" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-[150px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">All Types</SelectItem>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Groups Tab */}
          <TabsContent value="groups" className="flex-1 overflow-hidden px-6">
            <div className="max-w-7xl mx-auto h-full">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-3 py-2">
                  {groupsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Hash className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        No groups found
                      </p>
                    </div>
                  ) : (
                    groups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-900 dark:text-white">
                                {group.name}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {group.type === "department"
                                  ? `${group.department} - ${group.year}`
                                  : group.type === "all"
                                    ? "All Students"
                                    : "Custom Group"}
                              </p>
                              {group.description && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() =>
                                    setSelectedGroupForMembers(group.id)
                                  }
                                >
                                  <UsersRound className="h-4 w-4 mr-1" />
                                  {group.member_count}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <UsersRound className="h-5 w-5" />
                                    {group.name} - Members
                                  </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[400px]">
                                  <div className="space-y-2">
                                    {membersLoading ? (
                                      <div className="animate-pulse space-y-2">
                                        {[...Array(5)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="flex items-center gap-3 p-2"
                                          >
                                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                            <div className="flex-1">
                                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : groupMembers.length === 0 ? (
                                      <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                                        No members in this group
                                      </p>
                                    ) : (
                                      groupMembers.map((member) => (
                                        <div
                                          key={member.user_id}
                                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"
                                        >
                                          <div className="relative">
                                            <Avatar className="h-8 w-8">
                                              {member.avatar_url ? (
                                                <AvatarImage
                                                  src={member.avatar_url}
                                                />
                                              ) : null}
                                              <AvatarFallback className="text-xs">
                                                {member.full_name
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div
                                              className={cn(
                                                "absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white dark:border-slate-800",
                                                member.is_online
                                                  ? "bg-green-500"
                                                  : "bg-gray-400",
                                              )}
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              {member.display_name ||
                                                member.full_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                              {member.student_id} ·{" "}
                                              {member.department}
                                            </p>
                                          </div>
                                          {member.show_as_admin && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              Admin
                                            </Badge>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() =>
                                handleDeleteGroupMessages(group.id)
                              }
                              title="Delete all messages"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteGroup(group.id)}
                              title="Delete group"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 overflow-hidden px-6">
            <div className="max-w-7xl mx-auto h-full">
              <div className="mb-4 pt-2">
                <Select
                  value={selectedGroup || "all-groups"}
                  onValueChange={(value) => {
                    setSelectedGroup(value === "all-groups" ? null : value);
                    loadMessages();
                  }}
                >
                  <SelectTrigger className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select a group to view messages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-groups">All Groups</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[calc(100vh-440px)]">
                <div className="space-y-4 py-2">
                  {messagesLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        No messages found
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                            >
                              {message.group_name}
                            </Badge>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {message.author?.full_name || "Anonymous"}
                            </span>
                            {message.is_anonymous && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-slate-100 dark:bg-slate-700"
                              >
                                Anonymous
                              </Badge>
                            )}
                            <span className="text-xs text-slate-400">
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {message.reply_to_message && (
                          <div className="mb-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded py-1">
                            <span className="font-medium">
                              {message.reply_to_message.author?.full_name ||
                                "Anonymous"}
                            </span>
                            : {message.reply_to_message.content.slice(0, 50)}
                            {message.reply_to_message.content.length > 50 &&
                              "..."}
                          </div>
                        )}

                        {message.content && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {message.content}
                          </p>
                        )}
                        {message.image_url && (
                          <div className="mb-3">
                            <img
                              src={message.image_url}
                              alt="Message image"
                              className="max-w-full max-h-60 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() =>
                                window.open(message.image_url!, "_blank")
                              }
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {message.view_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{message.group_name}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="flex-1 overflow-hidden px-6">
            <div className="max-w-7xl mx-auto h-full">
              <div className="mb-4 pt-2">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users by name, student ID, or email..."
                    className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && loadUsers()}
                  />
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-440px)]">
                <div className="space-y-3 py-2">
                  {usersLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        No users found
                      </p>
                    </div>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.user_id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm">
                              {u.avatar_url ? (
                                <AvatarImage src={u.avatar_url} />
                              ) : null}
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                {u.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800",
                                u.is_online
                                  ? "bg-green-500"
                                  : "bg-slate-300 dark:bg-slate-600",
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-900 dark:text-white">
                                {u.full_name}
                              </span>
                              {u.is_banned && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"
                                >
                                  Banned
                                </Badge>
                              )}
                              <Badge
                                variant={u.is_online ? "default" : "outline"}
                                className={cn(
                                  "text-xs",
                                  u.is_online
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                                    : "text-slate-500 dark:text-slate-400",
                                )}
                              >
                                {u.is_online ? "Online" : "Offline"}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {u.department} · {u.student_id}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {u.group_count} groups · {u.message_count}{" "}
                              messages
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {u.is_banned ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handleUnbanUser(u.user_id)}
                              >
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => openBanDialog(u)}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Bans Tab */}
          <TabsContent value="bans" className="flex-1 overflow-hidden px-6">
            <div className="max-w-7xl mx-auto h-full">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-3 py-2">
                  {bansLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : bans.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Ban className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        No active bans
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        All users are in good standing
                      </p>
                    </div>
                  ) : (
                    bans.map((ban) => (
                      <div
                        key={ban.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-red-200 dark:border-red-900/30 border-l-4 border-l-red-500"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mt-0.5">
                              <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {ban.user_full_name}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-slate-100 dark:bg-slate-700"
                                >
                                  {ban.user_student_id}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Banned by {ban.admin_full_name}
                              </p>
                              {ban.reason && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                                  <span className="text-slate-400 dark:text-slate-500">
                                    Reason:
                                  </span>{" "}
                                  {ban.reason}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Banned: {formatDate(ban.banned_at)}
                                </span>
                                {ban.group_name && (
                                  <span className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    Group: {ban.group_name}
                                  </span>
                                )}
                                {ban.expires_at && (
                                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <Calendar className="h-3 w-3" />
                                    Expires: {formatDate(ban.expires_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-800 dark:hover:bg-green-900/20"
                            onClick={() =>
                              handleUnbanUser(
                                ban.user_id,
                                ban.group_id || undefined,
                              )
                            }
                          >
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new Discord group for students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-slate-700 dark:text-slate-300"
              >
                Group Name
              </Label>
              <Input
                id="name"
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, name: e.target.value })
                }
                placeholder="e.g., cst 26"
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="type"
                className="text-slate-700 dark:text-slate-300"
              >
                Group Type
              </Label>
              <Select
                value={newGroup.type}
                onValueChange={(value) =>
                  setNewGroup({ ...newGroup, type: value })
                }
              >
                <SelectTrigger
                  id="type"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newGroup.type === "department" && (
              <div className="space-y-2">
                <Label
                  htmlFor="department"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Department
                </Label>
                <Select
                  value={newGroup.department}
                  onValueChange={(value) =>
                    setNewGroup({ ...newGroup, department: value })
                  }
                >
                  <SelectTrigger
                    id="department"
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  >
                    <SelectValue placeholder="Select department" />
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
            )}

            {newGroup.type === "department" && (
              <div className="space-y-2">
                <Label
                  htmlFor="year"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={newGroup.year}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, year: parseInt(e.target.value) })
                  }
                  min={2020}
                  max={2030}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-slate-700 dark:text-slate-300"
              >
                Description
              </Label>
              <Input
                id="description"
                value={newGroup.description}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, description: e.target.value })
                }
                placeholder="Group description"
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleCreateGroup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Ban className="h-4 w-4" />
              </div>
              Ban User
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {selectedUserForBan && (
                <span>
                  Banning{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {selectedUserForBan.full_name}
                  </strong>{" "}
                  ({selectedUserForBan.student_id})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="banReason"
                className="text-slate-700 dark:text-slate-300"
              >
                Reason *
              </Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for ban..."
                required
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="banGroup"
                className="text-slate-700 dark:text-slate-300"
              >
                Group (Optional)
              </Label>
              <Select
                value={banGroupId || "all-groups-ban"}
                onValueChange={(value) =>
                  setBanGroupId(value === "all-groups-ban" ? "" : value)
                }
              >
                <SelectTrigger
                  id="banGroup"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                >
                  <SelectValue placeholder="All groups (global ban)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-groups-ban">
                    All Groups (Global Ban)
                  </SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Leave empty to ban from all groups
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="banExpires"
                className="text-slate-700 dark:text-slate-300"
              >
                Expires At (Optional)
              </Label>
              <Input
                id="banExpires"
                type="datetime-local"
                value={banExpiresAt}
                onChange={(e) => setBanExpiresAt(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Leave empty for permanent ban
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={!banReason}
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban className="h-4 w-4 mr-1" />
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
