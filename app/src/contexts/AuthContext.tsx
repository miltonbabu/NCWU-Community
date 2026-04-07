import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  User,
  AuthState,
  LoginCredentials,
  SignupData,
  UpdateProfileData,
} from "@/types/auth";
import { authApi } from "@/lib/api";
import { signInWithGoogle } from "@/lib/firebase";
import { toast } from "sonner";
import { WelcomePopup } from "@/components/WelcomePopup";
import { CompleteProfilePopup } from "@/components/auth/CompleteProfilePopup";

interface LoginResult {
  success: boolean;
  remainingAttempts?: number;
  lockedUntil?: string;
  remainingMinutes?: number;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  googleSignIn: () => Promise<{ success: boolean; isNewUser?: boolean }>;
  dismissCompleteProfile: () => void;
}

interface WelcomePopupState {
  isOpen: boolean;
  type: "login" | "signup";
  userName?: string;
}

interface CompleteProfilePopupState {
  isOpen: boolean;
  userName?: string;
  userPhoto?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const PROFILE_POPUP_DISMISSED = "profile_popup_dismissed";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        return {
          user,
          token,
          isLoading: true,
          isAuthenticated: true,
        };
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    return {
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
    };
  });

  const [welcomePopup, setWelcomePopup] = useState<WelcomePopupState>({
    isOpen: false,
    type: "login",
  });

  const [completeProfilePopup, setCompleteProfilePopup] =
    useState<CompleteProfilePopupState>({
      isOpen: false,
    });

  const hasInitialized = useRef(false);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const response = await authApi.getMe();

    if (response.success && response.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      setState({
        user: response.data.user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      refreshUser();
    }
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const response = await authApi.login(
      credentials.login,
      credentials.password,
    );

    if (response.success && response.data) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

      setState({
        user: response.data.user,
        token: response.data.token,
        isLoading: false,
        isAuthenticated: true,
      });

      setWelcomePopup({
        isOpen: true,
        type: "login",
        userName: response.data.user.full_name?.split(" ")[0],
      });

      return { success: true };
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));

      const responseData = response.data as
        | { remainingAttempts?: number; remainingMinutes?: number }
        | undefined;

      if (responseData?.remainingMinutes) {
        toast.error(
          `Too many failed attempts. Please try again in ${responseData.remainingMinutes} minute(s).`,
        );
        return {
          success: false,
          remainingMinutes: responseData.remainingMinutes,
        };
      }

      if (responseData?.remainingAttempts !== undefined) {
        toast.error(
          `Invalid credentials. ${responseData.remainingAttempts} attempt(s) remaining.`,
        );
        return {
          success: false,
          remainingAttempts: responseData.remainingAttempts,
        };
      }

      toast.error(response.message || "Login failed");
      return { success: false };
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const response = await authApi.signup(data);

    if (response.success && response.data) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

      setState({
        user: response.data.user,
        token: response.data.token,
        isLoading: false,
        isAuthenticated: true,
      });

      setWelcomePopup({
        isOpen: true,
        type: "signup",
        userName: response.data.user.full_name?.split(" ")[0],
      });

      return true;
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error(response.message || "Signup failed");
      return false;
    }
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROFILE_POPUP_DISMISSED);

    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });

    toast.success("Logged out successfully");
  };

  const updateProfile = async (data: UpdateProfileData): Promise<boolean> => {
    const response = await authApi.updateProfile(data);

    if (response.success && response.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

      setState((prev) => ({
        ...prev,
        user: response.data!.user,
      }));

      toast.success("Profile updated successfully");
      return true;
    } else {
      toast.error(response.message || "Failed to update profile");
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    const response = await authApi.changePassword(currentPassword, newPassword);

    if (response.success) {
      toast.success("Password changed successfully");
      return true;
    } else {
      toast.error(response.message || "Failed to change password");
      return false;
    }
  };

  const googleSignIn = async (): Promise<{ success: boolean; isNewUser?: boolean }> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const googleResult = await signInWithGoogle();

      if (!googleResult) {
        setState((prev) => ({ ...prev, isLoading: false }));
        toast.error("Google sign-in was cancelled or failed");
        return { success: false };
      }

      const { idToken, user: googleUser } = googleResult;

      const response = await authApi.googleLogin(idToken);

      if (response.success && response.data) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

        setState({
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          isAuthenticated: true,
        });

        if (response.data.isNewUser) {
          localStorage.removeItem(PROFILE_POPUP_DISMISSED);
          setCompleteProfilePopup({
            isOpen: true,
            userName: googleUser.displayName || response.data.user.full_name?.split(" ")[0],
            userPhoto: googleUser.photoURL || response.data.user.avatar_url,
          });
        } else {
          setWelcomePopup({
            isOpen: true,
            type: "login",
            userName: response.data.user.full_name?.split(" ")[0],
          });
        }

        return { success: true, isNewUser: response.data.isNewUser };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        toast.error(response.message || "Google sign-in failed");
        return { success: false };
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const message =
        error instanceof Error
          ? error.message
          : "Google sign-in was cancelled or failed";
      toast.error(message);
      return { success: false };
    }
  };

  const dismissCompleteProfile = () => {
    localStorage.setItem(PROFILE_POPUP_DISMISSED, "true");
    setCompleteProfilePopup({ isOpen: false });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        googleSignIn,
        dismissCompleteProfile,
      }}
    >
      {children}
      <WelcomePopup
        isOpen={welcomePopup.isOpen}
        onClose={() => setWelcomePopup({ isOpen: false, type: "login" })}
        userName={welcomePopup.userName}
        type={welcomePopup.type}
      />
      <CompleteProfilePopup
        isOpen={completeProfilePopup.isOpen}
        onClose={dismissCompleteProfile}
        userName={completeProfilePopup.userName}
        userPhoto={completeProfilePopup.userPhoto}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
