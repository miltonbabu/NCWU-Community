-- ============================================================
-- Migration 002: Seed Data
-- Default admin settings for NCWU International Community
-- Run after 001_initial_schema.sql
-- ============================================================

INSERT INTO admin_settings (id, setting_key, setting_value, description) VALUES
  ('setting_site_name_001', 'site_name', 'NCWU International Community', 'Website name'),
  ('setting_allow_reg_002', 'allow_registration', 'true', 'Allow new user registration'),
  ('setting_email_ver_003', 'require_email_verification', 'false', 'Require email verification for new users'),
  ('setting_max_login_004', 'max_login_attempts', '5', 'Maximum login attempts before lockout'),
  ('setting_session_t005', 'session_timeout', '24', 'Session timeout in hours')
ON CONFLICT (setting_key) DO NOTHING;
