-- ============================================================
-- Migration 001: Initial Schema
-- NCWU International Community — PostgreSQL Production Schema
-- Run: psql -U postgres -d ncwu_community -f 001_initial_schema.sql
-- ============================================================

BEGIN;

-- CORE TABLES

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  department TEXT,
  enrollment_year INTEGER,
  current_year INTEGER,
  phone TEXT,
  country TEXT,
  avatar_url TEXT,
  bio TEXT,
  interests TEXT DEFAULT '[]',
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_admin INTEGER DEFAULT 0,
  is_banned INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TEXT,
  agreed_to_terms INTEGER DEFAULT 0,
  agreed_to_terms_at TIMESTAMP,
  google_uid TEXT,
  profile_completed INTEGER DEFAULT 1,
  auth_provider TEXT DEFAULT 'password',
  google_photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  login_method TEXT,
  login_status TEXT NOT NULL,
  login_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  page_visited TEXT,
  referrer TEXT,
  visit_type TEXT DEFAULT 'page_view',
  visited_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitor_stats (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  total_visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  local_visits INTEGER DEFAULT 0,
  domain_visits INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  attempt_count INTEGER DEFAULT 1,
  locked_until TIMESTAMP,
  last_attempt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HSK TABLES

CREATE TABLE IF NOT EXISTS hsk_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  words_learned INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  last_studied TIMESTAMP,
  mastered_words TEXT DEFAULT '[]',
  practicing_words TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, level)
);

