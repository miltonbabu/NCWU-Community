import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import xss from "xss";
import { run, get, all } from "../config/database.js";
import {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  requireRole,
} from "../middleware/auth.js";
import { hashPassword } from "../utils/auth.js";
import {
  getAllFlags,
  getFlagStats,
  extendUserBan,
  unbanUser,
  deleteFlag,
} from "../utils/contentModeration.js";
import type {
  User,
  LoginLog,
  ApiResponse,
  UserRole,
  Post,
  Comment,
  AdminAuditLog,
} from "../types/index.js";

const router = Router();

function sanitizeInput(input: string): string {
  return xss(input.trim());
}

function toSafeUser(user: User) {
  return {
    id: user.id,
    student_id: user.student_id,
    email: user.email,
    full_name: user.full_name,
    department: user.department,
    enrollment_year: user.enrollment_year,
    current_year: user.current_year,
    phone: user.phone,
    country: user.country,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role || "user",
    is_admin: !!user.is_admin,
    is_banned: !!user.is_banned,
    is_verified: !!user.is_verified,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

router.get(
  "/dashboard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const totalUsers = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM users",
      );
      const adminCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE is_admin = 1",
      );
      const bannedCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE is_banned = 1",
      );
      const newUsersToday = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')",
      );

      const totalLogins = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM login_logs",
      );
      const loginsToday = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM login_logs WHERE date(login_at) = date('now')",
      );
      const failedLogins = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM login_logs WHERE login_status = 'failed'",
      );

      const totalVisits = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM visitors",
      );
      const visitsToday = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM visitors WHERE date(visited_at) = date('now')",
      );
      const uniqueVisitorsToday = await get<{ count: number }>(
        "SELECT COUNT(DISTINCT ip_address) as count FROM visitors WHERE date(visited_at) = date('now')",
      );

      const recentLogins = await all<{
        id: string;
        user_id: string;
        ip_address: string;
        user_agent: string;
        login_method: string;
        login_status: string;
        login_at: string;
        student_id: string;
        full_name: string;
        email: string;
      }>(`
      SELECT ll.*, u.student_id, u.full_name, u.email
      FROM login_logs ll
      JOIN users u ON ll.user_id = u.id
      ORDER BY ll.login_at DESC
      LIMIT 10
    `);

      const recentUsers = await all<{
        id: string;
        student_id: string;
        email: string;
        full_name: string;
        department: string;
        created_at: string;
      }>(`
      SELECT id, student_id, email, full_name, department, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

      res.json({
        success: true,
        data: {
          stats: {
            users: {
              total: totalUsers?.count || 0,
              admins: adminCount?.count || 0,
              banned: bannedCount?.count || 0,
              newToday: newUsersToday?.count || 0,
            },
            logins: {
              total: totalLogins?.count || 0,
              today: loginsToday?.count || 0,
              failed: failedLogins?.count || 0,
            },
            visitors: {
              total: totalVisits?.count || 0,
              today: visitsToday?.count || 0,
              uniqueToday: uniqueVisitorsToday?.count || 0,
            },
          },
          recentLogins,
          recentUsers,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

// Admin create post endpoint
router.post(
  "/social/posts",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const admin = req.user!;
      const {
        content,
        title,
        images,
        tags,
        visibility = "public",
        is_pinned = false,
        is_emergency = false,
        location,
        post_type = "regular",
      } = req.body;

      // Validate content
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Post content is required",
        } as ApiResponse);
      }

      const postId = uuidv4();
      const now = new Date().toISOString();

      // Handle images - convert to JSON string if array
      const imagesJson = images ? JSON.stringify(images) : null;

      // Handle tags - convert to JSON string if array
      const tagsJson = tags ? JSON.stringify(tags) : null;

      // Insert post as admin (user_id remains null or can be set to a system admin user)
      await run(
        `INSERT INTO posts (
          id, user_id, content, title, images, tags, visibility,
          is_pinned, is_emergency, is_locked, is_anonymous,
          show_profile_icon, location, like_count, comment_count,
          post_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          postId,
          admin.id,
          sanitizeInput(content),
          title ? sanitizeInput(title) : null,
          imagesJson,
          tagsJson,
          visibility,
          is_pinned ? 1 : 0,
          is_emergency ? 1 : 0,
          0,
          0,
          1,
          location ? sanitizeInput(location) : null,
          0,
          0,
          post_type || "regular",
          now,
          now,
        ],
      );

      // Log admin action
      logAdminAction(
        admin.id,
        "create_post",
        "post",
        postId,
        { content: content.substring(0, 100), visibility },
        req.ip || null,
      );

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: {
          id: postId,
          content: sanitizeInput(content),
          title,
          visibility,
          is_pinned,
          is_emergency,
          created_at: now,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Admin create post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/users",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || "";
      const offset = (page - 1) * limit;

      let countQuery = "SELECT COUNT(*) as count FROM users";
      let dataQuery = `
      SELECT id, student_id, email, full_name, department, enrollment_year, 
             current_year, phone, country, role, is_admin, is_banned, is_verified, created_at, updated_at
      FROM users
    `;
      const params: string[] = [];

      if (search) {
        const searchCondition = ` WHERE student_id LIKE ? OR email LIKE ? OR full_name LIKE ?`;
        countQuery += searchCondition;
        dataQuery += searchCondition;
        const searchPattern = `%${sanitizeInput(search)}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      dataQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

      const totalResult = await get<{ count: number }>(countQuery, params);
      const users = await all<User>(dataQuery, [
        ...params,
        limit.toString(),
        offset.toString(),
      ]);

      res.json({
        success: true,
        data: {
          users: users.map(toSafeUser),
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/users/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = await get<User>(
        `
      SELECT id, student_id, email, full_name, department, enrollment_year, 
             current_year, phone, country, avatar_url, bio, role, is_admin, is_banned, 
             is_verified, created_at, updated_at
      FROM users WHERE id = ?
    `,
        [req.params.id],
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      const loginHistory = await all<LoginLog>(
        `
      SELECT * FROM login_logs WHERE user_id = ? ORDER BY login_at DESC LIMIT 20
    `,
        [req.params.id],
      );

      res.json({
        success: true,
        data: {
          user: toSafeUser(user),
          loginHistory,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/users",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { student_id, email, password, role } = req.body;

      if (!student_id || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Student ID, email, and password are required",
        } as ApiResponse);
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        } as ApiResponse);
      }

      const existingStudentId = await get<{ id: string }>(
        "SELECT id FROM users WHERE student_id = ?",
        [sanitizeInput(student_id)],
      );
      if (existingStudentId) {
        return res.status(409).json({
          success: false,
          message: "Student ID already registered",
        } as ApiResponse);
      }

      const existingEmail = await get<{ id: string }>(
        "SELECT id FROM users WHERE email = ?",
        [sanitizeInput(email)],
      );
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        } as ApiResponse);
      }

      const passwordHash = await hashPassword(password);
      const userId = uuidv4();
      const userRole: UserRole =
        role === "admin"
          ? "admin"
          : role === "superadmin"
            ? "superadmin"
            : "user";
      const isAdmin = userRole === "admin" || userRole === "superadmin" ? 1 : 0;

      await run(
        `INSERT INTO users (id, student_id, email, full_name, password_hash, role, is_admin, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          userId,
          sanitizeInput(student_id),
          sanitizeInput(email),
          sanitizeInput(email.split("@")[0]),
          passwordHash,
          userRole,
          isAdmin,
        ],
      );

      const newUser = await get<User>("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user: toSafeUser(newUser!) },
      } as ApiResponse);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.put(
  "/users/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const isSuperAdmin = currentUser.role === "superadmin";

      const {
        student_id,
        full_name,
        email,
        department,
        enrollment_year,
        current_year,
        phone,
        country,
        bio,
        role,
        is_admin,
        is_banned,
        is_verified,
      } = req.body;

      const targetUser = await get<User>("SELECT * FROM users WHERE id = ?", [
        id,
      ]);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      if (!isSuperAdmin && targetUser.role === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Cannot modify SuperAdmin account",
        } as ApiResponse);
      }

      const updateFields: string[] = [];
      const updateValues: (string | number | null)[] = [];

      if (student_id !== undefined && isSuperAdmin) {
        const existingStudentId = await get<{ id: string }>(
          "SELECT id FROM users WHERE student_id = ? AND id != ?",
          [sanitizeInput(student_id), id],
        );
        if (existingStudentId) {
          return res.status(409).json({
            success: false,
            message: "Student ID already in use by another account",
          } as ApiResponse);
        }
        updateFields.push("student_id = ?");
        updateValues.push(sanitizeInput(student_id));
      }

      if (full_name !== undefined) {
        updateFields.push("full_name = ?");
        updateValues.push(sanitizeInput(full_name));
      }
      if (email !== undefined) {
        const existingEmail = await get<{ id: string }>(
          "SELECT id FROM users WHERE email = ? AND id != ?",
          [sanitizeInput(email), id],
        );
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: "Email already in use by another account",
          } as ApiResponse);
        }
        updateFields.push("email = ?");
        updateValues.push(sanitizeInput(email));
      }
      if (department !== undefined) {
        updateFields.push("department = ?");
        updateValues.push(department ? sanitizeInput(department) : null);
      }
      if (enrollment_year !== undefined) {
        updateFields.push("enrollment_year = ?");
        updateValues.push(enrollment_year || null);
      }
      if (current_year !== undefined) {
        updateFields.push("current_year = ?");
        updateValues.push(current_year || null);
      }
      if (phone !== undefined) {
        updateFields.push("phone = ?");
        updateValues.push(phone ? sanitizeInput(phone) : null);
      }
      if (country !== undefined) {
        updateFields.push("country = ?");
        updateValues.push(country ? sanitizeInput(country) : null);
      }
      if (bio !== undefined) {
        updateFields.push("bio = ?");
        updateValues.push(bio ? sanitizeInput(bio) : null);
      }

      if (role !== undefined && isSuperAdmin) {
        if (
          targetUser.role === "superadmin" &&
          role !== "superadmin" &&
          currentUser.id !== id
        ) {
          return res.status(403).json({
            success: false,
            message: "Cannot change another SuperAdmin's role",
          } as ApiResponse);
        }

        if (currentUser.id === id && role !== "superadmin") {
          return res.status(403).json({
            success: false,
            message: "Cannot change your own SuperAdmin role",
          } as ApiResponse);
        }

        const validRoles: UserRole[] = ["user", "admin", "superadmin"];
        if (validRoles.includes(role)) {
          updateFields.push("role = ?");
          updateValues.push(role);
          updateFields.push("is_admin = ?");
          updateValues.push(role === "admin" || role === "superadmin" ? 1 : 0);
        }
      }
      if (is_admin !== undefined && isSuperAdmin && role === undefined) {
        updateFields.push("is_admin = ?");
        updateValues.push(is_admin ? 1 : 0);
      }
      if (is_banned !== undefined) {
        updateFields.push("is_banned = ?");
        updateValues.push(is_banned ? 1 : 0);
      }
      if (is_verified !== undefined) {
        updateFields.push("is_verified = ?");
        updateValues.push(is_verified ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        } as ApiResponse);
      }

      updateFields.push('updated_at = datetime("now")');
      updateValues.push(id);

      await run(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      const updatedUser = await get<User>(
        `
      SELECT id, student_id, email, full_name, department, enrollment_year, 
             current_year, phone, country, avatar_url, bio, role, is_admin, is_banned, is_verified, created_at, updated_at
      FROM users WHERE id = ?
    `,
        [id],
      );

      res.json({
        success: true,
        message: "User updated successfully",
        data: { user: toSafeUser(updatedUser!) },
      } as ApiResponse);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/users/:id",
  authenticate,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      if (id === currentUser.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        } as ApiResponse);
      }

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      await run("DELETE FROM login_logs WHERE user_id = ?", [id]);
      await run("DELETE FROM login_attempts WHERE user_id = ?", [id]);
      await run("DELETE FROM users WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "User deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/users/:id/ban",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const isSuperAdmin = currentUser.role === "superadmin";

      if (id === currentUser.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot ban your own account",
        } as ApiResponse);
      }

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      if (!isSuperAdmin && user.role === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Cannot ban SuperAdmin account",
        } as ApiResponse);
      }

      await run(
        'UPDATE users SET is_banned = 1, updated_at = datetime("now") WHERE id = ?',
        [id],
      );

      res.json({
        success: true,
        message: "User banned successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/users/:id/unban",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      await run(
        'UPDATE users SET is_banned = 0, updated_at = datetime("now") WHERE id = ?',
        [id],
      );

      res.json({
        success: true,
        message: "User unbanned successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/users/:id/reset-password",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        } as ApiResponse);
      }

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      const passwordHash = await hashPassword(new_password);
      await run(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
        [passwordHash, id],
      );

      await run("DELETE FROM login_attempts WHERE user_id = ?", [id]);

      res.json({
        success: true,
        message: "Password reset successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/users/:id/hsk-data",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      // Delete all HSK data for the user
      await run("DELETE FROM hsk_progress WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_quiz_results WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_bookmarks WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_favorite_partners WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_word_lists WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_learned_words WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_saved_words WHERE user_id = ?", [id]);

      res.json({
        success: true,
        message: "HSK data deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete HSK data error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/users/:id/profile-data",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
      }

      // Delete HSK data
      await run("DELETE FROM hsk_progress WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_quiz_results WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_bookmarks WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_favorite_partners WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_word_lists WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_learned_words WHERE user_id = ?", [id]);
      await run("DELETE FROM hsk_saved_words WHERE user_id = ?", [id]);

      // Delete social data (posts, comments, likes, shares)
      await run("DELETE FROM likes WHERE user_id = ?", [id]);
      await run("DELETE FROM shares WHERE user_id = ?", [id]);
      await run("DELETE FROM comments WHERE user_id = ?", [id]);
      await run("DELETE FROM posts WHERE user_id = ?", [id]);

      // Delete notifications
      await run("DELETE FROM notifications WHERE user_id = ?", [id]);

      // Delete Discord data
      await run("DELETE FROM discord_message_views WHERE user_id = ?", [id]);
      await run("DELETE FROM discord_group_read_status WHERE user_id = ?", [
        id,
      ]);
      await run("DELETE FROM discord_user_presence WHERE user_id = ?", [id]);
      await run("DELETE FROM discord_messages WHERE user_id = ?", [id]);
      await run("DELETE FROM discord_bans WHERE user_id = ?", [id]);
      await run("DELETE FROM discord_group_members WHERE user_id = ?", [id]);

      // Delete language exchange data
      const chatIds = await all<{ id: string }>(
        "SELECT id FROM language_exchange_chats WHERE user1_id = ? OR user2_id = ?",
        [id, id],
      );
      for (const chat of chatIds) {
        await run("DELETE FROM language_exchange_messages WHERE chat_id = ?", [
          chat.id,
        ]);
      }
      await run(
        "DELETE FROM language_exchange_chats WHERE user1_id = ? OR user2_id = ?",
        [id, id],
      );
      await run(
        "DELETE FROM language_exchange_connections WHERE requester_id = ? OR receiver_id = ?",
        [id, id],
      );
      await run("DELETE FROM language_exchange_profiles WHERE user_id = ?", [
        id,
      ]);

      // Delete moderation data
      await run("DELETE FROM content_moderation_log WHERE user_id = ?", [id]);
      await run("DELETE FROM user_flags WHERE user_id = ?", [id]);

      res.json({
        success: true,
        message: "Profile data deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete profile data error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/login-logs",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.query.userId as string;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let dataQuery = `
      SELECT ll.*, u.student_id, u.full_name, u.email
      FROM login_logs ll
      JOIN users u ON ll.user_id = u.id
    `;
      const params: string[] = [];
      const conditions: string[] = [];

      if (userId) {
        conditions.push("ll.user_id = ?");
        params.push(userId);
      }
      if (status) {
        conditions.push("ll.login_status = ?");
        params.push(status);
      }

      if (conditions.length > 0) {
        dataQuery += " WHERE " + conditions.join(" AND ");
      }

      dataQuery += " ORDER BY ll.login_at DESC LIMIT ? OFFSET ?";
      params.push(limit.toString(), offset.toString());

      const logs = await all<
        LoginLog & { student_id: string; full_name: string; email: string }
      >(dataQuery, params);

      let countQuery = "SELECT COUNT(*) as count FROM login_logs ll";
      const countParams: string[] = [];
      if (userId) {
        countQuery += " WHERE user_id = ?";
        countParams.push(userId);
      }
      if (status) {
        countQuery += (userId ? " AND" : " WHERE") + " login_status = ?";
        countParams.push(status);
      }

      const totalResult = await get<{ count: number }>(countQuery, countParams);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get login logs error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/login-logs/all",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const admin = req.user!;
      const result = await run("DELETE FROM login_logs");

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, created_at)
         VALUES (?, ?, 'clear_login_logs', 'system', 'all', ?, datetime('now'))`,
        [uuidv4(), admin.id, `Cleared ${result.changes} login logs`],
      );

      res.json({
        success: true,
        message: `Deleted ${result.changes} login logs`,
        data: { deletedCount: result.changes },
      } as ApiResponse);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Clear login logs error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to clear login logs: ${errMsg}`,
      } as ApiResponse);
    }
  },
);

