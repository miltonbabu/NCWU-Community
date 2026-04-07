import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import type { Event } from "@/types/events";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Share2,
  Clock,
  ChevronLeft,
  Loader2,
  PartyPopper,
  CheckCircle,
  XCircle,
  ThumbsUp,
} from "lucide-react";
import { format } from "date-fns";

const categories = [
  { value: "academic", label: "Academic", color: "bg-blue-500", textColor: "text-blue-500" },
  { value: "social", label: "Social", color: "bg-pink-500", textColor: "text-pink-500" },
  { value: "sports", label: "Sports", color: "bg-green-500", textColor: "text-green-500" },
  { value: "cultural", label: "Cultural", color: "bg-purple-500", textColor: "text-purple-500" },
  { value: "career", label: "Career", color: "bg-amber-500", textColor: "text-amber-500" },
  { value: "general", label: "General", color: "bg-slate-500", textColor: "text-slate-500" },
];

export default function EventsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const [goingEvents, setGoingEvents] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getEvents(20, 0);
      if (response.success && response.data) {
        setEvents(response.data);
        const interested = new Set<string>();
        const going = new Set<string>();
        response.data.forEach((event) => {
          if (event.user_interested) interested.add(event.id);
          if (event.user_going) going.add(event.id);
        });
        setInterestedEvents(interested);
        setGoingEvents(going);
      }
    } catch (error) {
      toast.error("Failed to fetch events");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleInterest = async (eventId: string, isInterested: boolean) => {
    if (!isAuthenticated) {
      toast.error("Please login to show interest");
      return;
    }

    setIsSubmitting(eventId);
    setActionType("interest");
    try {
      if (isInterested) {
        const response = await eventsApi.removeInterest(eventId);
        if (response.success) {
          setInterestedEvents((prev) => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, interest_count: (e.interest_count || 1) - 1 }
                : e
            )
          );
          toast.success("Interest removed");
        }
      } else {
        const response = await eventsApi.registerInterest(eventId);
        if (response.success) {
          setInterestedEvents((prev) => new Set(prev).add(eventId));
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, interest_count: (e.interest_count || 0) + 1 }
                : e
            )
          );
          toast.success("You're interested!");
        }
      }
    } catch (error) {
      toast.error("Failed to update interest");
    }
    setIsSubmitting(null);
    setActionType(null);
  };

  const handleGoing = async (eventId: string, isGoing: boolean) => {
    if (!isAuthenticated) {
      toast.error("Please login to mark as going");
      return;
    }

    setIsSubmitting(eventId);
    setActionType("going");
    try {
      if (isGoing) {
        const response = await eventsApi.removeGoing(eventId);
        if (response.success) {
          setGoingEvents((prev) => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, going_count: (e.going_count || 1) - 1 }
                : e
            )
          );
          toast.success("You're no longer going");
        }
      } else {
        const response = await eventsApi.registerGoing(eventId);
        if (response.success) {
          setGoingEvents((prev) => new Set(prev).add(eventId));
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, going_count: (e.going_count || 0) + 1 }
                : e
            )
          );
          toast.success("You're going to this event!");
        }
      }
    } catch (error) {
      toast.error("Failed to update going status");
    }
    setIsSubmitting(null);
    setActionType(null);
  };

  const handleNotGoing = async (eventId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login");
      return;
    }

    setIsSubmitting(eventId);
    setActionType("notgoing");
    try {
      // Remove from both interested and going
      if (interestedEvents.has(eventId)) {
        await eventsApi.removeInterest(eventId);
        setInterestedEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, interest_count: (e.interest_count || 1) - 1 }
              : e
          )
        );
      }
      
      if (goingEvents.has(eventId)) {
        await eventsApi.removeGoing(eventId);
        setGoingEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, going_count: (e.going_count || 1) - 1 }
              : e
          )
        );
      }
      
      toast.success("You're not going to this event");
    } catch (error) {
      toast.error("Failed to update status");
    }
    setIsSubmitting(null);
    setActionType(null);
  };

  const handleShare = async (event: Event) => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const getCategoryColor = (category: string) => {
    return categories.find((c) => c.value === category)?.color || "bg-slate-500";
  };

  const getCategoryTextColor = (category: string) => {
    return categories.find((c) => c.value === category)?.textColor || "text-slate-500";
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Navigation />

      <main className="pt-16 pb-16">
        {/* Header */}
        <div
          className={`border-b ${
            isDark
              ? "bg-slate-900/50 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
                <h1
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Events
                </h1>
              </div>
              <Link
                to="/"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <PartyPopper
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? "text-slate-700" : "text-slate-300"
                }`}
              />
              <p
                className={`text-lg ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                No upcoming events at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.images && event.images.length > 0 ? (
                      <img
                        src={event.images[0]}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className={`w-full h-full ${getCategoryColor(
                          event.category
                        )} flex items-center justify-center`}
                      >
                        <Calendar className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Category Badge */}
                    <Badge
                      className={`absolute top-4 left-4 ${getCategoryColor(
                        event.category
                      )} text-white border-0`}
                    >
                      {getCategoryLabel(event.category)}
                    </Badge>

                    {/* Date Badge */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {format(new Date(event.event_date), "MMMM d, yyyy")}
                        </span>
                        {event.event_time && (
                          <>
                            <Clock className="w-4 h-4 ml-2" />
                            <span className="text-sm">{event.event_time}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {event.title}
                    </h3>

                    <p
                      className={`text-sm mb-4 line-clamp-3 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {event.description}
                    </p>

                    <div
                      className={`flex items-center gap-2 mb-4 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{event.location}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <Heart className="w-4 h-4 text-pink-500" />
                        {event.interest_count || 0} interested
                      </span>
                      <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {event.going_count || 0} going
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Going Button */}
                        <Button
                          size="sm"
                          variant={goingEvents.has(event.id) ? "default" : "outline"}
                          onClick={() => handleGoing(event.id, goingEvents.has(event.id))}
                          disabled={isSubmitting === event.id && actionType === "going"}
                          className={`text-xs ${
                            goingEvents.has(event.id)
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : isDark
                              ? "border-slate-700 hover:bg-slate-800"
                              : ""
                          }`}
                        >
                          {isSubmitting === event.id && actionType === "going" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {goingEvents.has(event.id) ? "Going" : "Go"}
                            </>
                          )}
                        </Button>

                        {/* Interested Button */}
                        <Button
                          size="sm"
                          variant={interestedEvents.has(event.id) ? "default" : "outline"}
                          onClick={() => handleInterest(event.id, interestedEvents.has(event.id))}
                          disabled={isSubmitting === event.id && actionType === "interest"}
                          className={`text-xs ${
                            interestedEvents.has(event.id)
                              ? "bg-pink-500 hover:bg-pink-600 text-white"
                              : isDark
                              ? "border-slate-700 hover:bg-slate-800"
                              : ""
                          }`}
                        >
                          {isSubmitting === event.id && actionType === "interest" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Heart className="w-3 h-3 mr-1" />
                              {interestedEvents.has(event.id) ? "Interested" : "Interest"}
                            </>
                          )}
                        </Button>

                        {/* Not Going Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotGoing(event.id)}
                          disabled={isSubmitting === event.id && actionType === "notgoing"}
                          className={`text-xs ${
                            isDark
                              ? "border-slate-700 hover:bg-red-900/30 hover:text-red-400"
                              : "hover:bg-red-50 hover:text-red-600"
                          }`}
                        >
                          {isSubmitting === event.id && actionType === "notgoing" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Going
                            </>
                          )}
                        </Button>
                      </div>

                      {/* View Details & Share */}
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs"
                        >
                          View Details
                        </Button>
                        <button
                          onClick={() => handleShare(event)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                              : "text-slate-500 hover:text-blue-500 hover:bg-slate-100"
                          }`}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Event Image */}
            <div className="relative h-72">
              {selectedEvent.images && selectedEvent.images.length > 0 ? (
                <img
                  src={selectedEvent.images[0]}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full ${getCategoryColor(
                    selectedEvent.category
                  )} flex items-center justify-center`}
                >
                  <Calendar className="w-24 h-24 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                ×
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                <Badge
                  className={`mb-2 ${getCategoryColor(
                    selectedEvent.category
                  )} text-white border-0`}
                >
                  {getCategoryLabel(selectedEvent.category)}
                </Badge>
                <h2 className="text-2xl font-bold text-white">
                  {selectedEvent.title}
                </h2>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <Calendar className="w-5 h-5 text-violet-500" />
                  <span>
                    {format(new Date(selectedEvent.event_date), "MMMM d, yyyy")}
                  </span>
                </div>

                {selectedEvent.event_time && (
                  <div
                    className={`flex items-center gap-2 ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    <Clock className="w-5 h-5 text-violet-500" />
                    <span>{selectedEvent.event_time}</span>
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <MapPin className="w-5 h-5 text-violet-500" />
                  <span>{selectedEvent.location}</span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>
                    {selectedEvent.interest_count || 0} interested
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>
                    {selectedEvent.going_count || 0} going
                    {selectedEvent.max_participants &&
                      ` / ${selectedEvent.max_participants} max`}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div
                className={`prose max-w-none mb-6 ${
                  isDark ? "prose-invert" : ""
                }`}
              >
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                  About This Event
                </h3>
                <p
                  className={`text-base leading-relaxed whitespace-pre-wrap ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {selectedEvent.description}
                </p>
              </div>

              {/* Additional Images */}
              {selectedEvent.images && selectedEvent.images.length > 1 && (
                <div className="mb-6">
                  <h3
                    className={`text-sm font-semibold mb-3 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Event Gallery
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedEvent.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Event image ${index + 1}`}
                        className="h-32 w-32 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {/* Going Button */}
                  <Button
                    onClick={() => {
                      handleGoing(
                        selectedEvent.id,
                        goingEvents.has(selectedEvent.id)
                      );
                    }}
                    disabled={isSubmitting === selectedEvent.id && actionType === "going"}
                    className={`${
                      goingEvents.has(selectedEvent.id)
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    }`}
                  >
                    {isSubmitting === selectedEvent.id && actionType === "going" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : goingEvents.has(selectedEvent.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Going
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        I'm Going
                      </>
                    )}
                  </Button>

                  {/* Interested Button */}
                  <Button
                    onClick={() => {
                      handleInterest(
                        selectedEvent.id,
                        interestedEvents.has(selectedEvent.id)
                      );
                    }}
                    disabled={isSubmitting === selectedEvent.id && actionType === "interest"}
                    className={`${
                      interestedEvents.has(selectedEvent.id)
                        ? "bg-pink-500 hover:bg-pink-600"
                        : "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                    }`}
                  >
                    {isSubmitting === selectedEvent.id && actionType === "interest" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : interestedEvents.has(selectedEvent.id) ? (
                      <>
                        <Heart className="w-4 h-4 mr-2 fill-current" />
                        Interested
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Interested
                      </>
                    )}
                  </Button>

                  {/* Not Going Button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleNotGoing(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                    disabled={isSubmitting === selectedEvent.id && actionType === "notgoing"}
                    className={`${
                      isDark
                        ? "border-slate-700 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/50"
                        : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    }`}
                  >
                    {isSubmitting === selectedEvent.id && actionType === "notgoing" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Not Going
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedEvent)}
                  className={`w-full ${isDark ? "border-slate-700" : ""}`}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
