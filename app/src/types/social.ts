export type PostVisibility =
  | "public"
  | "department"
  | "department_year"
  | "emergency";
export type AnonymityLevel = "full" | "icon_only" | "anonymous";

export interface PostAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  current_year: number | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  feeling?: string;
  location?: string;
  tags?: string[];
  visibility: PostVisibility;
  target_departments: string[];
  target_years: number[];
  is_emergency: boolean;
  is_anonymous: boolean;
  show_profile_icon: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count?: number;
  is_pinned: boolean;
  is_locked: boolean;
  post_type?: "regular" | "gallery";
  title?: string;
  mentions?: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: PostAuthor | null;
  is_liked: boolean;
}

export interface CommentAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
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
  author: CommentAuthor | null;
  is_liked: boolean;
  replies?: Comment[];
  parent_reply_to_name?: string;
}

export interface NotificationActor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "reply" | "share" | "mention" | "system";
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  actor_id: string | null;
  created_at: string;
  actor: NotificationActor | null;
}

export interface CreatePostData {
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

export interface UpdatePostData {
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

export interface CreateCommentData {
  content: string;
  parent_comment_id?: string;
  anonymity_level?: AnonymityLevel;
}

export interface FeedResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface AdminPostStats {
  totals: {
    posts: number;
    comments: number;
    likes: number;
  };
  today: {
    posts: number;
    comments: number;
  };
  special: {
    emergency: number;
    pinned: number;
    locked: number;
  };
  postsByVisibility: Array<{
    visibility: string;
    count: number;
  }>;
  topPosts: Array<{
    id: string;
    content: string;
    images: string[];
    like_count: number;
    comment_count: number;
    share_count: number;
    author_name: string;
  }>;
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
  admin_name: string | null;
  admin_student_id: string | null;
}
