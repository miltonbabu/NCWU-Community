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
  created_at: string;
  member_count: number;
  online_count?: number;
  is_member: boolean;
  can_send_message: boolean;
  unread_count?: number;
}

export interface DiscordGroupMember {
  user_id: string;
  joined_at: string;
  full_name: string;
  student_id: string;
  avatar_url: string | null;
  department: string | null;
  current_year: number | null;
  status: string | null;
  last_seen: string | null;
  is_online: boolean;
  nickname?: string | null;
  display_student_id?: number;
  display_name?: string;
  show_as_admin?: boolean;
}

export interface DiscordMessage {
  id: string;
  group_id: string;
  user_id: string;
  sender_id?: string;
  content: string;
  is_anonymous: boolean;
  reply_to: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
  author: {
    id: string;
    full_name: string;
    student_id: string;
    avatar_url: string | null;
    department: string | null;
    current_year: number | null;
    display_name?: string;
    show_as_admin?: boolean;
  } | null;
  view_count: number;
  has_viewed: boolean;
  flagged?: boolean;
  reply_to_message?: {
    id: string;
    content: string;
    is_anonymous: boolean;
    author: {
      full_name: string;
    };
  } | null;
}

export interface DiscordUserPresence {
  user_id: string;
  status: UserPresenceStatus;
  last_seen: string;
  full_name: string;
  student_id: string;
  avatar_url: string | null;
  department: string | null;
}

export interface CreateDiscordMessageData {
  content: string;
  is_anonymous?: boolean;
  reply_to?: string;
}

export interface DiscordGroupStats {
  total_groups: number;
  total_messages: number;
  total_members: number;
  total_banned: number;
  active_users_today: number;
}

export interface AdminDiscordMessage extends DiscordMessage {
  group_id: string;
  group_name: string;
  user_id: string;
}

export interface AdminDiscordUser {
  user_id: string;
  full_name: string;
  student_id: string;
  email: string;
  avatar_url: string | null;
  department: string | null;
  current_year: number | null;
  status: string | null;
  last_seen: string | null;
  is_online: boolean;
  is_banned: boolean;
  group_count: number;
  message_count: number;
}

export interface DiscordBan {
  id: string;
  user_id: string;
  group_id: string | null;
  banned_by: string;
  reason: string | null;
  banned_at: string;
  expires_at: string | null;
  user_full_name: string;
  user_student_id: string;
  group_name: string | null;
  admin_full_name: string;
}
 
