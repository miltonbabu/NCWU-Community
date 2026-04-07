import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { adminApi } from "@/lib/api";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/AuthGuard";
import {
  KeyRound,
  Mail,
  Hash,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Trash2,
  Send,
  User,
} from "lucide-react";

interface PasswordRecoveryRequest {
  id: string;
  user_id: string;
  email: string;
  student_id: string;
  recovery_email: string;
  status: string;
  new_password: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  user_name: string;
  user_full_name: string;
}

function AdminPasswordRecoveryContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [requests, setRequests] = useState<PasswordRecoveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordRecoveryRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getPasswordRecoveryRequests(page, 10, statusFilter);
      if (response.success && response.data) {
        let filteredRequests = response.data.requests;
        if (searchQuery) {
          filteredRequests = filteredRequests.filter(
            (r) =>
              r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.user_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.recovery_email.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setRequests(filteredRequests);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      toast.error("Failed to fetch password recovery requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleResolve = async () => {
    if (!selectedRequest || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsResolving(true);
    try {
      const response = await adminApi.resolvePasswordRecovery(selectedRequest.id, newPassword);
      if (response.success) {
        toast.success(`Password sent to ${response.data?.recovery_email}`);
        setResolveDialogOpen(false);
        setSelectedRequest(null);
        setNewPassword("");
        fetchRequests();
      } else {
        toast.error(response.message || "Failed to resolve request");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsResolving(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await adminApi.rejectPasswordRecovery(id);
      if (response.success) {
        toast.success("Request rejected");
        fetchRequests();
      } else {
        toast.error(response.message || "Failed to reject request");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      const response = await adminApi.deletePasswordRecovery(id);
      if (response.success) {
        toast.success("Request deleted");
        fetchRequests();
      } else {
        toast.error(response.message || "Failed to delete request");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Password Recovery Requests
            </h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Manage user password recovery requests
            </p>
          </div>
          <Link
            to="/admin"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              isDark
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div
          className={`rounded-2xl p-6 ${
            isDark ? "bg-slate-800/50" : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              />
              <Input
                placeholder="Search by email, student ID, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${
                  isDark
                    ? "bg-slate-700/50 border-slate-600 text-white"
                    : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={`w-40 ${
                  isDark
                    ? "bg-slate-700/50 border-slate-600 text-white"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchRequests}
              variant="outline"
              className={`${
                isDark
                  ? "bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <KeyRound
                className={`w-12 h-12 mx-auto mb-4 ${
                  isDark ? "text-slate-600" : "text-slate-300"
                }`}
              />
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                No password recovery requests found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-slate-700/30" : "bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User
                          className={`w-4 h-4 ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {request.user_full_name || "Unknown User"}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail
                            className={`w-4 h-4 ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          />
                          <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                            {request.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash
                            className={`w-4 h-4 ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          />
                          <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                            {request.student_id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Send
                          className={`w-4 h-4 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                          Recovery email: {request.recovery_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock
                          className={`w-3 h-3 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <span className={isDark ? "text-slate-500" : "text-slate-500"}>
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setResolveDialogOpen(true);
                            }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                          >
                            <KeyRound className="w-4 h-4 mr-1" />
                            Set Password
                          </Button>
                          <Button
                            onClick={() => handleReject(request.id)}
                            variant="outline"
                            className={`${
                              isDark
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {request.status !== "pending" && (
                        <Button
                          onClick={() => handleDelete(request.id)}
                          variant="outline"
                          className={`${
                            isDark
                              ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {request.status === "resolved" && request.new_password && (
                    <div
                      className={`mt-3 p-2 rounded-lg ${
                        isDark ? "bg-green-500/10" : "bg-green-50"
                      }`}
                    >
                      <p className={`text-sm ${isDark ? "text-green-400" : "text-green-700"}`}>
                        New password: <code className="font-mono">{request.new_password}</code>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                className={`${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "border-slate-200"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                className={`${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "border-slate-200"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent
          className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-slate-900"}>
              Set New Password
            </DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-600"}>
              Enter a new password for {selectedRequest?.user_full_name}. The password
              will be sent to: {selectedRequest?.recovery_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className={isDark ? "text-slate-300" : "text-slate-700"}
              >
                New Password (minimum 6 characters)
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`pr-10 ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600 text-white"
                      : "bg-slate-50 border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setResolveDialogOpen(false)}
              variant="outline"
              className={
                isDark
                  ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "border-slate-200"
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isResolving || newPassword.length < 6}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            >
              {isResolving ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPasswordRecoveryPage() {
  return (
    <AdminGuard>
      <AdminPasswordRecoveryContent />
    </AdminGuard>
  );
}
