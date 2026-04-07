import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const GUEST_MSG_LIMIT = 10;
const GUEST_IMAGE_LIMIT = 4;
const GUEST_DOC_LIMIT = 1;
const USER_DAILY_IMAGE_LIMIT = 10;
const USER_DAILY_DOC_LIMIT = 3;

const GUEST_STORAGE_KEY = "xingyuan-guest-usage";
const USER_IMAGE_KEY = "xingyuan-user-images";
const USER_DOC_KEY = "xingyuan-user-docs";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

interface GuestUsage {
  messageCount: number;
  imageCount: number;
  docCount: number;
}

interface UserImageUsage {
  date: string;
  count: number;
}

interface UserDocUsage {
  date: string;
  count: number;
}

function loadGuestUsage(): GuestUsage {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return { messageCount: 0, imageCount: 0, docCount: 0 };
    return JSON.parse(raw) as GuestUsage;
  } catch {
    return { messageCount: 0, imageCount: 0, docCount: 0 };
  }
}

function saveGuestUsage(usage: GuestUsage) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(usage));
}

function loadUserImageUsage(): UserImageUsage {
  try {
    const raw = localStorage.getItem(USER_IMAGE_KEY);
    if (!raw) return { date: "", count: 0 };
    const parsed = JSON.parse(raw) as UserImageUsage;
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), count: 0 };
    }
    return parsed;
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

function saveUserImageUsage(usage: UserImageUsage) {
  localStorage.setItem(USER_IMAGE_KEY, JSON.stringify(usage));
}

function loadUserDocUsage(): UserDocUsage {
  try {
    const raw = localStorage.getItem(USER_DOC_KEY);
    if (!raw) return { date: "", count: 0 };
    const parsed = JSON.parse(raw) as UserDocUsage;
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), count: 0 };
    }
    return parsed;
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

function saveUserDocUsage(usage: UserDocUsage) {
  localStorage.setItem(USER_DOC_KEY, JSON.stringify(usage));
}