router.delete(
  "/login-logs/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const log = await get<{ id: string }>(
        "SELECT id FROM login_logs WHERE id = ?",
        [id],
      );

      if (!log) {
        return res.status(404).json({
          success: false,
          message: "Login log not found",
        } as ApiResponse);
      }

      await run("DELETE FROM login_logs WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Login log deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete login log error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/login-logs",
  authenticate,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await run("DELETE FROM login_logs");

      res.json({
        success: true,
        message: `Deleted all ${result.changes} login logs`,
        data: { deletedCount: result.changes },
      } as ApiResponse);
    } catch (error) {
      console.error("Delete all login logs error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/visitors",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const totalResult = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM visitors",
      );
      const visitors = await all<{
        id: string;
        user_id: string | null;
        ip_address: string | null;
        user_agent: string | null;
        page_visited: string | null;
        referrer: string | null;
        visit_type: string;
        visited_at: string;
        user_name: string | null;
        user_student_id: string | null;
      }>(
        `SELECT v.*, u.full_name as user_name, u.student_id as user_student_id 
         FROM visitors v 
         LEFT JOIN users u ON v.user_id = u.id
         ORDER BY v.visited_at DESC LIMIT ? OFFSET ?`,
        [limit.toString(), offset.toString()],
      );

      res.json({
        success: true,
        data: {
          visitors,
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get visitors error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/visitors/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const visitor = await get<{ id: string }>(
        "SELECT id FROM visitors WHERE id = ?",
        [id],
      );

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor record not found",
        } as ApiResponse);
      }

      await run("DELETE FROM visitors WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Visitor record deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete visitor error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/visitors/user/:userId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await run("DELETE FROM visitors WHERE user_id = ?", [
        userId,
      ]);

      res.json({
        success: true,
        message: `Deleted ${result.changes} visitor records for user`,
        data: { deletedCount: result.changes },
      } as ApiResponse);
    } catch (error) {
      console.error("Delete user visitors error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/visitors",
  authenticate,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await run("DELETE FROM visitors");

      res.json({
        success: true,
        message: `Deleted all ${result.changes} visitor records`,
        data: { deletedCount: result.changes },
      } as ApiResponse);
    } catch (error) {
      console.error("Delete all visitors error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/visitor-stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;

      const dailyStats = await all(
        `
      SELECT 
        date(visited_at) as date,
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM visitors
      WHERE visited_at >= date('now', '-' || ? || ' days')
      GROUP BY date(visited_at)
      ORDER BY date DESC
    `,
        [days.toString()],
      );

      const totalStats = await get<{
        total_visits: number;
        unique_visitors: number;
      }>(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM visitors
    `);

      const pageStats = await all(`
      SELECT 
        page_visited,
        COUNT(*) as visit_count
      FROM visitors
      WHERE page_visited IS NOT NULL
      GROUP BY page_visited
      ORDER BY visit_count DESC
      LIMIT 20
    `);

      res.json({
        success: true,
        data: {
          dailyStats,
          totalStats,
          pageStats,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get visitor stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/settings",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const settings = await all("SELECT * FROM admin_settings");

      res.json({
        success: true,
        data: { settings },
      } as ApiResponse);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.put(
  "/settings/:key",
  authenticate,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const setting = await get(
        "SELECT * FROM admin_settings WHERE setting_key = ?",
        [key],
      );
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: "Setting not found",
        } as ApiResponse);
      }

      await run(
        `
      UPDATE admin_settings 
      SET setting_value = ?, updated_at = datetime("now"), updated_by = ?
      WHERE setting_key = ?
    `,
        [value, req.userId, key],
      );

      res.json({
        success: true,
        message: "Setting updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/download/users",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const allUsers = await all<{
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
        role: string;
        is_admin: number;
        is_banned: number;
        is_verified: number;
        created_at: string;
        updated_at: string;
      }>(`
          SELECT 
            id, student_id, email, full_name, department, enrollment_year, 
            current_year, phone, country, avatar_url, bio, role, is_admin, is_banned, is_verified, created_at, updated_at
          FROM users
          ORDER BY created_at DESC
        `);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");
      res.json({
        success: true,
        data: allUsers,
      });
    } catch (error) {
      console.error("Download users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

router.get(
  "/download/users/pdf",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const allUsers = await all<{
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
        role: string;
        is_admin: number;
        is_banned: number;
        is_verified: number;
        created_at: string;
        updated_at: string;
      }>(`
          SELECT 
            id, student_id, email, full_name, department, enrollment_year, 
            current_year, phone, country, avatar_url, bio, role, is_admin, is_banned, is_verified, created_at, updated_at
          FROM users
          ORDER BY created_at DESC
        `);

      const pdfContent = allUsers.map((user) => ({
        id: user.id,
        student_id: user.student_id,
        email: user.email,
        full_name: user.full_name,
        department: user.department,
        enrollment_year: user.enrollment_year,
        current_year: user.current_year,
        phone: user.phone,
        country: user.country,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
        is_admin: user.is_admin,
        is_banned: user.is_banned,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));

      const pdfData = {
        title: "NCWU Community - All Users",
        author: "NCWU Admin",
        subject: "User List",
        creator: "NCWU Community",
        producer: "NCWU",
        keywords: ["users", "students", "NCWU"],
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=users.pdf");
      res.json({
        success: true,
        data: { pdfData, users: allUsers },
      });
    } catch (error) {
      console.error("Download PDF error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: Record<string, unknown>,
  ipAddress: string | null,
): Promise<void> {
  const logId = uuidv4();
  await run(
    `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      logId,
      adminId,
      action,
      targetType,
      targetId,
      JSON.stringify(details),
      ipAddress,
    ],
  );
}

router.get(
  "/gallery-posts",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      let dataQuery = `
        SELECT p.*, u.full_name as author_name, u.student_id as author_student_id
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.post_type = 'gallery' AND p.deleted_at IS NULL
      `;
      const params: string[] = [];

      if (search) {
        dataQuery += " AND (p.title LIKE ? OR p.content LIKE ?)";
        params.push(`%${sanitizeInput(search)}%`, `%${sanitizeInput(search)}%`);
      }

      dataQuery +=
        " ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit.toString(), offset.toString());

      const posts = await all<
        Post & { author_name: string | null; author_student_id: string | null }
      >(dataQuery, params);

      const totalCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE post_type = 'gallery' AND deleted_at IS NULL",
      );

      const todayCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE post_type = 'gallery' AND deleted_at IS NULL AND date(created_at) = date('now')",
      );

      const pinnedCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE post_type = 'gallery' AND deleted_at IS NULL AND is_pinned = 1",
      );

      const totalLikes = await get<{ total: number }>(
        "SELECT SUM(like_count) as total FROM posts WHERE post_type = 'gallery' AND deleted_at IS NULL",
      );

      res.json({
        success: true,
        data: {
          posts: posts || [],
          stats: {
            total: totalCount?.count || 0,
            today: todayCount?.count || 0,
            pinned: pinnedCount?.count || 0,
            totalLikes: totalLikes?.total || 0,
          },
          pagination: {
            page,
            limit,
            total: totalCount?.count || 0,
            hasMore: (posts?.length || 0) === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching gallery posts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch gallery posts",
      });
    }
  },
);

