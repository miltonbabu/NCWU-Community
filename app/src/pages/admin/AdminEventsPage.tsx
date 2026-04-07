import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/AuthGuard";
import type { Event, EventInterest, EventGoing } from "@/types/events";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Trash2,
  Edit,
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  X,
  PartyPopper,
  Crown,
  Shield,
  LogOut,
  Eye,
  Clock,
  Download,
  FileSpreadsheet,
  Heart,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

const categories = [
  { value: "academic", label: "Academic", color: "bg-blue-500" },
  { value: "social", label: "Social", color: "bg-pink-500" },
  { value: "sports", label: "Sports", color: "bg-green-500" },
  { value: "cultural", label: "Cultural", color: "bg-purple-500" },
  { value: "career", label: "Career", color: "bg-amber-500" },
  { value: "general", label: "General", color: "bg-slate-500" },
];

function AdminEventsContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user: currentUser, logout } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingAttendees, setViewingAttendees] = useState<Event | null>(null);
  const [interestedUsers, setInterestedUsers] = useState<EventInterest[]>([]);
  const [goingUsers, setGoingUsers] = useState<EventGoing[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState("interested");
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
    category: "general",
    max_participants: "",
    images: [] as string[],
  });

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getAllEvents();
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch events");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchAttendees = async (eventId: string) => {
    try {
      const [interestedRes, goingRes] = await Promise.all([
        eventsApi.getInterestedUsers(eventId),
        eventsApi.getGoingUsers(eventId),
      ]);

      if (interestedRes.success && interestedRes.data) {
        setInterestedUsers(interestedRes.data);
      }
      if (goingRes.success && goingRes.data) {
        setGoingUsers(goingRes.data);
      }
    } catch (error) {
      toast.error("Failed to fetch attendees");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants)
          : undefined,
      };

      if (editingEvent) {
        const response = await eventsApi.updateEvent(
          editingEvent.id,
          eventData,
        );
        if (response.success) {
          toast.success("Event updated successfully");
          fetchEvents();
          resetForm();
        }
      } else {
        const response = await eventsApi.createEvent(eventData);
        if (response.success) {
          toast.success("Event created successfully");
          fetchEvents();
          resetForm();
        }
      }
    } catch (error) {
      toast.error("Failed to save event");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (event: Event) => {
    try {
      const response = await eventsApi.deleteEvent(event.id);
      if (response.success) {
        toast.success("Event deleted successfully");
        fetchEvents();
        setDeleteDialog(null);
      }
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleExport = async (
    event: Event,
    type: "all" | "interested" | "going",
  ) => {
    try {
      const response = await eventsApi.exportEventData(event.id, type);
      if (response) {
        // Create blob and download
        const blob = new Blob([response as unknown as BlobPart], {
          type: "text/csv",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_attendees.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Data exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        continue;
      }

      // Create a temporary preview URL
      const tempId = URL.createObjectURL(file);
      setUploadingImages((prev) => [...prev, tempId]);

      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      try {
        console.log(
          "Uploading file:",
          file.name,
          "Size:",
          file.size,
          "Type:",
          file.type,
        );
        const response = await eventsApi.uploadImage(uploadFormData);
        console.log("Upload response:", response);

        if (response.success && response.data) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, response.data.url],
          }));
          toast.success(`"${file.name}" uploaded successfully`);
        } else {
          console.error("Upload failed:", response);
          toast.error(
            `Failed to upload "${file.name}": ${response.message || response.error || "Unknown error"}`,
          );
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload "${file.name}". Please try again.`);
      } finally {
        setUploadingImages((prev) => prev.filter((id) => id !== tempId));
        URL.revokeObjectURL(tempId);
      }
    }

    // Reset the input
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      event_date: "",
      event_time: "",
      category: "general",
      max_participants: "",
      images: [],
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const startEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      event_time: event.event_time || "",
      category: event.category,
      max_participants: event.max_participants?.toString() || "",
      images: event.images || [],
    });
    setShowForm(true);
  };

  const viewAttendees = (event: Event) => {
    setViewingAttendees(event);
    fetchAttendees(event.id);
    setActiveTab("interested");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryColor = (category: string) => {
    return (
      categories.find((c) => c.value === category)?.color || "bg-slate-500"
    );
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`w-72 h-screen sticky top-0 flex flex-col ${
            isDark
              ? "bg-slate-900/80 border-r border-slate-800"
              : "bg-white border-r border-slate-200"
          } backdrop-blur-xl`}
        >
          <div className="p-6 flex-1 overflow-y-auto">
            <Link
              to="/admin"
              className={`flex items-center gap-3 mb-10 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Events Admin</h1>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Manage Events
                </p>
              </div>
            </Link>

            <nav className="space-y-2">
              <button
                onClick={() => setShowForm(true)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg`}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Event</span>
              </button>

              <Link
                to="/admin/social"
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back to Social</span>
              </Link>

              <Link
                to="/admin"
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </nav>
          </div>

          <div
            className={`shrink-0 p-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
          >
            <div
              className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              <Avatar className="w-10 h-10 ring-2 ring-purple-500/30">
                <AvatarImage src={currentUser?.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                  {currentUser?.full_name
                    ? getInitials(currentUser.full_name)
                    : "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {currentUser?.full_name}
                </p>
                <p
                  className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {isSuperAdmin ? (
                    <>
                      <Crown className="w-3 h-3 text-violet-400" />
                      SuperAdmin
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3 text-amber-400" />
                      Admin
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={logout}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                    : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                }`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Events Management
                </h1>
                <p
                  className={`mt-2 text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Create and manage events for the community
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <PartyPopper
                  className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`}
                />
                <p
                  className={`text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  No events yet. Create your first event!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-6 rounded-2xl ${
                      isDark
                        ? "bg-slate-900/50 border border-slate-800"
                        : "bg-white border border-slate-200"
                    } shadow-xl transition-all hover:shadow-2xl`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {event.images && event.images.length > 0 ? (
                          <img
                            src={event.images[0]}
                            alt={event.title}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div
                            className={`w-20 h-20 rounded-xl ${getCategoryColor(event.category)} flex items-center justify-center`}
                          >
                            <Calendar className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {event.title}
                            </h3>
                            <Badge
                              className={`${getCategoryColor(event.category)} text-white border-0`}
                            >
                              {getCategoryLabel(event.category)}
                            </Badge>
                            {!event.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              <Calendar className="w-4 h-4" />
                              {format(new Date(event.event_date), "PPP")}
                              {event.event_time && ` at ${event.event_time}`}
                            </span>
                            <span
                              className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <button
                              onClick={() => viewAttendees(event)}
                              className="flex items-center gap-1 text-pink-400 hover:text-pink-300"
                            >
                              <Heart className="w-4 h-4" />
                              {event.interest_count || 0} interested
                            </button>
                            <button
                              onClick={() => viewAttendees(event)}
                              className="flex items-center gap-1 text-green-400 hover:text-green-300"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {event.going_count || 0} going
                            </button>
                            {event.max_participants && (
                              <span
                                className={`${isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                Max: {event.max_participants}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(event)}
                          className="hover:bg-violet-500/20 text-violet-400"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => setDeleteDialog(event)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p
                      className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {event.description}
                    </p>

                    {event.images && event.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {event.images.slice(1).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Event image ${index + 2}`}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/10">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewAttendees(event)}
                        className={isDark ? "border-slate-700" : ""}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Attendees
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(event, "all")}
                        className={isDark ? "border-slate-700" : ""}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export All
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent
          className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-900 border-slate-800" : ""}`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingEvent ? "update" : "create"}{" "}
              an event.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter event title"
                required
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the event..."
                required
                rows={6}
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      event_date: e.target.value,
                    }))
                  }
                  required
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_time">Time</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      event_time: e.target.value,
                    }))
                  }
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Where is the event?"
                required
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger
                    className={isDark ? "bg-slate-800 border-slate-700" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_participants: e.target.value,
                    }))
                  }
                  placeholder="Optional"
                  min="1"
                  className={isDark ? "bg-slate-800 border-slate-700" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Images</Label>
              <div className="flex flex-wrap gap-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {uploadingImages.map((tempId, index) => (
                  <div
                    key={`uploading-${index}`}
                    className="relative h-20 w-20 rounded-lg border-2 border-dashed border-violet-500/50 flex items-center justify-center bg-violet-500/10"
                  >
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  </div>
                ))}
                <label
                  className={`h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 ${
                    isDark
                      ? "border-slate-700 hover:bg-slate-800"
                      : "border-slate-300"
                  }`}
                >
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingEvent ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Attendees Dialog */}
      <Dialog
        open={!!viewingAttendees}
        onOpenChange={() => setViewingAttendees(null)}
      >
        <DialogContent
          className={`max-w-3xl max-h-[80vh] overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : ""}`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              Event Attendees
            </DialogTitle>
            <DialogDescription>{viewingAttendees?.title}</DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="interested"
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Interested ({interestedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="going" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Going ({goingUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interested" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    viewingAttendees &&
                    handleExport(viewingAttendees, "interested")
                  }
                  className={isDark ? "border-slate-700" : ""}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Interested
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {interestedUsers.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    No users have shown interest yet
                  </p>
                ) : (
                  interestedUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                          {getInitials(user.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {user.user_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user.student_id && `ID: ${user.student_id}`}
                          {user.user_email && ` • ${user.user_email}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(user.interested_at), "PP")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="going" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    viewingAttendees && handleExport(viewingAttendees, "going")
                  }
                  className={isDark ? "border-slate-700" : ""}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Going
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {goingUsers.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    No users are going yet
                  </p>
                ) : (
                  goingUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                          {getInitials(user.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {user.user_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user.student_id && `ID: ${user.student_id}`}
                          {user.user_email && ` • ${user.user_email}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(user.going_at), "PP")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent
          className={isDark ? "bg-slate-900 border-slate-800" : ""}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>
              Delete Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog?.title}"? This
              action cannot be undone and will remove all attendee data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-500">
              This will permanently delete the event and all associated data.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminGuard>
      <AdminEventsContent />
    </AdminGuard>
  );
}
