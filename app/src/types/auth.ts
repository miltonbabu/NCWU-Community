export type UserRole = 'user' | 'admin' | 'superadmin';
export type AuthProvider = 'password' | 'google';

export interface User {
  id: string;
  student_id: string;
  email: string;
  full_name: string;
  department: string | null;
  enrollment_year: number | null;
  current_year: number | null;
  phone: string | null;
  country: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_admin: boolean;
  is_banned: boolean;
  is_verified: boolean;
  agreed_to_terms: boolean;
  agreed_to_terms_at: string | null;
  google_uid: string | null;
  profile_completed: boolean;
  auth_provider: AuthProvider;
  google_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface SignupData {
  student_id: string;
  email: string;
  full_name: string;
  password: string;
  department?: string;
  enrollment_year?: number;
  current_year?: number;
  phone?: string;
  country?: string;
  agreed_to_terms: boolean;
}

export interface UpdateProfileData {
  full_name?: string;
  department?: string;
  enrollment_year?: number;
  current_year?: number;
  phone?: string;
  country?: string;
  avatar_url?: string;
  bio?: string;
}

export interface LoginLog {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  login_method: string | null;
  login_status: 'success' | 'failed';
  login_at: string;
  student_id?: string;
  full_name?: string;
  email?: string;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
}

export interface Visitor {
  id: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  page_visited: string | null;
  referrer: string | null;
  visit_type: string;
  visited_at: string;
}

export interface VisitorWithUser extends Visitor {
  user_name: string | null;
  user_student_id: string | null;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    admins: number;
    banned: number;
    newToday: number;
  };
  logins: {
    total: number;
    today: number;
    failed: number;
  };
  visitors: {
    total: number;
    today: number;
    uniqueToday: number;
  };
}