router.get(
  "/social/posts",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const visibility = req.query.visibility as string;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      let dataQuery = `
        SELECT p.*, u.full_name as author_name, u.student_id as author_student_id
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.deleted_at IS NULL
      `;
      const params: string[] = [];

      if (visibility) {
        dataQuery += " AND p.visibility = ?";
        params.push(visibility);
      }

      if (search) {
        dataQuery += " AND p.content LIKE ?";
        params.push(`%${sanitizeInput(search)}%`);
      }

      dataQuery += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit.toString(), offset.toString());

      const posts = await all<
        Post & { author_name: string | null; author_student_id: string | null }
      >(dataQuery, params);

      let countQuery =
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL";
      const countParams: string[] = [];
      if (visibility) {
        countQuery += " AND visibility = ?";
        countParams.push(visibility);
      }
      if (search) {
        countQuery += " AND content LIKE ?";
        countParams.push(`%${sanitizeInput(search)}%`);
      }

      const totalResult = await get<{ count: number }>(countQuery, countParams);

      res.json({
        success: true,
        data: {
          posts: posts.map((post) => ({
            ...post,
            images: JSON.parse((post.images as unknown as string) || "[]"),
            target_departments: JSON.parse(
              (post.target_departments as unknown as string) || "[]",
            ),
            target_years: JSON.parse(
              (post.target_years as unknown as string) || "[]",
            ),
          })),
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get social posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/social/posts/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        } as ApiResponse);
      }

      await run(`UPDATE posts SET deleted_at = datetime('now') WHERE id = ?`, [
        id,
      ]);

      logAdminAction(
        admin.id,
        "delete_post",
        "post",
        id,
        { postContent: post.content.substring(0, 100), authorId: post.user_id },
        req.ip || null,
      );

      res.json({
        success: true,
        message: "Post deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/social/posts/:id/lock",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        } as ApiResponse);
      }

      const newLockState = post.is_locked ? 0 : 1;
      await run(`UPDATE posts SET is_locked = ? WHERE id = ?`, [
        newLockState,
        id,
      ]);

      logAdminAction(
        admin.id,
        newLockState ? "lock_post" : "unlock_post",
        "post",
        id,
        { previousState: post.is_locked },
        req.ip || null,
      );

      res.json({
        success: true,
        message: newLockState
          ? "Post locked successfully"
          : "Post unlocked successfully",
        data: { is_locked: !!newLockState },
      } as ApiResponse);
    } catch (error) {
      console.error("Lock post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/social/posts/:id/pin",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        } as ApiResponse);
      }

      const newPinState = post.is_pinned ? 0 : 1;
      await run(`UPDATE posts SET is_pinned = ? WHERE id = ?`, [
        newPinState,
        id,
      ]);

      logAdminAction(
        admin.id,
        newPinState ? "pin_post" : "unpin_post",
        "post",
        id,
        { previousState: post.is_pinned },
        req.ip || null,
      );

      res.json({
        success: true,
        message: newPinState
          ? "Post pinned successfully"
          : "Post unpinned successfully",
        data: { is_pinned: !!newPinState },
      } as ApiResponse);
    } catch (error) {
      console.error("Pin post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/social/comments",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const postId = req.query.postId as string;
      const offset = (page - 1) * limit;

      let dataQuery = `
        SELECT c.*, u.full_name as author_name, u.student_id as author_student_id, p.content as post_content
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN posts p ON c.post_id = p.id
        WHERE c.deleted_at IS NULL
      `;
      const params: string[] = [];

      if (postId) {
        dataQuery += " AND c.post_id = ?";
        params.push(postId);
      }

      dataQuery += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit.toString(), offset.toString());

      const comments = await all<
        Comment & {
          author_name: string | null;
          author_student_id: string | null;
          post_content: string | null;
        }
      >(dataQuery, params);

      let countQuery =
        "SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL";
      const countParams: string[] = [];
      if (postId) {
        countQuery += " AND post_id = ?";
        countParams.push(postId);
      }

      const totalResult = await get<{ count: number }>(countQuery, countParams);

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get social comments error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/social/comments/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const comment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        } as ApiResponse);
      }

      await run(
        `UPDATE comments SET deleted_at = datetime('now') WHERE id = ?`,
        [id],
      );
      await run(
        `UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?`,
        [comment.post_id],
      );

      if (comment.parent_comment_id) {
        await run(
          `UPDATE comments SET reply_count = reply_count - 1 WHERE id = ?`,
          [comment.parent_comment_id],
        );
      }

      logAdminAction(
        admin.id,
        "delete_comment",
        "comment",
        id,
        {
          commentContent: comment.content.substring(0, 100),
          postId: comment.post_id,
          authorId: comment.user_id,
        },
        req.ip || null,
      );

      res.json({
        success: true,
        message: "Comment deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/social/audit-logs",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const action = req.query.action as string;
      const offset = (page - 1) * limit;

      let dataQuery = `
        SELECT al.*, u.full_name as admin_name, u.student_id as admin_student_id
        FROM admin_audit_logs al
        LEFT JOIN users u ON al.admin_id = u.id
      `;
      const params: string[] = [];

      if (action) {
        dataQuery += " WHERE al.action LIKE ?";
        params.push(`%${action}%`);
      }

      dataQuery += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit.toString(), offset.toString());

      const logs = await all<
        AdminAuditLog & {
          admin_name: string | null;
          admin_student_id: string | null;
        }
      >(dataQuery, params);

      let countQuery = "SELECT COUNT(*) as count FROM admin_audit_logs";
      const countParams: string[] = [];
      if (action) {
        countQuery += " WHERE action LIKE ?";
        countParams.push(`%${action}%`);
      }

      const totalResult = await get<{ count: number }>(countQuery, countParams);

      res.json({
        success: true,
        data: {
          logs: logs.map((log) => ({
            ...log,
            details: JSON.parse((log.details as unknown as string) || "{}"),
          })),
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/social/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const totalPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL",
      );
      const totalComments = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL",
      );
      const totalLikes = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM likes",
      );
      const postsToday = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL AND date(created_at) = date('now')",
      );
      const commentsToday = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL AND date(created_at) = date('now')",
      );
      const emergencyPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL AND is_emergency = 1",
      );
      const pinnedPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL AND is_pinned = 1",
      );
      const lockedPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL AND is_locked = 1",
      );

      const postsByVisibility = await all<{
        visibility: string;
        count: number;
      }>(
        `SELECT visibility, COUNT(*) as count FROM posts WHERE deleted_at IS NULL GROUP BY visibility`,
      );

      const topPosts = await all<{
        id: string;
        content: string;
        images: string;
        like_count: number;
        comment_count: number;
        share_count: number;
        author_name: string;
      }>(
        `SELECT p.id, p.content, p.images, p.like_count, p.comment_count, p.share_count, u.full_name as author_name
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.deleted_at IS NULL
         ORDER BY (p.like_count + p.comment_count * 2 + p.share_count * 3) DESC
         LIMIT 10`,
      );

      res.json({
        success: true,
        data: {
          totals: {
            posts: totalPosts?.count || 0,
            comments: totalComments?.count || 0,
            likes: totalLikes?.count || 0,
          },
          today: {
            posts: postsToday?.count || 0,
            comments: commentsToday?.count || 0,
          },
          special: {
            emergency: emergencyPosts?.count || 0,
            pinned: pinnedPosts?.count || 0,
            locked: lockedPosts?.count || 0,
          },
          postsByVisibility,
          topPosts: topPosts.map((post) => ({
            ...post,
            images: JSON.parse((post.images as unknown as string) || "[]"),
          })),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get social stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get(
  "/language-exchange/groups",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const groups = await all<{
        id: string;
        requester_id: string;
        receiver_id: string;
        status: string;
        created_at: string;
        updated_at: string;
        chat_id: string | null;
        requester_name: string;
        requester_avatar: string | null;
        requester_department: string | null;
        receiver_name: string;
        receiver_avatar: string | null;
        receiver_department: string | null;
        message_count: number;
      }>(
        `SELECT 
          lec.id,
          lec.requester_id,
          lec.receiver_id,
          lec.status,
          lec.created_at,
          lec.updated_at,
          lec_chat.id as chat_id,
          requester.full_name as requester_name,
          requester.avatar_url as requester_avatar,
          requester.department as requester_department,
          receiver.full_name as receiver_name,
          receiver.avatar_url as receiver_avatar,
          receiver.department as receiver_department,
          (SELECT COUNT(*) FROM language_exchange_messages WHERE chat_id = lec_chat.id AND deleted_at IS NULL) as message_count
        FROM language_exchange_connections lec
        LEFT JOIN users requester ON lec.requester_id = requester.id
        LEFT JOIN users receiver ON lec.receiver_id = receiver.id
        LEFT JOIN language_exchange_chats lec_chat ON lec.id = lec_chat.connection_id
        WHERE lec.status = 'accepted'
        ORDER BY lec.updated_at DESC`,
      );

      res.json({
        success: true,
        data: groups,
      });
    } catch (error) {
      console.error("Error fetching language exchange groups:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch language exchange groups",
      });
    }
  },
);

