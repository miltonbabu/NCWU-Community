export type UserRole = "user" | "admin" | "superadmin";
export type AuthProvider = "password" | "google";

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
  password_hash: string | null;
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
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
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
  created_at: string;
  updated_at: string;
}

export interface LoginLog {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  login_method: string | null;
  login_status: "success" | "failed";
  login_at: string;
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

export interface VisitorStats {
  id: string;
  date: string;
  total_visits: number;
  unique_visitors: number;
  local_visits: number;
  domain_visits: number;
}

export interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export interface SignupRequest {
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

export interface LoginRequest {
  login: string;
  password: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  department?: string;
  enrollment_year?: number;
  current_year?: number;
  phone?: string;
  country?: string;
  avatar_url?: string;
  bio?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export type PostVisibility =
  | "public"
  | "department"
  | "department_year"
  | "emergency";
export type AnonymityLevel = "full" | "icon_only" | "anonymous";
export type LikeTargetType = "post" | "comment";
export type NotificationType =
  | "like"
  | "comment"
  | "reply"
  | "share"
  | "mention"
  | "system";
export type ShareType = "internal" | "external";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  feeling: string | null;
  location: string | null;
  tags: string[];
  visibility: PostVisibility;
  target_departments: string[];
  target_years: number[];
  is_emergency: boolean;
  is_anonymous: boolean;
  show_profile_icon: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  post_type?: string;
  title?: string | null;
  mentions?: string[];
  view_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    full_name: string;
    student_id: string;
    avatar_url: string | null;
    department: string | null;
    current_year: number | null;
  } | null;
  is_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_anonymous: boolean;
  show_profile_icon: boolean;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    full_name: string;
    student_id: string;
    avatar_url: string | null;
    department: string | null;
  } | null;
  is_liked: boolean;
  replies?: CommentWithAuthor[];
}

export interface Like {
  id: string;
  user_id: string;
  target_type: LikeTargetType;
  target_id: string;
  created_at: string;
}

export interface Share {
  id: string;
  post_id: string;
  user_id: string;
  share_type: ShareType;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  actor_id: string | null;
  created_at: string;
}

export interface NotificationWithActor extends Notification {
  actor: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface CreatePostRequest {
  content: string;
  images?: string[];
  feeling?: string;
  location?: string;
  tags?: string[];
  visibility: PostVisibility;
  target_departments?: string[];
  target_years?: number[];
  is_emergency?: boolean;
  anonymity_level?: AnonymityLevel;
  post_type?: "regular" | "gallery";
  title?: string;
  mentions?: string[];
}

export interface UpdatePostRequest {
  content?: string;
  title?: string;
  images?: string[];
  feeling?: string;
  location?: string;
  tags?: string[];
  visibility?: PostVisibility;
  target_departments?: string[];
  target_years?: number[];
  is_emergency?: boolean;
  anonymity_level?: AnonymityLevel;
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
  anonymity_level?: AnonymityLevel;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface FeedQueryParams {
  page?: number;
  limit?: number;
  visibility?: PostVisibility;
  department?: string;
  year?: number;
  emergency_only?: boolean;
}

export type DiscordGroupType = "department" | "all" | "custom";
export type UserPresenceStatus = "online" | "offline" | "away";

export interface DiscordGroup {
  id: string;
  name: string;
  type: DiscordGroupType;
  department: string | null;
  year: number | null;
  description: string | null;
  icon_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DiscordGroupWithMembers extends DiscordGroup {
  member_count: number;
  is_member: boolean;
}

export interface DiscordGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface DiscordMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  reply_to: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface DiscordMessageWithAuthor extends DiscordMessage {
  author: {
    id: string;
    full_name: string;
    student_id: string;
    avatar_url: string | null;
    department: string | null;
    current_year: number | null;
  } | null;
  view_count: number;
  has_viewed: boolean;
  reply_to_message?: DiscordMessageWithAuthor | null;
}

export interface DiscordMessageView {
  id: string;
  message_id: string;
  user_id: string;
  viewed_at: string;
}

export interface DiscordUserPresence {
  id: string;
  user_id: string;
  status: UserPresenceStatus;
  last_seen: string;
}

export interface DiscordUserPresenceWithUser extends DiscordUserPresence {
  user: {
    id: string;
    full_name: string;
    student_id: string;
    avatar_url: string | null;
    department: string | null;
  };
}

export interface CreateDiscordGroupRequest {
  name: string;
  type: DiscordGroupType;
  department?: string;
  year?: number;
  description?: string;
  icon_url?: string;
}

export interface CreateDiscordMessageRequest {
  content: string;
  is_anonymous?: boolean;
  reply_to?: string;
}

export interface DiscordGroupStats {
  total_groups: number;
  total_messages: number;
  total_members: number;
  active_users_today: number;
}
