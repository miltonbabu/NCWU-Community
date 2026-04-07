import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { run, get, all } from "../config/database";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { io } from "../index";

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const totalGroups = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_groups",
      );

      const totalMessages = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_messages WHERE deleted_at IS NULL",
      );

      const totalMembers = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_group_members",
      );

      const totalBanned = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_bans WHERE expires_at IS NULL OR expires_at > datetime('now')",
      );

      const activeUsersToday = await get<{ count: number }>(
        `SELECT COUNT(DISTINCT user_id) as count FROM discord_messages 
       WHERE date(created_at) = date('now') AND deleted_at IS NULL`,
      );

      res.json({
        success: true,
        data: {
          total_groups: totalGroups?.count || 0,
          total_messages: totalMessages?.count || 0,
          total_members: totalMembers?.count || 0,
          total_banned: totalBanned?.count || 0,
          active_users_today: activeUsersToday?.count || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching Discord stats:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch stats" });
    }
  },
);

router.get(
  "/groups",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, type, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = "1=1";
      const params: unknown[] = [];

      if (type) {
        whereClause += " AND type = ?";
        params.push(type);
      }

      if (search) {
        whereClause += " AND (name LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      const groups = await all<{
        id: string;
        name: string;
        type: string;
        department: string | null;
        year: number | null;
        description: string | null;
        icon_url: string | null;
        created_at: string;
        member_count: number;
        message_count: number;
      }>(
        `SELECT g.*, 
        (SELECT COUNT(*) FROM discord_group_members WHERE group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM discord_messages WHERE group_id = g.id AND deleted_at IS NULL) as message_count
       FROM discord_groups g
       WHERE ${whereClause}
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset],
      );

      const totalResult = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM discord_groups WHERE ${whereClause}`,
        params,
      );

      res.json({
        success: true,
        data: groups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalResult?.count || 0,
          totalPages: Math.ceil((totalResult?.count || 0) / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching Discord groups:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch groups" });
    }
  },
);

router.post(
  "/groups",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, type, department, year, description, icon_url } = req.body;
      const user = req.user;

      if (!name || !type) {
        return res
          .status(400)
          .json({ success: false, message: "Name and type are required" });
      }

      const id = uuidv4();
      await run(
        `INSERT INTO discord_groups (id, name, type, department, year, description, icon_url, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          type,
          department || null,
          year || null,
          description || null,
          icon_url || null,
          user?.id,
        ],
      );

      const group = await get<{
        id: string;
        name: string;
        type: string;
        department: string | null;
        year: number | null;
        description: string | null;
        icon_url: string | null;
        created_at: string;
      }>("SELECT * FROM discord_groups WHERE id = ?", [id]);

      res.json({ success: true, data: group });
    } catch (error) {
      console.error("Error creating Discord group:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create group" });
    }
  },
);

router.delete(
  "/groups/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await run(
        "DELETE FROM discord_message_views WHERE message_id IN (SELECT id FROM discord_messages WHERE group_id = ?)",
        [id],
      );
      await run("DELETE FROM discord_messages WHERE group_id = ?", [id]);
      await run("DELETE FROM discord_group_members WHERE group_id = ?", [id]);
      await run("DELETE FROM discord_groups WHERE id = ?", [id]);

      res.json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting Discord group:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete group" });
    }
  },
);

router.delete(
  "/groups/:id/messages",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await run(
        "DELETE FROM discord_message_views WHERE message_id IN (SELECT id FROM discord_messages WHERE group_id = ?)",
        [id],
      );
      await run(
        "UPDATE discord_messages SET deleted_at = datetime('now') WHERE group_id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "All messages in group deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting group messages:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete messages" });
    }
  },
);

router.get(
  "/messages",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, groupId, anonymous, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = "m.deleted_at IS NULL";
      const params: unknown[] = [];

      if (groupId) {
        whereClause += " AND m.group_id = ?";
        params.push(groupId);
      }

      if (anonymous !== undefined) {
        whereClause += " AND m.is_anonymous = ?";
        params.push(anonymous === "true" ? 1 : 0);
      }

      if (search) {
        whereClause += " AND m.content LIKE ?";
        params.push(`%${search}%`);
      }

      const messages = await all<{
        id: string;
        group_id: string;
        user_id: string;
        content: string;
        is_anonymous: number;
        reply_to: string | null;
        image_url: string | null;
        created_at: string;
        updated_at: string | null;
        group_name: string;
        author_full_name: string;
        author_student_id: string;
        author_avatar_url: string | null;
        author_department: string | null;
        author_is_admin: number;
        author_nickname: string | null;
        author_display_student_id: number;
        view_count: number;
      }>(
        `SELECT 
        m.*,
        g.name as group_name,
        COALESCE(gm.nickname, u.full_name) as author_full_name,
        u.student_id as author_student_id,
        u.avatar_url as author_avatar_url,
        u.department as author_department,
        u.is_admin as author_is_admin,
        gm.nickname as author_nickname,
        gm.display_student_id as author_display_student_id,
        (SELECT COUNT(*) FROM discord_message_views WHERE message_id = m.id) as view_count
       FROM discord_messages m
       JOIN discord_groups g ON m.group_id = g.id
       JOIN users u ON m.user_id = u.id
       LEFT JOIN discord_group_members gm ON m.user_id = gm.user_id AND gm.group_id = m.group_id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset],
      );

      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        group_id: msg.group_id,
        group_name: msg.group_name,
        user_id: msg.user_id,
        content: msg.content,
        is_anonymous: msg.is_anonymous === 1,
        reply_to: msg.reply_to,
        image_url: msg.image_url,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        author: {
          id: msg.user_id,
          full_name: msg.author_full_name,
          student_id: msg.author_student_id,
          avatar_url: msg.author_avatar_url,
          department: msg.author_department,
          is_admin: msg.author_is_admin === 1,
          nickname: msg.author_nickname,
          display_student_id: msg.author_display_student_id === 1,
        },
        view_count: msg.view_count,
      }));

      const totalResult = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM discord_messages m WHERE ${whereClause}`,
        params,
      );

      res.json({
        success: true,
        data: {
          messages: formattedMessages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching Discord messages:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch messages" });
    }
  },
);

router.delete(
  "/messages/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const deletedMessage = await get<{ group_id: string }>(
        "SELECT group_id FROM discord_messages WHERE id = ?",
        [id],
      );

      await run("DELETE FROM discord_message_views WHERE message_id = ?", [id]);
      await run(
        "UPDATE discord_messages SET deleted_at = datetime('now') WHERE id = ?",
        [id],
      );

      if (deletedMessage) {
        io.to(`group:${deletedMessage.group_id}`).emit("message_deleted", {
          messageId: id,
          groupId: deletedMessage.group_id,
        });
      }

      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete message" });
    }
  },
);

router.get(
  "/users",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, online, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = "1=1";
      const params: unknown[] = [];

      if (online !== undefined) {
        whereClause +=
          " AND p.status = 'online' AND p.last_seen > datetime('now', '-5 minutes')";
      }

      if (search) {
        whereClause +=
          " AND (u.full_name LIKE ? OR u.student_id LIKE ? OR u.email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const users = await all<{
        user_id: string;
        full_name: string;
        student_id: string;
        email: string;
        avatar_url: string | null;
        department: string | null;
        enrollment_year: number | null;
        current_year: number | null;
        status: string | null;
        last_seen: string | null;
        is_admin: number;
        group_count: number;
        message_count: number;
        is_banned: number;
      }>(
        `SELECT 
        u.id as user_id,
        u.full_name, u.student_id, u.email, u.avatar_url, u.department,
        u.enrollment_year, u.current_year, u.is_admin,
        p.status, p.last_seen,
        (SELECT COUNT(*) FROM discord_group_members WHERE user_id = u.id) as group_count,
        (SELECT COUNT(*) FROM discord_messages WHERE user_id = u.id AND deleted_at IS NULL) as message_count,
        (SELECT COUNT(*) FROM discord_bans WHERE user_id = u.id AND (expires_at IS NULL OR expires_at > datetime('now'))) as is_banned
       FROM users u
       LEFT JOIN discord_user_presence p ON u.id = p.user_id
       WHERE ${whereClause}
       ORDER BY u.full_name ASC
       LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset],
      );

      const formattedUsers = users.map((u) => ({
        ...u,
        is_online:
          u.status === "online" &&
          u.last_seen &&
          new Date(u.last_seen).getTime() > Date.now() - 5 * 60 * 1000,
        is_banned: u.is_banned > 0,
      }));

      const totalResult = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM users u WHERE ${whereClause}`,
        params,
      );

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching Discord users:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch users" });
    }
  },
);

router.post(
  "/bans",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { user_id, group_id, reason, expires_at } = req.body;
      const admin = req.user;

      if (!user_id || !reason) {
        return res
          .status(400)
          .json({ success: false, message: "User ID and reason are required" });
      }

      const id = uuidv4();
      await run(
        `INSERT INTO discord_bans (id, user_id, group_id, banned_by, reason, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user_id, group_id || null, admin?.id, reason, expires_at || null],
      );

      res.json({ success: true, message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ success: false, message: "Failed to ban user" });
    }
  },
);

router.delete(
  "/bans/:userId",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { group_id } = req.query;

      if (group_id) {
        await run(
          "DELETE FROM discord_bans WHERE user_id = ? AND group_id = ?",
          [userId, group_id],
        );
      } else {
        await run("DELETE FROM discord_bans WHERE user_id = ?", [userId]);
      }

      res.json({ success: true, message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ success: false, message: "Failed to unban user" });
    }
  },
);

router.get(
  "/bans",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const bans = await all<{
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
      }>(
        `SELECT 
        b.*,
        u.full_name as user_full_name,
        u.student_id as user_student_id,
        g.name as group_name,
        a.full_name as admin_full_name
       FROM discord_bans b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN discord_groups g ON b.group_id = g.id
       JOIN users a ON b.banned_by = a.id
       WHERE b.expires_at IS NULL OR b.expires_at > datetime('now')
       ORDER BY b.banned_at DESC`,
      );

      res.json({ success: true, data: bans });
    } catch (error) {
      console.error("Error fetching bans:", error);
      res.status(500).json({ success: false, message: "Failed to fetch bans" });
    }
  },
);

export default router;