export function useUsageLimits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;
  const isAdmin =
    !!user &&
    (user.is_admin || user.role === "admin" || user.role === "superadmin");

  const [guestUsage, setGuestUsage] = useState<GuestUsage>(loadGuestUsage);
  const [userImageUsage, setUserImageUsage] =
    useState<UserImageUsage>(loadUserImageUsage);
  const [userDocUsage, setUserDocUsage] =
    useState<UserDocUsage>(loadUserDocUsage);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showDailyLimitPopup, setShowDailyLimitPopup] = useState(false);

  useEffect(() => {
    setGuestUsage(loadGuestUsage());
    setUserImageUsage(loadUserImageUsage());
    setUserDocUsage(loadUserDocUsage());
  }, [user]);

  const canSendMessage = useCallback((): boolean => {
    if (isAdmin || !isGuest) return true;
    return guestUsage.messageCount < GUEST_MSG_LIMIT;
  }, [isGuest, isAdmin, guestUsage.messageCount]);

  const canUploadImage = useCallback(
    (imageCount: number = 1): boolean => {
      if (isAdmin) return true;
      if (isGuest) {
        return guestUsage.imageCount + imageCount <= GUEST_IMAGE_LIMIT;
      }
      return userImageUsage.count + imageCount <= USER_DAILY_IMAGE_LIMIT;
    },
    [isGuest, isAdmin, guestUsage.imageCount, userImageUsage.count],
  );

  const recordMessage = useCallback(() => {
    if (isAdmin || !isGuest) return true;

    const newUsage = {
      ...guestUsage,
      messageCount: guestUsage.messageCount + 1,
    };
    setGuestUsage(newUsage);
    saveGuestUsage(newUsage);

    if (newUsage.messageCount >= GUEST_MSG_LIMIT) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  }, [isGuest, guestUsage]);

  const recordImages = useCallback(
    (count: number): boolean => {
      if (isAdmin) return true;
      if (isGuest) {
        const newUsage = {
          ...guestUsage,
          imageCount: guestUsage.imageCount + count,
        };
        setGuestUsage(newUsage);
        saveGuestUsage(newUsage);

        if (newUsage.imageCount >= GUEST_IMAGE_LIMIT) {
          setShowLoginPrompt(true);
          return false;
        }
        return true;
      }

      const newUsage: UserImageUsage = {
        date: getTodayKey(),
        count: userImageUsage.count + count,
      };
      setUserImageUsage(newUsage);
      saveUserImageUsage(newUsage);

      if (newUsage.count >= USER_DAILY_IMAGE_LIMIT) {
        setShowDailyLimitPopup(true);
        return false;
      }
      return true;
    },
    [isGuest, isAdmin, guestUsage, userImageUsage],
  );

  const canUploadDocument = useCallback((): boolean => {
    if (isAdmin) return true;
    if (isGuest) {
      return guestUsage.docCount < GUEST_DOC_LIMIT;
    }
    return userDocUsage.count < USER_DAILY_DOC_LIMIT;
  }, [isGuest, isAdmin, guestUsage.docCount, userDocUsage.count],
  );

  const recordDocument = useCallback(():
    | "ok"
    | "login"
    | "limit"
    | "daily_limit" => {
    if (isAdmin) return "ok";
    if (isGuest) {
      const newUsage = {
        ...guestUsage,
        docCount: guestUsage.docCount + 1,
      };
      setGuestUsage(newUsage);
      saveGuestUsage(newUsage);

      if (newUsage.docCount >= GUEST_DOC_LIMIT) {
        setShowLoginPrompt(true);
        return "limit";
      }
      return "ok";
    }

    const newUsage: UserDocUsage = {
      date: getTodayKey(),
      count: userDocUsage.count + 1,
    };
    setUserDocUsage(newUsage);
    saveUserDocUsage(newUsage);

    if (newUsage.count >= USER_DAILY_DOC_LIMIT) {
      setShowDailyLimitPopup(true);
      return "daily_limit";
    }
    return "ok";
  }, [isGuest, isAdmin, guestUsage, userDocUsage]);

  const checkAndRecordSend = useCallback(
    (imageCount: number): "ok" | "login" | "limit" | "daily_limit" => {
      if (isAdmin) return "ok";
      if (!canSendMessage()) return "login";
      if (!canUploadImage(imageCount)) {
        return isGuest ? "limit" : "daily_limit";
      }
      recordMessage();
      if (imageCount > 0) {
        const ok = recordImages(imageCount);
        if (!ok) {
          return isGuest ? "limit" : "daily_limit";
        }
      }
      return "ok";
    },
    [isAdmin, canSendMessage, canUploadImage, recordMessage, recordImages, isGuest],
  );

  const handleLoginRedirect = () => {
    navigate("/login", { state: { from: { pathname: "/xingyuan-ai" } } });
  };

  const remainingMessages = isAdmin || !isGuest
    ? Infinity
    : Math.max(0, GUEST_MSG_LIMIT - guestUsage.messageCount);

  const remainingImages = isAdmin
    ? Infinity
    : isGuest
      ? Math.max(0, GUEST_IMAGE_LIMIT - guestUsage.imageCount)
      : Math.max(0, USER_DAILY_IMAGE_LIMIT - userImageUsage.count);

  const remainingDocuments = isAdmin
    ? Infinity
    : isGuest
      ? Math.max(0, GUEST_DOC_LIMIT - guestUsage.docCount)
      : Math.max(0, USER_DAILY_DOC_LIMIT - userDocUsage.count);

  return {
    isGuest,
    isAdmin,
    canSendMessage,
    canUploadImage,
    canUploadDocument,
    recordMessage,
    recordImages,
    recordDocument,
    checkAndRecordSend,
    showLoginPrompt,
    setShowLoginPrompt,
    showDailyLimitPopup,
    setShowDailyLimitPopup,
    handleLoginRedirect,
    remainingMessages,
    remainingImages,
    remainingDocuments,
    guestMessageCount: guestUsage.messageCount,
    guestImageCount: guestUsage.imageCount,
    guestDocCount: guestUsage.docCount,
    userImageCountToday: userImageUsage.count,
    userDocCountToday: userDocUsage.count,
    GUEST_MSG_LIMIT,
    GUEST_IMAGE_LIMIT,
    GUEST_DOC_LIMIT,
    USER_DAILY_IMAGE_LIMIT,
    USER_DAILY_DOC_LIMIT,
  };
}
