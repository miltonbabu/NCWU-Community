import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { eventsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/events";
import {
  Calendar,
  MapPin,
  ArrowRight,
  PartyPopper,
  Loader2,
  Heart,
  CheckCircle,
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

interface HomeEventsSectionProps {
  isDark: boolean;
}

export default function HomeEventsSection({ isDark }: HomeEventsSectionProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLatestEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getLatestEvents(3);
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLatestEvents();
  }, [fetchLatestEvents]);

  const getCategoryColor = (category: string) => {
    return categories.find((c) => c.value === category)?.color || "bg-slate-500";
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Upcoming Events
          </h2>
        </div>
        <Link
          to="/events"
          className="flex items-center gap-2 text-violet-500 hover:text-violet-600 font-medium"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            to="/events"
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
              isDark
                ? "bg-slate-800/50 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            {/* Event Image */}
            <div className="relative h-40 overflow-hidden">
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
                  <Calendar className="w-12 h-12 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <Badge
                className={`absolute top-3 left-3 ${getCategoryColor(
                  event.category
                )} text-white border-0 text-xs`}
              >
                {getCategoryLabel(event.category)}
              </Badge>
            </div>

            {/* Event Content */}
            <div className="p-4">
              <h3
                className={`font-bold mb-2 line-clamp-1 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {event.title}
              </h3>

              <div className="space-y-1.5 text-sm">
                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(event.event_date), "MMM d, yyyy")}
                    {event.event_time && ` at ${event.event_time}`}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{event.location}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-1.5 ${
                      isDark ? "text-pink-400" : "text-pink-500"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{event.interest_count || 0} interested</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      isDark ? "text-green-400" : "text-green-500"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{event.going_count || 0} going</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Link to="/events">
          <Button
            variant="outline"
            className={`${
              isDark
                ? "border-slate-700 hover:bg-slate-800"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            See All Events
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