router.get(
  "/language-exchange/groups/:id/chats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 100 } = req.query;

      const connection = await get<{ id: string; status: string }>(
        "SELECT id, status FROM language_exchange_connections WHERE id = ?",
        [id],
      );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: "Connection not found",
        });
      }

      const chat = await get<{ id: string }>(
        "SELECT id FROM language_exchange_chats WHERE connection_id = ?",
        [id],
      );

      if (!chat) {
        return res.json({
          success: true,
          data: [],
          message: "No chat found for this connection",
        });
      }

      const offset = (Number(page) - 1) * Number(limit);

      const messages = await all<{
        id: string;
        chat_id: string;
        sender_id: string;
        content: string;
        created_at: string;
        sender_full_name: string;
        sender_avatar_url: string | null;
      }>(
        `SELECT 
          lem.id,
          lem.chat_id,
          lem.sender_id,
          lem.content,
          lem.created_at,
          u.full_name as sender_full_name,
          u.avatar_url as sender_avatar_url
        FROM language_exchange_messages lem
        JOIN users u ON lem.sender_id = u.id
        WHERE lem.chat_id = ? AND lem.deleted_at IS NULL
        ORDER BY lem.created_at ASC
        LIMIT ? OFFSET ?`,
        [chat.id, Number(limit), offset],
      );

      res.json({
        success: true,
        data: messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: messages.length === Number(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching group chats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch group chats",
      });
    }
  },
);

router.delete(
  "/language-exchange/groups/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const connection = await get<{ id: string }>(
        "SELECT id FROM language_exchange_connections WHERE id = ?",
        [id],
      );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: "Connection not found",
        });
      }

      const chat = await get<{ id: string }>(
        "SELECT id FROM language_exchange_chats WHERE connection_id = ?",
        [id],
      );

      if (chat) {
        await run("DELETE FROM language_exchange_messages WHERE chat_id = ?", [
          chat.id,
        ]);
        await run("DELETE FROM language_exchange_chats WHERE id = ?", [
          chat.id,
        ]);
      }

      await run("DELETE FROM language_exchange_connections WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Language exchange group deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting language exchange group:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete language exchange group",
      });
    }
  },
);

router.delete(
  "/language-exchange/chats/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const chat = await get<{ id: string; connection_id: string }>(
        "SELECT id, connection_id FROM language_exchange_chats WHERE id = ?",
        [id],
      );

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      // Only delete messages, keep chat and connection
      await run("DELETE FROM language_exchange_messages WHERE chat_id = ?", [
        id,
      ]);

      res.json({
        success: true,
        message: "Chat history cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear chat history",
      });
    }
  },
);

router.delete(
  "/language-exchange/chats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      // Only delete all messages, keep all chats and connections
      await run("DELETE FROM language_exchange_messages");

      res.json({
        success: true,
        message: "All chat history cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing all chat history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear all chat history",
      });
    }
  },
);

// Disconnect a connection (change status to disconnected)
router.post(
  "/language-exchange/connections/:id/disconnect",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const connection = await get<{ id: string }>(
        "SELECT id FROM language_exchange_connections WHERE id = ?",
        [id],
      );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: "Connection not found",
        });
      }

      await run(
        `UPDATE language_exchange_connections
         SET status = 'disconnected', updated_at = datetime('now')
         WHERE id = ?`,
        [id],
      );

      res.json({
        success: true,
        message: "Connection disconnected successfully",
      });
    } catch (error) {
      console.error("Error disconnecting connection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to disconnect connection",
      });
    }
  },
);

// Disconnect all connections
router.post(
  "/language-exchange/connections/disconnect-all",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      await run(
        `UPDATE language_exchange_connections 
         SET status = 'disconnected', updated_at = datetime('now') 
         WHERE status = 'accepted'`,
      );

      res.json({
        success: true,
        message: "All connections disconnected successfully",
      });
    } catch (error) {
      console.error("Error disconnecting all connections:", error);
      res.status(500).json({
        success: false,
        message: "Failed to disconnect all connections",
      });
    }
  },
);

router.get(
  "/language-exchange/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const totalProfiles = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_profiles WHERE is_active = 1",
      );

      const totalConnections = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_connections WHERE status = 'accepted'",
      );

      const pendingRequests = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_connections WHERE status = 'pending'",
      );

      const totalChats = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_chats",
      );

      const totalMessages = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_messages WHERE deleted_at IS NULL",
      );

      res.json({
        success: true,
        data: {
          totalProfiles: totalProfiles?.count || 0,
          totalConnections: totalConnections?.count || 0,
          pendingRequests: pendingRequests?.count || 0,
          totalChats: totalChats?.count || 0,
          totalMessages: totalMessages?.count || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching language exchange stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch language exchange stats",
      });
    }
  },
);

// System Health Endpoint
router.get(
  "/system-health",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();

      // Test database connection
      const dbTest = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM users",
      );
      const dbLatency = Date.now() - startTime;

      // Get database stats (works on both SQLite and PostgreSQL)
      const dbSize = await get<{ size: number }>(
        process.env.NODE_ENV === "production"
          ? "SELECT pg_database_size(current_database()) as size"
          : "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()",
      );

      // Get table counts
      const tableStats = await all<{ name: string; count: number }>(`
        SELECT 
          'users' as name, COUNT(*) as count FROM users
        UNION ALL
        SELECT 'posts', COUNT(*) FROM posts WHERE deleted_at IS NULL
        UNION ALL
        SELECT 'comments', COUNT(*) FROM comments WHERE deleted_at IS NULL
        UNION ALL
        SELECT 'login_logs', COUNT(*) FROM login_logs
        UNION ALL
        SELECT 'visitors', COUNT(*) FROM visitors
        UNION ALL
        SELECT 'discord_messages', COUNT(*) FROM discord_messages WHERE deleted_at IS NULL
        UNION ALL
        SELECT 'language_exchange_messages', COUNT(*) FROM language_exchange_messages WHERE deleted_at IS NULL
      `);

      // Get recent errors (failed logins as proxy)
      const recentErrors = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM login_logs WHERE login_status = 'failed' AND login_at >= datetime('now', '-1 hour')",
      );

      res.json({
        success: true,
        data: {
          status: dbTest ? "healthy" : "unhealthy",
          timestamp: new Date().toISOString(),
          database: {
            connected: !!dbTest,
            latency: dbLatency,
            size: dbSize?.size || 0,
            tables: tableStats || [],
          },
          errors: {
            lastHour: recentErrors?.count || 0,
          },
          uptime: process.uptime(),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("System health check error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check system health",
        data: {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      } as ApiResponse);
    }
  },
);