CREATE TABLE IF NOT EXISTS hsk_quiz_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INTEGER,
  total_points INTEGER,
  correct_answers INTEGER,
  total_questions INTEGER,
  time_spent INTEGER,
  completed_at TIMESTAMP,
  answers TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hsk_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS hsk_favorite_partners (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

CREATE TABLE IF NOT EXISTS hsk_word_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  words TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hsk_learned_words (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  pos TEXT,
  level INTEGER NOT NULL,
  learned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

CREATE TABLE IF NOT EXISTS hsk_saved_words (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  pos TEXT,
  level INTEGER NOT NULL,
  saved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- SOCIAL FEED

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]',
  feeling TEXT,
  location TEXT,
  tags TEXT DEFAULT '[]',
  visibility TEXT DEFAULT 'public',
  target_departments TEXT DEFAULT '[]',
  target_years TEXT DEFAULT '[]',
  is_emergency INTEGER DEFAULT 0,
  is_anonymous INTEGER DEFAULT 0,
  show_profile_icon INTEGER DEFAULT 1,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  post_type TEXT DEFAULT 'regular',
  title TEXT,
  mentions TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  show_profile_icon INTEGER DEFAULT 1,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_type TEXT DEFAULT 'internal',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data TEXT DEFAULT '{}',
  is_read INTEGER DEFAULT 0,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DISCORD

CREATE TABLE IF NOT EXISTS discord_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'department',
  department TEXT,
  year INTEGER,
  description TEXT,
  icon_url TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES discord_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT,
  display_student_id INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS discord_bans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES discord_groups(id) ON DELETE CASCADE,
  banned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  banned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discord_messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES discord_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  reply_to TEXT REFERENCES discord_messages(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discord_message_views (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES discord_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS discord_user_presence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_group_read_status (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES discord_groups(id) ON DELETE CASCADE,
  last_read_message_id TEXT REFERENCES discord_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- LANGUAGE EXCHANGE

CREATE TABLE IF NOT EXISTS language_exchange_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  native_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  proficiency_level INTEGER DEFAULT 1,
  bio TEXT,
  interests TEXT DEFAULT '[]',
  availability TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS language_exchange_connections (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS language_exchange_chats (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES language_exchange_connections(id) ON DELETE CASCADE,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS language_exchange_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES language_exchange_chats(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- MODERATION

CREATE TABLE IF NOT EXISTS user_flags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  content_preview TEXT,
  detected_words TEXT,
  restriction_type TEXT DEFAULT 'temporary',
  restriction_days INTEGER DEFAULT 3,
  restricted_features TEXT DEFAULT '["social_post","social_comment","discord","language_exchange"]',
  restricted_at TIMESTAMP DEFAULT NOW(),
  restriction_ends_at TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  appeal_message TEXT,
  appeal_submitted_at TIMESTAMP,
  appeal_status TEXT DEFAULT 'none',
  appeal_reviewed_at TIMESTAMP,
  appeal_reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS content_moderation_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  original_content TEXT NOT NULL,
  detected_words TEXT,
  action_taken TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PASSWORD RECOVERY

CREATE TABLE IF NOT EXISTS password_recovery_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  student_id TEXT NOT NULL,
  recovery_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  new_password TEXT,
  resolved_at TIMESTAMP,
  resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EVENTS

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  images TEXT DEFAULT '[]',
  category TEXT DEFAULT 'general',
  max_participants INTEGER,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS event_interests (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  student_id TEXT,
  interested_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_going (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  student_id TEXT,
  status TEXT DEFAULT 'going',
  going_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- MARKETPLACE

CREATE TABLE IF NOT EXISTS market_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'RMB',
  images TEXT DEFAULT '[]',
  category TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  condition TEXT DEFAULT 'good',
  phone_number TEXT,
  reference_links TEXT DEFAULT '[]',
  is_sold INTEGER DEFAULT 0,
  sold_at TIMESTAMP,
  auto_remove_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES market_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id TEXT REFERENCES market_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES market_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS market_buy_requests (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES market_posts(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_price NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  processed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_chat_sessions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES market_posts(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  is_deleted INTEGER DEFAULT 0,
  deleted_at TIMESTAMP,
  deleted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS market_chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES market_chat_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_chat_typing (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES market_chat_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS market_chat_audit_log (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES market_chat_sessions(id) ON DELETE CASCADE,
  performed_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- XINGYUAN AI

CREATE TABLE IF NOT EXISTS xingyuan_chats (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  title TEXT,
  model TEXT DEFAULT 'glm-4v-plus',
  is_deleted INTEGER DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS xingyuan_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES xingyuan_chats(id) ON DELETE CASCADE,
  user_id TEXT,
  role TEXT NOT NULL,
  content TEXT,
  images TEXT DEFAULT '[]',
  thinking TEXT,
  is_deleted INTEGER DEFAULT 0,
  deleted_at TIMESTAMP,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xingyuan_usage_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  ip_address TEXT,
  date TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ip_address, date)
);

-- INDEXES (all CREATE INDEX IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_hsk_learned_words_user ON hsk_learned_words(user_id);
CREATE INDEX IF NOT EXISTS idx_hsk_saved_words_user ON hsk_saved_words(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_discord_groups_type ON discord_groups(type);
CREATE INDEX IF NOT EXISTS idx_discord_groups_department ON discord_groups(department, year);
CREATE INDEX IF NOT EXISTS idx_discord_messages_group ON discord_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discord_messages_user ON discord_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_message_views ON discord_message_views(message_id);
CREATE INDEX IF NOT EXISTS idx_discord_group_members ON discord_group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_discord_group_read_status ON discord_group_read_status(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_language_exchange_profiles_user ON language_exchange_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_language_exchange_profiles_active ON language_exchange_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_language_exchange_connections_requester ON language_exchange_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_language_exchange_connections_receiver ON language_exchange_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_language_exchange_connections_status ON language_exchange_connections(status);
CREATE INDEX IF NOT EXISTS idx_language_exchange_chats_users ON language_exchange_chats(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_language_exchange_messages_chat ON language_exchange_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_language_exchange_messages_sender ON language_exchange_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_active ON user_flags(is_active);
CREATE INDEX IF NOT EXISTS idx_user_flags_ends ON user_flags(restriction_ends_at);
CREATE INDEX IF NOT EXISTS idx_moderation_log_user ON content_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_type ON content_moderation_log(content_type);
CREATE INDEX IF NOT EXISTS idx_password_recovery_user ON password_recovery_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_recovery_status ON password_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_interests_event ON event_interests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interests_user ON event_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_going_event ON event_going(event_id);
CREATE INDEX IF NOT EXISTS idx_event_going_user ON event_going(user_id);
CREATE INDEX IF NOT EXISTS idx_market_posts_user ON market_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_market_posts_category ON market_posts(category);
CREATE INDEX IF NOT EXISTS idx_market_posts_status ON market_posts(status);
CREATE INDEX IF NOT EXISTS idx_market_posts_created ON market_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_comments_post ON market_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_parent ON market_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_market_likes_post ON market_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_market_buy_request_post ON market_buy_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_market_buy_request_status ON market_buy_requests(status);
CREATE INDEX IF NOT EXISTS idx_market_chat_sessions_post ON market_chat_sessions(post_id);
CREATE INDEX IF NOT EXISTS idx_market_chat_sessions_buyer ON market_chat_sessions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_market_chat_sessions_seller ON market_chat_sessions(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_chat_sessions_status ON market_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_market_chat_sessions_deleted ON market_chat_sessions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_market_chat_messages_session ON market_chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_chat_messages_sender ON market_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_market_chat_messages_unread ON market_chat_messages(session_id, is_read);
CREATE INDEX IF NOT EXISTS idx_market_chat_audit_session ON market_chat_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_xingyuan_chats_user ON xingyuan_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_xingyuan_chats_session ON xingyuan_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_xingyuan_chats_deleted ON xingyuan_chats(is_deleted);
CREATE INDEX IF NOT EXISTS idx_xingyuan_messages_chat ON xingyuan_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xingyuan_messages_user ON xingyuan_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_xingyuan_usage_user_date ON xingyuan_usage_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_xingyuan_usage_ip_date ON xingyuan_usage_stats(ip_address, date);

COMMIT;
