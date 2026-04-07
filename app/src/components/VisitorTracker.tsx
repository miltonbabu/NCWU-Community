import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { visitorApi } from "@/lib/api";

export function VisitorTracker() {
  const location = useLocation();
  const hasTrackedInitialVisit = useRef(false);

  useEffect(() => {
    const trackVisit = async () => {
      const pagePath = location.pathname + location.search;
      
      try {
        await visitorApi.track(
          pagePath,
          document.referrer || undefined,
          "page_view"
        );
      } catch (error) {
        console.error("Failed to track visitor:", error);
      }
    };

    if (hasTrackedInitialVisit.current) {
      trackVisit();
    } else {
      hasTrackedInitialVisit.current = true;
      trackVisit();
    }
  }, [location.pathname, location.search]);

  return null;
}