// Activity Feed Endpoint
router.get(
  "/activity-feed",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get recent activities from various sources
      const recentPosts = await all<{
        id: string;
        type: string;
        user_id: string;
        user_name: string;
        content: string;
        created_at: string;
      }>(`
        SELECT 
          p.id,
          'post' as type,
          p.user_id,
          u.full_name as user_name,
          substr(p.content, 1, 100) as content,
          p.created_at
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `);

      const recentComments = await all<{
        id: string;
        type: string;
        user_id: string;
        user_name: string;
        content: string;
        created_at: string;
      }>(`
        SELECT 
          c.id,
          'comment' as type,
          c.user_id,
          u.full_name as user_name,
          substr(c.content, 1, 100) as content,
          c.created_at
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.deleted_at IS NULL
        ORDER BY c.created_at DESC
        LIMIT ${limit}
      `);

      const recentLogins = await all<{
        id: string;
        type: string;
        user_id: string;
        user_name: string;
        content: string;
        created_at: string;
      }>(`
        SELECT 
          ll.id,
          'login' as type,
          ll.user_id,
          u.full_name as user_name,
          ll.login_status as content,
          ll.login_at as created_at
        FROM login_logs ll
        JOIN users u ON ll.user_id = u.id
        ORDER BY ll.login_at DESC
        LIMIT ${limit}
      `);

      const recentLikes = await all<{
        id: string;
        type: string;
        user_id: string;
        user_name: string;
        content: string;
        created_at: string;
      }>(`
        SELECT 
          l.id,
          'like' as type,
          l.user_id,
          u.full_name as user_name,
          'liked a post' as content,
          l.created_at
        FROM likes l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ${limit}
      `);

      // Combine and sort all activities
      const allActivities = [
        ...(recentPosts || []),
        ...(recentComments || []),
        ...(recentLogins || []),
        ...(recentLikes || []),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, limit);

      res.json({
        success: true,
        data: {
          activities: allActivities,
          total: allActivities.length,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Activity feed error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch activity feed",
      } as ApiResponse);
    }
  },
);

