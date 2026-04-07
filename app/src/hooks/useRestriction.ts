import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Restriction {
  id: string;
  reason: string;
  source: string;
  detected_words: string[];
  restriction_days: number;
  restriction_ends_at: string | null;
  created_at: string;
}

interface RestrictionState {
  isRestricted: boolean;
  restriction: Restriction | null;
  restrictedFeatures: string[];
  loading: boolean;
  checkFeature: (feature: string) => boolean;
  refresh: () => Promise<void>;
}

export function useRestriction(): RestrictionState {
  const { user, isAuthenticated } = useAuth();
  const [restriction, setRestriction] = useState<Restriction | null>(null);
  const [restrictedFeatures, setRestrictedFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRestriction = useCallback(async () => {
    if (!isAuthenticated || !user?.id || user.is_admin) {
      setRestriction(null);
      setRestrictedFeatures([]);
      setLoading(false);
      return;
    }

    try {
      const response = await adminApi.getUserRestriction(user.id);
      if (response.success && response.data) {
        setRestriction(response.data.restriction || null);
        setRestrictedFeatures(response.data.restricted_features || []);
      }
    } catch (error) {
      console.error("Error checking restriction:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.is_admin]);

  useEffect(() => {
    checkRestriction();
  }, [checkRestriction]);

  const checkFeature = useCallback(
    (feature: string): boolean => {
      if (!restriction) return false;
      return restrictedFeatures.includes(feature);
    },
    [restriction, restrictedFeatures]
  );

  return {
    isRestricted: !!restriction,
    restriction,
    restrictedFeatures,
    loading,
    checkFeature,
    refresh: checkRestriction,
  };
}
