import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { run, get, all } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { io } from "../index";
import xss from "xss";
import {
  containsBadWords,
  detectBadWords,
  createUserFlag,
  isFeatureRestricted,
  scheduleContentDeletion,
} from "../utils/contentModeration";

const router = express.Router();

function sanitizeContent(content: string): string {
  return xss(content, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  });
}

export async function ensureDefaultGroups() {
  const existingGroups = await all<{ name: string }>(
    "SELECT name FROM discord_groups",
  );

  const existingNames = existingGroups.map((g) => g.name);
  const requiredGroups = [
    "All Students",
    "Economics 2025",
    "Economics 2023",
    "CST 2023",
    "Civil Engineering 2023",
    "Civil Engineering 2024",
    "Civil Engineering 2025",
    "Electrical Engineering 2023",
    "Electrical Engineering 2024",
    "Electrical Engineering 2025",
    "Mechanical Engineering 2023",
    "Mechanical Engineering 2024",
    "Mechanical Engineering 2025",
  ];

  const hasAllRequired = requiredGroups.every((name) =>
    existingNames.includes(name),
  );

  if (!hasAllRequired) {
    await run("DELETE FROM discord_group_members");
    await run("DELETE FROM discord_messages");
    await run("DELETE FROM discord_message_views");
    await run("DELETE FROM discord_groups");

    await run(
      `INSERT INTO discord_groups (id, name, type, description) VALUES (?, ?, ?, ?)`,
      [uuidv4(), "All Students", "all", "Community group for all students"],
    );

    const specificGroups = [
      { name: "Economics 2025", department: "Economics", year: 2025 },
      { name: "Economics 2023", department: "Economics", year: 2023 },
      {
        name: "CST 2023",
        department: "Computer Science & Technology",
        year: 2023,
      },
      {
        name: "Civil Engineering 2023",
        department: "Civil Engineering",
        year: 2023,
      },
      {
        name: "Civil Engineering 2024",
        department: "Civil Engineering",
        year: 2024,
      },
      {
        name: "Civil Engineering 2025",
        department: "Civil Engineering",
        year: 2025,
      },
      {
        name: "Electrical Engineering 2023",
        department: "Electrical Engineering",
        year: 2023,
      },
      {
        name: "Electrical Engineering 2024",
        department: "Electrical Engineering",
        year: 2024,
      },
      {
        name: "Electrical Engineering 2025",
        department: "Electrical Engineering",
        year: 2025,
      },
      {
        name: "Mechanical Engineering 2023",
        department: "Mechanical Engineering",
        year: 2023,
      },
      {
        name: "Mechanical Engineering 2024",
        department: "Mechanical Engineering",
        year: 2024,
      },
      {
        name: "Mechanical Engineering 2025",
        department: "Mechanical Engineering",
        year: 2025,
      },
    ];

    for (const group of specificGroups) {
      await run(
        `INSERT INTO discord_groups (id, name, type, department, year, description) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          group.name,
          "department",
          group.department,
          group.year,
          `${group.department} - ${group.year} enrollment`,
        ],
      );
    }
  }
}

router.get("/groups", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userData = await get<{
      department: string | null;
      enrollment_year: number | null;
      is_admin: number;
    }>("SELECT department, enrollment_year, is_admin FROM users WHERE id = ?", [
      user.id,
    ]);

    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isAdmin = userData.is_admin === 1;

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
      is_member: number;
    }>(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM discord_group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = g.id ${isAdmin ? "" : "AND (u.is_admin = 0 OR g.name = 'All Students' OR g.name = 'CST 2023')"}) as member_count,
        (SELECT COUNT(*) FROM discord_group_members WHERE group_id = g.id AND user_id = ?) as is_member
       FROM discord_groups g
       ORDER BY 
         CASE WHEN g.type = 'all' THEN 0 ELSE 1 END,
         g.name ASC`,
      [user.id],
    );

    // Get unread counts and online counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (g) => {
        const readStatus = await get<{ last_read_message_id: string | null }>(
          `SELECT last_read_message_id FROM discord_group_read_status 
           WHERE user_id = ? AND group_id = ?`,
          [user.id, g.id],
        );

        let unreadCount = 0;
        if (readStatus?.last_read_message_id) {
          const count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM discord_messages 
             WHERE group_id = ? AND id > ? AND deleted_at IS NULL`,
            [g.id, readStatus.last_read_message_id],
          );
          unreadCount = count?.count || 0;
        } else if (g.is_member) {
          // If no read status but is member, count all messages
          const count = await get<{ count: number }>(
            `SELECT COUNT(*) as count FROM discord_messages 
             WHERE group_id = ? AND deleted_at IS NULL`,
            [g.id],
          );
          unreadCount = count?.count || 0;
        }

        // Get online count for this group
        const onlineCount = await get<{ count: number }>(
          `SELECT COUNT(*) as count FROM discord_group_members gm
           JOIN discord_user_presence p ON gm.user_id = p.user_id
           JOIN users u ON gm.user_id = u.id
           WHERE gm.group_id = ? 
           AND p.status = 'online' 
           AND p.last_seen > datetime('now', '-5 minutes')
           ${isAdmin ? "" : "AND (u.is_admin = 0 OR ? IN ('All Students', 'CST 2023'))"}`,
          isAdmin ? [g.id] : [g.id, g.name],
        );

        return {
          ...g,
          unread_count: unreadCount,
          online_count: onlineCount?.count || 0,
        };
      }),
    );

    const DEPARTMENT_ALIASES: Record<string, string> = {
      CST: "Computer Science & Technology",
      Civil: "Civil Engineering",
      Electrical: "Electrical Engineering",
      Mechanical: "Mechanical Engineering",
    };

    const normalizeDept = (dept: string | null): string | null => {
      if (!dept) return null;
      return DEPARTMENT_ALIASES[dept] || dept;
    };

    const userDepartment = normalizeDept(userData.department);

    const accessibleGroups = groupsWithCounts.filter((g) => {
      if (isAdmin) {
        return true;
      }
      if (g.type === "all") {
        return true;
      }
      if (g.type === "department") {
        if (!userDepartment) {
          return true;
        }
        return g.department === userDepartment;
      }
      return false;
    });

    const result = accessibleGroups.map((g) => ({
      ...g,
      is_member: g.is_member > 0,
      can_send_message:
        isAdmin ||
        g.type === "all" ||
        !userDepartment ||
        g.department === userDepartment,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
});

router.get(
  "/groups/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const isCurrentUserAdmin = user.is_admin;

      const group = await get<{
        id: string;
        name: string;
        type: string;
        department: string | null;
        year: number | null;
        description: string | null;
        icon_url: string | null;
        created_at: string;
        member_count: number;
        is_member: number;
      }>(
        `SELECT g.*, 
        (SELECT COUNT(*) FROM discord_group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = g.id ${isCurrentUserAdmin ? "" : "AND (u.is_admin = 0 OR g.name = 'All Students' OR g.name = 'CST 2023')"}) as member_count,
        (SELECT COUNT(*) FROM discord_group_members WHERE group_id = g.id AND user_id = ?) as is_member
       FROM discord_groups g
       WHERE g.id = ?`,
        [user.id, id],
      );

      if (!group) {
        return res
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      res.json({
        success: true,
        data: {
          ...group,
          is_member: group.is_member > 0,
        },
      });
    } catch (error) {
      console.error("Error fetching group:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch group" });
    }
  },
);

router.post(
  "/groups/:id/join",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const group = await get<{ id: string }>(
        "SELECT id FROM discord_groups WHERE id = ?",
        [id],
      );

      if (!group) {
        return res
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      const existing = await get<{ id: string }>(
        "SELECT id FROM discord_group_members WHERE group_id = ? AND user_id = ?",
        [id, user.id],
      );

      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Already a member" });
      }

      const isFirstJoin = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_group_members",
      );

      await run(
        "INSERT INTO discord_group_members (id, group_id, user_id) VALUES (?, ?, ?)",
        [uuidv4(), id, user.id],
      );

      res.json({
        success: true,
        message: "Joined group successfully",
        showNicknamePrompt: isFirstJoin && isFirstJoin.count === 0,
      });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ success: false, message: "Failed to join group" });
    }
  },
);

router.post(
  "/groups/:id/leave",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await run(
        "DELETE FROM discord_group_members WHERE group_id = ? AND user_id = ?",
        [id, user.id],
      );

      res.json({ success: true, message: "Left group successfully" });
    } catch (error) {
      console.error("Error leaving group:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to leave group" });
    }
  },
);

router.post(
  "/groups/:id/read",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      // Get the latest message in the group
      const latestMessage = await get<{ id: string }>(
        "SELECT id FROM discord_messages WHERE group_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1",
        [id],
      );

      if (latestMessage) {
        // Upsert read status
        await run(
          `INSERT INTO discord_group_read_status (id, user_id, group_id, last_read_message_id, last_read_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(user_id, group_id) 
           DO UPDATE SET last_read_message_id = excluded.last_read_message_id, last_read_at = datetime('now')`,
          [uuidv4(), user.id, id, latestMessage.id],
        );
      }

      res.json({ success: true, message: "Marked as read" });
    } catch (error) {
      console.error("Error marking as read:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to mark as read" });
    }
  },
);

router.put(
  "/groups/:id/nickname",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { nickname, display_student_id } = req.body;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await run(
        "UPDATE discord_group_members SET nickname = ?, display_student_id = ? WHERE group_id = ? AND user_id = ?",
        [nickname || null, display_student_id ? 1 : 0, id, user.id],
      );

      res.json({ success: true, message: "Nickname updated successfully" });
    } catch (error) {
      console.error("Error updating nickname:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update nickname" });
    }
  },
);

router.get(
  "/groups/:id/members",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const isCurrentUserAdmin = user.is_admin;

      // Get group info to check if it's All Students or CST 23
      const group = await get<{ name: string }>(
        "SELECT name FROM discord_groups WHERE id = ?",
        [id],
      );

      const isVisibleGroup =
        group && (group.name === "All Students" || group.name === "CST 2023");

      const members = await all<{
        user_id: string;
        joined_at: string;
        full_name: string;
        student_id: string;
        avatar_url: string | null;
        department: string | null;
        current_year: number | null;
        status: string | null;
        last_seen: string | null;
        nickname: string | null;
        display_student_id: number;
        is_admin: number;
      }>(
        `SELECT 
        gm.user_id, gm.joined_at, gm.nickname, gm.display_student_id,
        u.full_name, u.student_id, u.avatar_url, u.department, u.current_year, u.is_admin,
        p.status, p.last_seen
       FROM discord_group_members gm
       JOIN users u ON gm.user_id = u.id
       LEFT JOIN discord_user_presence p ON gm.user_id = p.user_id
       WHERE gm.group_id = ?
       ORDER BY u.full_name ASC`,
        [id],
      );

      // Filter out admin users from results for non-admin users
      // Except for All Students and CST 2023 groups where admins are visible
      const filteredMembers = isCurrentUserAdmin
        ? members
        : members.filter((m) => m.is_admin !== 1 || isVisibleGroup);

      const formattedMembers = filteredMembers.map((m) => ({
        ...m,
        is_online:
          m.status === "online" &&
          m.last_seen &&
          new Date(m.last_seen).getTime() > Date.now() - 5 * 60 * 1000,
        display_name: m.nickname || m.full_name,
        // Only show admin badge if not in visible groups (All Students or CST 2023)
        show_as_admin: m.is_admin === 1 && !isVisibleGroup,
      }));

      res.json({ success: true, data: formattedMembers });
    } catch (error) {
      console.error("Error fetching group members:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch group members" });
    }
  },
);

router.get(
  "/groups/:id/messages",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, before } = req.query;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const offset = (Number(page) - 1) * Number(limit);
      let whereClause = "WHERE m.group_id = ? AND m.deleted_at IS NULL";
      const params: unknown[] = [id];

      if (before) {
        whereClause += " AND m.created_at < ?";
        params.push(before);
      }

      // Get group info to check if it's All Students or CST 2023
      const group = await get<{ name: string }>(
        "SELECT name FROM discord_groups WHERE id = ?",
        [id],
      );

      const isVisibleGroup =
        group && (group.name === "All Students" || group.name === "CST 2023");

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
        author_id: string | null;
        author_full_name: string | null;
        author_student_id: string | null;
        author_avatar_url: string | null;
        author_department: string | null;
        author_current_year: number | null;
        author_is_admin: number;
        author_nickname: string | null;
        author_display_student_id: number;
        view_count: number;
        has_viewed: number;
        reply_to_id: string | null;
        reply_to_content: string | null;
        reply_to_is_anonymous: number | null;
        reply_to_author_name: string | null;
      }>(
        `SELECT 
        m.*,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.id END as author_id,
        CASE WHEN m.is_anonymous = 1 THEN 'Anonymous' ELSE COALESCE(gm.nickname, u.full_name) END as author_full_name,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.student_id END as author_student_id,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.avatar_url END as author_avatar_url,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.department END as author_department,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.current_year END as author_current_year,
        CASE WHEN m.is_anonymous = 1 THEN 0 ELSE u.is_admin END as author_is_admin,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE gm.nickname END as author_nickname,
        CASE WHEN m.is_anonymous = 1 THEN 0 ELSE gm.display_student_id END as author_display_student_id,
        (SELECT COUNT(*) FROM discord_message_views WHERE message_id = m.id) as view_count,
        (SELECT COUNT(*) FROM discord_message_views WHERE message_id = m.id AND user_id = ?) as has_viewed,
        rm.id as reply_to_id,
        rm.content as reply_to_content,
        rm.is_anonymous as reply_to_is_anonymous,
        CASE WHEN rm.is_anonymous = 1 THEN 'Anonymous' ELSE COALESCE(rm_gm.nickname, ru.full_name) END as reply_to_author_name
       FROM discord_messages m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN discord_group_members gm ON m.user_id = gm.user_id AND gm.group_id = m.group_id
       LEFT JOIN discord_messages rm ON m.reply_to = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
       LEFT JOIN discord_group_members rm_gm ON rm.user_id = rm_gm.user_id AND rm_gm.group_id = rm.group_id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
        [user.id, ...params, Number(limit), offset],
      );

      const isCurrentUserAdmin = user.is_admin;

      // Filter out admin messages for non-admin users
      // Except for All Students and CST 2023 groups where admin messages are visible
      const filteredMessages = isCurrentUserAdmin
        ? messages
        : messages.filter((msg) => msg.author_is_admin !== 1 || isVisibleGroup);

      const formattedMessages = filteredMessages.reverse().map((msg) => {
        let displayName = msg.author_full_name;
        // Only show admin badge if not in visible groups (All Students or CST 2023)
        let showAsAdmin = msg.author_is_admin === 1 && !isVisibleGroup;

        if (msg.is_anonymous === 1) {
          displayName = "Anonymous";
          showAsAdmin = false;
        } else if (
          msg.author_display_student_id === 1 &&
          msg.author_student_id
        ) {
          displayName = msg.author_student_id;
        }

        return {
          id: msg.id,
          group_id: msg.group_id,
          user_id: msg.user_id,
          content: msg.content,
          is_anonymous: msg.is_anonymous === 1,
          reply_to: msg.reply_to,
          image_url: msg.image_url,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          author: msg.author_id
            ? {
                id: msg.author_id,
                full_name: msg.author_full_name,
                display_name: displayName,
                student_id: msg.author_student_id,
                avatar_url: msg.author_avatar_url,
                department: msg.author_department,
                current_year: msg.author_current_year,
                show_as_admin: showAsAdmin,
              }
            : null,
          view_count: msg.view_count,
          has_viewed: msg.has_viewed > 0,
          reply_to_message: msg.reply_to_id
            ? {
                id: msg.reply_to_id,
                content: msg.reply_to_content,
                is_anonymous: msg.reply_to_is_anonymous === 1,
                author: {
                  full_name: msg.reply_to_author_name,
                },
              }
            : null,
        };
      });

      res.json({
        success: true,
        data: formattedMessages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: messages.length === Number(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch messages" });
    }
  },
);

router.post(
  "/groups/:id/messages",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content, is_anonymous = false, reply_to, image_url } = req.body;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      if (!user.is_admin && await isFeatureRestricted(user.id, "discord")) {
        return res.status(403).json({
          success: false,
          message:
            "You are restricted from using Discord chat. Please contact admin.",
          code: "RESTRICTED",
        });
      }

      const banCheck = await get<{ id: string }>(
        "SELECT id FROM discord_bans WHERE user_id = ? AND (group_id = ? OR group_id IS NULL) AND (expires_at IS NULL OR expires_at > datetime('now'))",
        [user.id, id],
      );

      if (banCheck) {
        return res.status(403).json({
          success: false,
          message: "You are banned from sending messages in this group",
        });
      }

      const hasContent =
        content && typeof content === "string" && content.trim().length > 0;
      const hasImage = image_url && typeof image_url === "string";

      if (!hasContent && !hasImage) {
        return res.status(400).json({
          success: false,
          message: "Message content or image is required",
        });
      }

      if (content && content.length > 5000) {
        return res.status(400).json({
          success: false,
          message: "Message too long (max 5000 characters)",
        });
      }

      const group = await get<{
        id: string;
        type: string;
        department: string | null;
        year: number | null;
      }>("SELECT id, type, department, year FROM discord_groups WHERE id = ?", [
        id,
      ]);

      if (!group) {
        return res
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      const userData = await get<{
        department: string | null;
        enrollment_year: number | null;
        is_admin: number;
      }>(
        "SELECT department, enrollment_year, is_admin FROM users WHERE id = ?",
        [user.id],
      );

      if (!userData) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const isAdmin = userData.is_admin === 1;
      const canSendMessage =
        isAdmin ||
        group.type === "all" ||
        (group.type === "department" &&
          group.department === userData.department &&
          group.year === userData.enrollment_year);

      if (!canSendMessage) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to send messages to this group",
        });
      }

      if (reply_to) {
        const replyMessage = await get<{ id: string; group_id: string }>(
          "SELECT id, group_id FROM discord_messages WHERE id = ? AND deleted_at IS NULL",
          [reply_to],
        );
        if (!replyMessage || replyMessage.group_id !== id) {
          return res.status(400).json({
            success: false,
            message: "Reply message not found in this group",
          });
        }
      }

      const sanitizedContent = content ? sanitizeContent(content.trim()) : "";

      if (!isAdmin && content && containsBadWords(content)) {
        const detectedWords = detectBadWords(content);
        const messageId = uuidv4();

        await run(
          `INSERT INTO discord_messages (id, group_id, user_id, content, is_anonymous, reply_to, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            messageId,
            id,
            user.id,
            sanitizedContent,
            is_anonymous ? 1 : 0,
            reply_to || null,
            image_url || null,
          ],
        );

        createUserFlag(
          user.id,
          "discord",
          messageId,
          content,
          detectedWords,
          3,
        );

        scheduleContentDeletion("discord_message", messageId, 1);

        return res.status(201).json({
          success: true,
          message:
            "Message sent but flagged for inappropriate content. It will be removed in 1 minute.",
          data: {
            id: messageId,
            flagged: true,
            detected_words: detectedWords,
          },
        });
      }

      const messageId = uuidv4();

      await run(
        `INSERT INTO discord_messages (id, group_id, user_id, content, is_anonymous, reply_to, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          id,
          user.id,
          sanitizedContent,
          is_anonymous ? 1 : 0,
          reply_to || null,
          image_url || null,
        ],
      );

      const message = await get<{
        id: string;
        group_id: string;
        user_id: string;
        content: string;
        is_anonymous: number;
        reply_to: string | null;
        image_url: string | null;
        created_at: string;
        author_id: string | null;
        author_full_name: string | null;
        author_student_id: string | null;
        author_avatar_url: string | null;
        author_department: string | null;
        author_current_year: number | null;
        author_is_admin: number;
        author_nickname: string | null;
        author_display_student_id: number;
      }>(
        `SELECT 
        m.*,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.id END as author_id,
        CASE WHEN m.is_anonymous = 1 THEN 'Anonymous' ELSE COALESCE(gm.nickname, u.full_name) END as author_full_name,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.student_id END as author_student_id,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.avatar_url END as author_avatar_url,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.department END as author_department,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.current_year END as author_current_year,
        CASE WHEN m.is_anonymous = 1 THEN 0 ELSE u.is_admin END as author_is_admin,
        CASE WHEN m.is_anonymous = 1 THEN NULL ELSE gm.nickname END as author_nickname,
        CASE WHEN m.is_anonymous = 1 THEN 0 ELSE gm.display_student_id END as author_display_student_id
       FROM discord_messages m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN discord_group_members gm ON m.user_id = gm.user_id AND gm.group_id = m.group_id
       WHERE m.id = ?`,
        [messageId],
      );

      let displayName = message!.author_full_name;
      let showAsAdmin = message!.author_is_admin === 1;

      if (message!.is_anonymous === 1) {
        displayName = "Anonymous";
        showAsAdmin = false;
      } else if (
        message!.author_display_student_id === 1 &&
        message!.author_student_id
      ) {
        displayName = message!.author_student_id;
      }

      const formattedMessage = {
        id: message!.id,
        group_id: message!.group_id,
        user_id: message!.user_id,
        content: message!.content,
        is_anonymous: message!.is_anonymous === 1,
        reply_to: message!.reply_to,
        image_url: message!.image_url,
        created_at: message!.created_at,
        author: message!.author_id
          ? {
              id: message!.author_id,
              full_name: message!.author_full_name,
              display_name: displayName,
              student_id: message!.author_student_id,
              avatar_url: message!.author_avatar_url,
              department: message!.author_department,
              current_year: message!.author_current_year,
              show_as_admin: showAsAdmin,
            }
          : null,
        view_count: 0,
        has_viewed: false,
      };

      io.to(`group:${id}`).emit("new_message", formattedMessage);

      res.json({ success: true, data: formattedMessage });
    } catch (error) {
      console.error("Error creating message:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create message" });
    }
  },
);