// Content Moderation Queue Endpoint
router.get(
  "/moderation-queue",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      // Get posts that might need moderation (high report count, emergency posts, etc.)
      const flaggedPosts = await all<{
        id: string;
        type: string;
        content: string;
        author_id: string;
        author_name: string;
        reason: string;
        created_at: string;
      }>(`
        SELECT 
          p.id,
          'post' as type,
          substr(p.content, 1, 200) as content,
          p.user_id as author_id,
          u.full_name as author_name,
          CASE 
            WHEN p.is_emergency = 1 THEN 'emergency_post'
            WHEN p.is_locked = 1 THEN 'locked_post'
            ELSE 'standard'
          END as reason,
          p.created_at
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.deleted_at IS NULL
          AND (p.is_emergency = 1 OR p.is_locked = 1)
        ORDER BY p.created_at DESC
        LIMIT 50
      `);

      // Get recent comments for moderation
      const recentComments = await all<{
        id: string;
        type: string;
        content: string;
        author_id: string;
        author_name: string;
        reason: string;
        created_at: string;
      }>(`
        SELECT 
          c.id,
          'comment' as type,
          substr(c.content, 1, 200) as content,
          c.user_id as author_id,
          u.full_name as author_name,
          'recent_comment' as reason,
          c.created_at
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.deleted_at IS NULL
        ORDER BY c.created_at DESC
        LIMIT 50
      `);

      // Get banned users
      const bannedUsers = await all<{
        id: string;
        type: string;
        content: string;
        author_id: string;
        author_name: string;
        reason: string;
        created_at: string;
      }>(`
        SELECT 
          u.id,
          'banned_user' as type,
          u.email as content,
          u.id as author_id,
          u.full_name as author_name,
          'banned' as reason,
          u.updated_at as created_at
        FROM users u
        WHERE u.is_banned = 1
        ORDER BY u.updated_at DESC
        LIMIT 20
      `);

      const queue = [
        ...(flaggedPosts || []),
        ...(recentComments || []),
        ...(bannedUsers || []),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      res.json({
        success: true,
        data: {
          queue,
          counts: {
            flaggedPosts: flaggedPosts?.length || 0,
            recentComments: recentComments?.length || 0,
            bannedUsers: bannedUsers?.length || 0,
            total: queue.length,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Moderation queue error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch moderation queue",
      } as ApiResponse);
    }
  },
);

// Analytics Endpoint
router.get(
  "/analytics",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;

      // Daily user registrations
      const userGrowth = await all<{ date: string; count: number }>(`
        SELECT 
          date(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `);

      // Daily posts
      const postActivity = await all<{ date: string; count: number }>(`
        SELECT 
          date(created_at) as date,
          COUNT(*) as count
        FROM posts
        WHERE deleted_at IS NULL
          AND created_at >= date('now', '-${days} days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `);

      // Daily logins
      const loginActivity = await all<{ date: string; count: number }>(`
        SELECT 
          date(login_at) as date,
          COUNT(*) as count
        FROM login_logs
        WHERE login_status = 'success'
          AND login_at >= date('now', '-${days} days')
        GROUP BY date(login_at)
        ORDER BY date ASC
      `);

      // Engagement stats (likes, comments, shares)
      const engagementStats = await all<{
        date: string;
        likes: number;
        comments: number;
      }>(`
        SELECT 
          date(l.created_at) as date,
          COUNT(DISTINCT l.id) as likes,
          0 as comments
        FROM likes l
        WHERE l.created_at >= date('now', '-${days} days')
        GROUP BY date(l.created_at)
        UNION ALL
        SELECT 
          date(c.created_at) as date,
          0 as likes,
          COUNT(DISTINCT c.id) as comments
        FROM comments c
        WHERE c.deleted_at IS NULL
          AND c.created_at >= date('now', '-${days} days')
        GROUP BY date(c.created_at)
        ORDER BY date ASC
      `);

      // Top active users
      const topUsers = await all<{
        id: string;
        full_name: string;
        post_count: number;
        comment_count: number;
        like_count: number;
      }>(`
        SELECT 
          u.id,
          u.full_name,
          (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.deleted_at IS NULL) as post_count,
          (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id AND c.deleted_at IS NULL) as comment_count,
          (SELECT COUNT(*) FROM likes l WHERE l.user_id = u.id) as like_count
        FROM users u
        ORDER BY (post_count + comment_count + like_count) DESC
        LIMIT 10
      `);

      // Department distribution
      const departmentStats = await all<{ department: string; count: number }>(`
        SELECT 
          COALESCE(department, 'Not Specified') as department,
          COUNT(*) as count
        FROM users
        WHERE department IS NOT NULL
        GROUP BY department
        ORDER BY count DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          userGrowth: userGrowth || [],
          postActivity: postActivity || [],
          loginActivity: loginActivity || [],
          engagementStats: engagementStats || [],
          topUsers: topUsers || [],
          departmentStats: departmentStats || [],
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
      } as ApiResponse);
    }
  },
);

router.get(
  "/flags",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = (req.query.status as string) || "all";
      const source = req.query.source as string | undefined;

      const { flags, total } = getAllFlags(
        page,
        limit,
        status as "active" | "expired" | "all",
        source,
      );

      res.json({
        success: true,
        data: {
          flags,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get flags error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch flags",
      } as ApiResponse);
    }
  },
);

router.get(
  "/flags/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const stats = getFlagStats();

      res.json({
        success: true,
        data: stats,
      } as ApiResponse);
    } catch (error) {
      console.error("Get flag stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch flag statistics",
      } as ApiResponse);
    }
  },
);

router.get(
  "/flags/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const flag = await get<{
        id: string;
        user_id: string;
        flag_type: string;
        reason: string;
        source: string;
        source_id: string | null;
        content_preview: string | null;
        detected_words: string;
        restriction_type: string;
        restriction_days: number;
        restricted_features: string;
        restricted_at: string;
        restriction_ends_at: string | null;
        is_active: number;
        created_at: string;
        admin_id: string | null;
        user_name: string | null;
        user_student_id: string | null;
        user_avatar_url: string | null;
        admin_name: string | null;
      }>(
        `SELECT uf.*, 
           u.full_name as user_name, u.student_id as user_student_id, u.avatar_url as user_avatar_url,
           a.full_name as admin_name
         FROM user_flags uf
         LEFT JOIN users u ON uf.user_id = u.id
         LEFT JOIN users a ON uf.admin_id = a.id
         WHERE uf.id = ?`,
        [id],
      );

      if (!flag) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: {
          ...flag,
          detected_words: JSON.parse(flag.detected_words || "[]"),
          restricted_features: JSON.parse(flag.restricted_features || "[]"),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get flag error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch flag",
      } as ApiResponse);
    }
  },
);

router.post(
  "/flags/:id/ban",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { days } = req.body;
      const admin = req.user!;

      if (!days || ![3, 7, 30, 90, 36500].includes(days)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid ban duration. Use 3, 7, 30, 90, or 36500 (lifetime) days.",
        } as ApiResponse);
      }

      const flag = await get<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM user_flags WHERE id = ?",
        [id],
      );

      if (!flag) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      extendUserBan(id, admin.id, days);

      logAdminAction(
        admin.id,
        "extend_ban",
        "user_flag",
        id,
        { additionalDays: days, userId: flag.user_id },
        req.ip || null,
      );

      res.json({
        success: true,
        message: `Ban extended by ${days === 36500 ? "lifetime" : `${days} days`}`,
      } as ApiResponse);
    } catch (error) {
      console.error("Extend ban error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to extend ban",
      } as ApiResponse);
    }
  },
);

router.post(
  "/flags/:id/unban",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const flag = await get<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM user_flags WHERE id = ?",
        [id],
      );

      if (!flag) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      unbanUser(id, admin.id);

      logAdminAction(
        admin.id,
        "unban",
        "user_flag",
        id,
        { userId: flag.user_id },
        req.ip || null,
      );

      res.json({
        success: true,
        message: "User unbanned successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Unban error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to unban user",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/flags/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const flag = await get<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM user_flags WHERE id = ?",
        [id],
      );

      if (!flag) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      deleteFlag(id);

      logAdminAction(
        admin.id,
        "delete",
        "user_flag",
        id,
        { userId: flag.user_id },
        req.ip || null,
      );

      res.json({
        success: true,
        message: "Flag deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete flag error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete flag",
      } as ApiResponse);
    }
  },
);

router.get(
  "/user/:id/restriction",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      if (user.id !== id && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        } as ApiResponse);
      }

      const flag = await get<{
        id: string;
        user_id: string;
        flag_type: string;
        reason: string;
        source: string;
        detected_words: string;
        restriction_days: number;
        restricted_features: string;
        restriction_ends_at: string | null;
        is_active: number;
        created_at: string;
      }>(
        `SELECT * FROM user_flags 
         WHERE user_id = ? AND is_active = 1 
         AND (restriction_ends_at IS NULL OR restriction_ends_at > datetime('now'))
         ORDER BY created_at DESC LIMIT 1`,
        [id],
      );

      if (!flag) {
        return res.json({
          success: true,
          data: {
            is_restricted: false,
            restricted_features: [],
          },
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: {
          is_restricted: true,
          restriction: {
            ...flag,
            detected_words: JSON.parse(flag.detected_words || "[]"),
            restricted_features: JSON.parse(flag.restricted_features || "[]"),
          },
          restricted_features: JSON.parse(flag.restricted_features || "[]"),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get user restriction error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user restriction",
      } as ApiResponse);
    }
  },
);

router.post(
  "/flags/:id/appeal/approve",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const flag = await get<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM user_flags WHERE id = ?",
        [id],
      );

      if (!flag) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      await run(
        `UPDATE user_flags 
         SET appeal_status = 'approved', 
             appeal_reviewed_at = datetime('now'), 
             appeal_reviewed_by = ?,
             is_active = 0
         WHERE id = ?`,
        [admin.id, id],
      );

      logAdminAction(
        admin.id,
        "appeal_approve",
        "user_flag",
        id,
        { userId: flag.user_id },
        req.ip || null,
      );

      res.json({
        success: true,
        message: "Appeal approved and restriction lifted",
      } as ApiResponse);
    } catch (error) {
      console.error("Approve appeal error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve appeal",
      } as ApiResponse);
    }
  },
);

router.post(
  "/flags/:id/appeal/reject",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const flag = await get<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM user_flags WHERE id = ?",
        [id],
      );

      if (!flag) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      await run(
        `UPDATE user_flags 
         SET appeal_status = 'rejected', 
             appeal_reviewed_at = datetime('now'), 
             appeal_reviewed_by = ?
         WHERE id = ?`,
        [admin.id, id],
      );

      logAdminAction(
        admin.id,
        "appeal_reject",
        "user_flag",
        id,
        { userId: flag.user_id },
        req.ip || null,
      );

      res.json({
        success: true,
        message: "Appeal rejected",
      } as ApiResponse);
    } catch (error) {
      console.error("Reject appeal error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject appeal",
      } as ApiResponse);
    }
  },
);

router.get(
  "/password-recovery",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = (req.query.status as string) || "all";
      const offset = (page - 1) * limit;

      let whereClause = "1=1";
      const params: unknown[] = [];

      if (status !== "all") {
        whereClause += " AND prr.status = ?";
        params.push(status);
      }

      const requests = await all<{
        id: string;
        user_id: string;
        email: string;
        student_id: string;
        recovery_email: string;
        status: string;
        new_password: string | null;
        resolved_at: string | null;
        resolved_by: string | null;
        created_at: string;
        user_name: string;
        user_full_name: string;
      }>(
        `SELECT prr.*, u.full_name as user_full_name, u.student_id as user_student_id
         FROM password_recovery_requests prr
         LEFT JOIN users u ON prr.user_id = u.id
         WHERE ${whereClause}
         ORDER BY prr.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

      const countResult = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM password_recovery_requests prr WHERE ${whereClause}`,
        params,
      );

      res.json({
        success: true,
        data: {
          requests: requests.map((r) => ({
            ...r,
            user_name: r.user_full_name,
          })),
          pagination: {
            page,
            limit,
            total: countResult?.count || 0,
            totalPages: Math.ceil((countResult?.count || 0) / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get password recovery requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get password recovery requests",
      } as ApiResponse);
    }
  },
);

router.post(
  "/password-recovery/:id/resolve",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { new_password } = req.body;
      const admin = req.user!;

      if (!new_password || new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        } as ApiResponse);
      }

      const request = await get<{
        id: string;
        user_id: string;
        status: string;
        recovery_email: string;
      }>("SELECT * FROM password_recovery_requests WHERE id = ?", [id]);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found",
        } as ApiResponse);
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Request already resolved",
        } as ApiResponse);
      }

      const passwordHash = await hashPassword(new_password);

      await run(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
        [passwordHash, request.user_id],
      );

      await run(
        `UPDATE password_recovery_requests 
         SET status = 'resolved', new_password = ?, resolved_at = datetime('now'), resolved_by = ?
         WHERE id = ?`,
        [new_password, admin.id, id],
      );

      res.json({
        success: true,
        message: "Password updated successfully",
        data: {
          recovery_email: request.recovery_email,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Resolve password recovery error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resolve password recovery",
      } as ApiResponse);
    }
  },
);

router.post(
  "/password-recovery/:id/reject",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const request = await get<{ id: string; status: string }>(
        "SELECT * FROM password_recovery_requests WHERE id = ?",
        [id],
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found",
        } as ApiResponse);
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Request already resolved",
        } as ApiResponse);
      }

      await run(
        `UPDATE password_recovery_requests 
         SET status = 'rejected', resolved_at = datetime('now'), resolved_by = ?
         WHERE id = ?`,
        [admin.id, id],
      );

      res.json({
        success: true,
        message: "Request rejected",
      } as ApiResponse);
    } catch (error) {
      console.error("Reject password recovery error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject request",
      } as ApiResponse);
    }
  },
);

router.delete(
  "/password-recovery/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await run("DELETE FROM password_recovery_requests WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Request deleted",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete password recovery error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete request",
      } as ApiResponse);
    }
  },
);

// ============ DELETED CONTENT MANAGEMENT ============

// Get all deleted content
router.get(
  "/deleted-content",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { type, page = "1", limit = "50", search } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const searchPattern = search ? `%${search}%` : null;

      let deletedItems: any[] = [];
      let totalCount = 0;

      if (type === "posts" || !type) {
        let posts: any[];
        let count: { count: number } | undefined;

        if (searchPattern) {
          posts = await all<any>(
            `SELECT p.*, u.full_name as author_name 
             FROM posts p 
             LEFT JOIN users u ON p.user_id = u.id 
             WHERE p.deleted_at IS NOT NULL 
             AND (p.content LIKE ? OR p.title LIKE ? OR u.full_name LIKE ? OR p.id LIKE ?)
             ORDER BY p.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [
              searchPattern,
              searchPattern,
              searchPattern,
              searchPattern,
              parseInt(limit as string),
              offset,
            ],
          );
          count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM posts p 
             LEFT JOIN users u ON p.user_id = u.id 
             WHERE p.deleted_at IS NOT NULL 
             AND (p.content LIKE ? OR p.title LIKE ? OR u.full_name LIKE ? OR p.id LIKE ?)`,
            [searchPattern, searchPattern, searchPattern, searchPattern],
          );
        } else {
          posts = await all<any>(
            `SELECT p.*, u.full_name as author_name 
             FROM posts p 
             LEFT JOIN users u ON p.user_id = u.id 
             WHERE p.deleted_at IS NOT NULL 
             ORDER BY p.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit as string), offset],
          );
          count = await get<{ count: number }>(
            "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NOT NULL",
          );
        }
        deletedItems = deletedItems.concat(
          posts.map((p) => ({ ...p, type: "post" })),
        );
        totalCount += count?.count || 0;
      }

      if (type === "comments" || !type) {
        let comments: any[];
        let count: { count: number } | undefined;

        if (searchPattern) {
          comments = await all<any>(
            `SELECT c.*, u.full_name as author_name 
             FROM comments c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.deleted_at IS NOT NULL 
             AND (c.content LIKE ? OR u.full_name LIKE ? OR c.id LIKE ?)
             ORDER BY c.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [
              searchPattern,
              searchPattern,
              searchPattern,
              parseInt(limit as string),
              offset,
            ],
          );
          count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM comments c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.deleted_at IS NOT NULL 
             AND (c.content LIKE ? OR u.full_name LIKE ? OR c.id LIKE ?)`,
            [searchPattern, searchPattern, searchPattern],
          );
        } else {
          comments = await all<any>(
            `SELECT c.*, u.full_name as author_name 
             FROM comments c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.deleted_at IS NOT NULL 
             ORDER BY c.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit as string), offset],
          );
          count = await get<{ count: number }>(
            "SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NOT NULL",
          );
        }
        deletedItems = deletedItems.concat(
          comments.map((c) => ({ ...c, type: "comment" })),
        );
        totalCount += count?.count || 0;
      }

      if (type === "market_posts" || !type) {
        let marketPosts: any[];
        let count: { count: number } | undefined;

        if (searchPattern) {
          marketPosts = await all<any>(
            `SELECT mp.*, u.full_name as author_name 
             FROM market_posts mp 
             LEFT JOIN users u ON mp.user_id = u.id 
             WHERE (mp.status = 'deleted' OR mp.status = 'removed')
             AND (mp.title LIKE ? OR mp.description LIKE ? OR u.full_name LIKE ? OR mp.id LIKE ?)
             ORDER BY mp.updated_at DESC 
             LIMIT ? OFFSET ?`,
            [
              searchPattern,
              searchPattern,
              searchPattern,
              searchPattern,
              parseInt(limit as string),
              offset,
            ],
          );
          count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM market_posts mp 
             LEFT JOIN users u ON mp.user_id = u.id 
             WHERE (mp.status = 'deleted' OR mp.status = 'removed')
             AND (mp.title LIKE ? OR mp.description LIKE ? OR u.full_name LIKE ? OR mp.id LIKE ?)`,
            [searchPattern, searchPattern, searchPattern, searchPattern],
          );
        } else {
          marketPosts = await all<any>(
            `SELECT mp.*, u.full_name as author_name 
             FROM market_posts mp 
             LEFT JOIN users u ON mp.user_id = u.id 
             WHERE mp.status = 'deleted' OR mp.status = 'removed'
             ORDER BY mp.updated_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit as string), offset],
          );
          count = await get<{ count: number }>(
            "SELECT COUNT(*) as count FROM market_posts WHERE status = 'deleted' OR status = 'removed'",
          );
        }
        deletedItems = deletedItems.concat(
          marketPosts.map((mp) => ({ ...mp, type: "market_post" })),
        );
        totalCount += count?.count || 0;
      }

      if (type === "discord_messages" || !type) {
        let discordMessages: any[];
        let count: { count: number } | undefined;

        if (searchPattern) {
          discordMessages = await all<any>(
            `SELECT dm.*, u.full_name as author_name 
             FROM discord_messages dm 
             LEFT JOIN users u ON dm.user_id = u.id 
             WHERE dm.deleted_at IS NOT NULL 
             AND (dm.content LIKE ? OR u.full_name LIKE ? OR dm.id LIKE ?)
             ORDER BY dm.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [
              searchPattern,
              searchPattern,
              searchPattern,
              parseInt(limit as string),
              offset,
            ],
          );
          count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM discord_messages dm 
             LEFT JOIN users u ON dm.user_id = u.id 
             WHERE dm.deleted_at IS NOT NULL 
             AND (dm.content LIKE ? OR u.full_name LIKE ? OR dm.id LIKE ?)`,
            [searchPattern, searchPattern, searchPattern],
          );
        } else {
          discordMessages = await all<any>(
            `SELECT dm.*, u.full_name as author_name 
             FROM discord_messages dm 
             LEFT JOIN users u ON dm.user_id = u.id 
             WHERE dm.deleted_at IS NOT NULL 
             ORDER BY dm.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit as string), offset],
          );
          count = await get<{ count: number }>(
            "SELECT COUNT(*) as count FROM discord_messages WHERE deleted_at IS NOT NULL",
          );
        }
        deletedItems = deletedItems.concat(
          discordMessages.map((dm) => ({ ...dm, type: "discord_message" })),
        );
        totalCount += count?.count || 0;
      }

      if (type === "language_exchange_messages" || !type) {
        let leMessages: any[];
        let count: { count: number } | undefined;

        if (searchPattern) {
          leMessages = await all<any>(
            `SELECT lem.*, u.full_name as author_name 
             FROM language_exchange_messages lem 
             LEFT JOIN users u ON lem.sender_id = u.id 
             WHERE lem.deleted_at IS NOT NULL 
             AND (lem.content LIKE ? OR u.full_name LIKE ? OR lem.id LIKE ?)
             ORDER BY lem.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [
              searchPattern,
              searchPattern,
              searchPattern,
              parseInt(limit as string),
              offset,
            ],
          );
          count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM language_exchange_messages lem 
             LEFT JOIN users u ON lem.sender_id = u.id 
             WHERE lem.deleted_at IS NOT NULL 
             AND (lem.content LIKE ? OR u.full_name LIKE ? OR lem.id LIKE ?)`,
            [searchPattern, searchPattern, searchPattern],
          );
        } else {
          leMessages = await all<any>(
            `SELECT lem.*, u.full_name as author_name 
             FROM language_exchange_messages lem 
             LEFT JOIN users u ON lem.sender_id = u.id 
             WHERE lem.deleted_at IS NOT NULL 
             ORDER BY lem.deleted_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit as string), offset],
          );
          count = await get<{ count: number }>(
            "SELECT COUNT(*) as count FROM language_exchange_messages WHERE deleted_at IS NOT NULL",
          );
        }
        deletedItems = deletedItems.concat(
          leMessages.map((lem) => ({
            ...lem,
            type: "language_exchange_message",
          })),
        );
        totalCount += count?.count || 0;
      }

      res.json({
        success: true,
        data: {
          items: deletedItems,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: totalCount,
            hasMore: offset + deletedItems.length < totalCount,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching deleted content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch deleted content",
      } as ApiResponse);
    }
  },
);

// Hard delete a post
router.delete(
  "/posts/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      // Delete all associated data first
      await run("DELETE FROM comments WHERE post_id = ?", [id]);
      await run(
        "DELETE FROM likes WHERE target_type = 'post' AND target_id = ?",
        [id],
      );
      await run("DELETE FROM shares WHERE post_id = ?", [id]);
      await run("DELETE FROM notifications WHERE data LIKE ?", [
        `%"post_id":"${id}"%`,
      ]);

      // Hard delete the post
      await run("DELETE FROM posts WHERE id = ?", [id]);

      // Log the action
      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'hard_delete_post', 'post', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Post permanently deleted",
      } as ApiResponse);
    } catch (error) {
      console.error("Error hard deleting post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to hard delete post",
      } as ApiResponse);
    }
  },
);

// Hard delete a comment
router.delete(
  "/comments/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      // Delete all replies recursively
      async function deleteRepliesRecursively(commentId: string) {
        const replies = await all<{ id: string }>(
          "SELECT id FROM comments WHERE parent_comment_id = ?",
          [commentId],
        );
        for (const reply of replies) {
          await deleteRepliesRecursively(reply.id);
          await run("DELETE FROM comments WHERE id = ?", [reply.id]);
        }
      }
      await deleteRepliesRecursively(id);

      // Delete likes on comment
      await run(
        "DELETE FROM likes WHERE target_type = 'comment' AND target_id = ?",
        [id],
      );

      // Hard delete the comment
      await run("DELETE FROM comments WHERE id = ?", [id]);

      // Log the action
      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'hard_delete_comment', 'comment', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Comment permanently deleted",
      } as ApiResponse);
    } catch (error) {
      console.error("Error hard deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to hard delete comment",
      } as ApiResponse);
    }
  },
);

// Hard delete a market post
router.delete(
  "/market-posts/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      // Delete all associated data
      await run("DELETE FROM market_comments WHERE post_id = ?", [id]);
      await run("DELETE FROM market_likes WHERE post_id = ?", [id]);
      await run("DELETE FROM market_buy_requests WHERE post_id = ?", [id]);

      // Hard delete the post
      await run("DELETE FROM market_posts WHERE id = ?", [id]);

      // Log the action
      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'hard_delete_market_post', 'market_post', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Market post permanently deleted",
      } as ApiResponse);
    } catch (error) {
      console.error("Error hard deleting market post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to hard delete market post",
      } as ApiResponse);
    }
  },
);

// Hard delete a discord message
router.delete(
  "/discord-messages/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      await run("DELETE FROM discord_message_views WHERE message_id = ?", [id]);
      await run("DELETE FROM discord_messages WHERE id = ?", [id]);

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'hard_delete_discord_message', 'discord_message', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Discord message permanently deleted",
      } as ApiResponse);
    } catch (error) {
      console.error("Error hard deleting discord message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to hard delete discord message",
      } as ApiResponse);
    }
  },
);

// Hard delete a language exchange message
router.delete(
  "/language-exchange-messages/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      await run("DELETE FROM language_exchange_messages WHERE id = ?", [id]);

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'hard_delete_le_message', 'language_exchange_message', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Language exchange message permanently deleted",
      } as ApiResponse);
    } catch (error) {
      console.error("Error hard deleting language exchange message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to hard delete language exchange message",
      } as ApiResponse);
    }
  },
);

// Bulk cleanup - hard delete all soft-deleted content older than X days
router.post(
  "/cleanup",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.body;
      const admin = req.user!;
      const cutoffDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000,
      ).toISOString();

      let deletedCount = 0;

      // Clean up posts
      const oldPosts = await all<{ id: string }>(
        "SELECT id FROM posts WHERE deleted_at IS NOT NULL AND deleted_at < ?",
        [cutoffDate],
      );
      for (const post of oldPosts) {
        await run("DELETE FROM comments WHERE post_id = ?", [post.id]);
        await run(
          "DELETE FROM likes WHERE target_type = 'post' AND target_id = ?",
          [post.id],
        );
        await run("DELETE FROM shares WHERE post_id = ?", [post.id]);
        await run("DELETE FROM posts WHERE id = ?", [post.id]);
        deletedCount++;
      }

      // Clean up comments
      const oldComments = await all<{ id: string }>(
        "SELECT id FROM comments WHERE deleted_at IS NOT NULL AND deleted_at < ?",
        [cutoffDate],
      );
      for (const comment of oldComments) {
        await run(
          "DELETE FROM likes WHERE target_type = 'comment' AND target_id = ?",
          [comment.id],
        );
        await run("DELETE FROM comments WHERE id = ?", [comment.id]);
        deletedCount++;
      }

      // Clean up discord messages
      const oldDiscordMessages = await all<{ id: string }>(
        "SELECT id FROM discord_messages WHERE deleted_at IS NOT NULL AND deleted_at < ?",
        [cutoffDate],
      );
      for (const msg of oldDiscordMessages) {
        await run("DELETE FROM discord_message_views WHERE message_id = ?", [
          msg.id,
        ]);
        await run("DELETE FROM discord_messages WHERE id = ?", [msg.id]);
        deletedCount++;
      }

      // Clean up language exchange messages
      const oldLEMessages = await all<{ id: string }>(
        "SELECT id FROM language_exchange_messages WHERE deleted_at IS NOT NULL AND deleted_at < ?",
        [cutoffDate],
      );
      for (const msg of oldLEMessages) {
        await run("DELETE FROM language_exchange_messages WHERE id = ?", [
          msg.id,
        ]);
        deletedCount++;
      }

      // Log the action
      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, created_at)
         VALUES (?, ?, 'bulk_cleanup', 'multiple', 'all', ?, datetime('now'))`,
        [uuidv4(), admin.id, JSON.stringify({ deletedCount, days })],
      );

      res.json({
        success: true,
        message: `Cleanup completed. ${deletedCount} items permanently deleted.`,
        data: { deletedCount },
      } as ApiResponse);
    } catch (error) {
      console.error("Error during cleanup:", error);
      res.status(500).json({
        success: false,
        message: "Failed to perform cleanup",
      } as ApiResponse);
    }
  },
);

// Get storage statistics
router.get(
  "/storage-stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const activePosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL",
      );
      const deletedPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NOT NULL",
      );
      const activeComments = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL",
      );
      const deletedComments = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NOT NULL",
      );
      const activeDiscordMessages = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_messages WHERE deleted_at IS NULL",
      );
      const deletedDiscordMessages = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_messages WHERE deleted_at IS NOT NULL",
      );
      const activeLEMessages = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_messages WHERE deleted_at IS NULL",
      );
      const deletedLEMessages = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM language_exchange_messages WHERE deleted_at IS NOT NULL",
      );
      const activeMarketPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_posts WHERE status = 'active'",
      );
      const deletedMarketPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_posts WHERE status = 'deleted' OR status = 'removed'",
      );

      res.json({
        success: true,
        data: {
          posts: {
            active: activePosts?.count || 0,
            deleted: deletedPosts?.count || 0,
          },
          comments: {
            active: activeComments?.count || 0,
            deleted: deletedComments?.count || 0,
          },
          discordMessages: {
            active: activeDiscordMessages?.count || 0,
            deleted: deletedDiscordMessages?.count || 0,
          },
          languageExchangeMessages: {
            active: activeLEMessages?.count || 0,
            deleted: deletedLEMessages?.count || 0,
          },
          marketPosts: {
            active: activeMarketPosts?.count || 0,
            deleted: deletedMarketPosts?.count || 0,
          },
          totalDeleted:
            (deletedPosts?.count || 0) +
            (deletedComments?.count || 0) +
            (deletedDiscordMessages?.count || 0) +
            (deletedLEMessages?.count || 0) +
            (deletedMarketPosts?.count || 0),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch storage statistics",
      } as ApiResponse);
    }
  },
);