router.delete(
  "/messages/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const message = await get<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM discord_messages WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      if (message.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this message",
        });
      }

      await run(
        "UPDATE discord_messages SET deleted_at = datetime('now') WHERE id = ?",
        [id],
      );

      const deletedMessage = await get<{ group_id: string }>(
        "SELECT group_id FROM discord_messages WHERE id = ?",
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

router.post(
  "/messages/:id/view",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const message = await get<{ id: string }>(
        "SELECT id FROM discord_messages WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      const existing = await get<{ id: string }>(
        "SELECT id FROM discord_message_views WHERE message_id = ? AND user_id = ?",
        [id, user.id],
      );

      if (!existing) {
        await run(
          "INSERT INTO discord_message_views (id, message_id, user_id) VALUES (?, ?, ?)",
          [uuidv4(), id, user.id],
        );
      }

      const viewCount = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM discord_message_views WHERE message_id = ?",
        [id],
      );

      res.json({ success: true, data: { view_count: viewCount?.count || 0 } });
    } catch (error) {
      console.error("Error marking message as viewed:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to mark message as viewed" });
    }
  },
);

router.post(
  "/presence",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status = "online" } = req.body;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const existing = await get<{ id: string }>(
        "SELECT id FROM discord_user_presence WHERE user_id = ?",
        [user.id],
      );

      if (existing) {
        await run(
          "UPDATE discord_user_presence SET status = ?, last_seen = datetime('now') WHERE user_id = ?",
          [status, user.id],
        );
      } else {
        await run(
          "INSERT INTO discord_user_presence (id, user_id, status) VALUES (?, ?, ?)",
          [uuidv4(), user.id, status],
        );
      }

      res.json({ success: true, message: "Presence updated" });
    } catch (error) {
      console.error("Error updating presence:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update presence" });
    }
  },
);

router.get(
  "/presence/online",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const onlineUsers = await all<{
        user_id: string;
        status: string;
        last_seen: string;
        full_name: string;
        student_id: string;
        avatar_url: string | null;
        department: string | null;
      }>(
        `SELECT p.user_id, p.status, p.last_seen, u.full_name, u.student_id, u.avatar_url, u.department
       FROM discord_user_presence p
       JOIN users u ON p.user_id = u.id
       WHERE p.status = 'online' 
         AND p.last_seen > datetime('now', '-5 minutes')
       ORDER BY u.full_name ASC`,
      );

      res.json({ success: true, data: onlineUsers });
    } catch (error) {
      console.error("Error fetching online users:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch online users" });
    }
  },
);

export default router;