// Restore a soft-deleted post
router.post(
  "/posts/:id/restore",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const existing = await get<{ id: string; deleted_at: string }>(
        "SELECT id, deleted_at FROM posts WHERE id = ?",
        [id],
      );

      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Post not found",
        } as ApiResponse);
        return;
      }

      if (!existing.deleted_at) {
        res.status(400).json({
          success: false,
          message: "Post is not deleted",
        } as ApiResponse);
        return;
      }

      await run(
        "UPDATE posts SET deleted_at = NULL, updated_at = ? WHERE id = ?",
        [new Date().toISOString(), id],
      );

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'restore_post', 'post', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Post restored successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error restoring post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore post",
      } as ApiResponse);
    }
  },
);

// Restore a soft-deleted comment
router.post(
  "/comments/:id/restore",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const existing = await get<{ id: string; deleted_at: string }>(
        "SELECT id, deleted_at FROM comments WHERE id = ?",
        [id],
      );

      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Comment not found",
        } as ApiResponse);
        return;
      }

      if (!existing.deleted_at) {
        res.status(400).json({
          success: false,
          message: "Comment is not deleted",
        } as ApiResponse);
        return;
      }

      await run(
        "UPDATE comments SET deleted_at = NULL, updated_at = ? WHERE id = ?",
        [new Date().toISOString(), id],
      );

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'restore_comment', 'comment', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Comment restored successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error restoring comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore comment",
      } as ApiResponse);
    }
  },
);

// Restore a soft-deleted market post
router.post(
  "/market-posts/:id/restore",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const existing = await get<{ id: string; status: string }>(
        "SELECT id, status FROM market_posts WHERE id = ?",
        [id],
      );

      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Market post not found",
        } as ApiResponse);
        return;
      }

      if (existing.status !== "deleted") {
        res.status(400).json({
          success: false,
          message: "Market post is not deleted",
        } as ApiResponse);
        return;
      }

      await run(
        "UPDATE market_posts SET status = 'available', updated_at = ? WHERE id = ?",
        [new Date().toISOString(), id],
      );

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'restore_market_post', 'market_post', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Market post restored successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error restoring market post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore market post",
      } as ApiResponse);
    }
  },
);

// Restore a soft-deleted discord message
router.post(
  "/discord-messages/:id/restore",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const existing = await get<{ id: string; deleted_at: string }>(
        "SELECT id, deleted_at FROM discord_messages WHERE id = ?",
        [id],
      );

      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Discord message not found",
        } as ApiResponse);
        return;
      }

      if (!existing.deleted_at) {
        res.status(400).json({
          success: false,
          message: "Discord message is not deleted",
        } as ApiResponse);
        return;
      }

      await run("UPDATE discord_messages SET deleted_at = NULL WHERE id = ?", [
        id,
      ]);

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'restore_discord_message', 'discord_message', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Discord message restored successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error restoring discord message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore discord message",
      } as ApiResponse);
    }
  },
);

// Restore a soft-deleted language exchange message
router.post(
  "/language-exchange-messages/:id/restore",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      const existing = await get<{ id: string; deleted_at: string }>(
        "SELECT id, deleted_at FROM language_exchange_messages WHERE id = ?",
        [id],
      );

      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Language exchange message not found",
        } as ApiResponse);
        return;
      }

      if (!existing.deleted_at) {
        res.status(400).json({
          success: false,
          message: "Language exchange message is not deleted",
        } as ApiResponse);
        return;
      }

      await run(
        "UPDATE language_exchange_messages SET deleted_at = NULL WHERE id = ?",
        [id],
      );

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'restore_language_exchange_message', 'language_exchange_message', ?, datetime('now'))`,
        [uuidv4(), admin.id, id],
      );

      res.json({
        success: true,
        message: "Language exchange message restored successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error restoring language exchange message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore language exchange message",
      } as ApiResponse);
    }
  },
);

// Admin create market post
router.post(
  "/market/posts",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const admin = req.user!;
      const {
        title,
        description,
        price,
        category,
        condition,
        phone_number,
        images,
      } = req.body;

      if (!title || !description || !price || !category) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: title, description, price, category",
        } as ApiResponse);
        return;
      }

      const postId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();

      await run(
        `INSERT INTO market_posts (
          id, user_id, title, description, price, category, condition, phone_number, images, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [
          postId,
          admin.id,
          title,
          description,
          price,
          category,
          condition || "good",
          phone_number || null,
          images ? JSON.stringify(images) : "[]",
          now,
          now,
        ],
      );

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, created_at)
         VALUES (?, ?, 'create_market_post', 'market_post', ?, datetime('now'))`,
        [uuidv4(), admin.id, postId],
      );

      const post = await get<any>("SELECT * FROM market_posts WHERE id = ?", [
        postId,
      ]);

      res.json({
        success: true,
        data: post,
        message: "Market post created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error creating market post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create market post",
      } as ApiResponse);
    }
  },
);

// Fix market posts status (temporary endpoint)
router.post(
  "/fix-market-status",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await run(
        "UPDATE market_posts SET status = 'active' WHERE status = 'available'",
      );

      res.json({
        success: true,
        message: `Updated ${result.changes} posts from 'available' to 'active'`,
        data: { updatedCount: result.changes },
      } as ApiResponse);
    } catch (error) {
      console.error("Fix market status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update market posts",
      } as ApiResponse);
    }
  },
);

// Clear admin audit logs
router.delete(
  "/admin-audit-logs/all",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const admin = req.user!;
      const result = await run("DELETE FROM admin_audit_logs");

      // Re-add this action
      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, created_at)
         VALUES (?, ?, 'clear_admin_audit_logs', 'system', 'all', ?, datetime('now'))`,
        [uuidv4(), admin.id, `Cleared ${result.changes} admin audit logs`],
      );

      res.json({
        success: true,
        message: `Deleted ${result.changes} admin audit logs`,
        data: { deletedCount: result.changes },
      } as ApiResponse);
    } catch (error) {
      console.error("Clear admin audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear admin audit logs",
      } as ApiResponse);
    }
  },
);

// Get activity logs stats
router.get(
  "/activity-logs/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const loginLogsCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM login_logs",
      );
      const adminAuditLogsCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM admin_audit_logs",
      );

      res.json({
        success: true,
        data: {
          loginLogs: loginLogsCount?.count || 0,
          adminAuditLogs: adminAuditLogsCount?.count || 0,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get activity logs stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get activity logs stats",
      } as ApiResponse);
    }
  },
);

export default router;
