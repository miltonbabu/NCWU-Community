import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { run, get, all } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

router.get("/stats", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const totalChats = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_chats",
    );
    const activeChats = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_chats WHERE is_deleted = 0",
    );
    const deletedChats = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_chats WHERE is_deleted = 1",
    );

    const totalMessages = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_messages",
    );
    const totalTokens = await get<{ sum: number }>(
      "SELECT COALESCE(SUM(token_count), 0) as sum FROM xingyuan_messages",
    );

    const userChats = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_chats WHERE user_id IS NOT NULL",
    );
    const guestChats = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_chats WHERE user_id IS NULL",
    );

    const uniqueUsers = await get<{ count: number }>(
      "SELECT COUNT(DISTINCT user_id) as count FROM xingyuan_chats WHERE user_id IS NOT NULL",
    );
    const uniqueGuests = await get<{ count: number }>(
      "SELECT COUNT(DISTINCT ip_address) as count FROM xingyuan_chats WHERE user_id IS NULL AND ip_address IS NOT NULL",
    );

    const imagesWithContent = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM xingyuan_messages WHERE images != '[]' AND images IS NOT NULL",
    );

    const todayUsage = await get<{ msgs: number; tokens: number }>(
      `SELECT COALESCE(SUM(message_count), 0) as msgs, COALESCE(SUM(total_tokens), 0) as tokens
       FROM xingyuan_usage_stats WHERE date = date('now')`,
    );

    res.json({
      success: true,
      data: {
        totalChats: totalChats?.count || 0,
        activeChats: activeChats?.count || 0,
        deletedChats: deletedChats?.count || 0,
        totalMessages: totalMessages?.count || 0,
        totalTokens: totalTokens?.sum || 0,
        userChats: userChats?.count || 0,
        guestChats: guestChats?.count || 0,
        uniqueUsers: uniqueUsers?.count || 0,
        uniqueGuests: uniqueGuests?.count || 0,
        imagesWithContent: imagesWithContent?.count || 0,
        todayMessages: todayUsage?.msgs || 0,
        todayTokens: todayUsage?.tokens || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching Xingyuan stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

router.get(
  "/chats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const filter = (req.query.filter as string) || "all";
      const search = (req.query.search as string) || "";

      let whereClause = "";
      const params: unknown[] = [];

      if (filter === "active") {
        whereClause = "WHERE xc.is_deleted = 0";
      } else if (filter === "deleted") {
        whereClause = "WHERE xc.is_deleted = 1";
      } else if (filter === "users") {
        whereClause = "WHERE xc.user_id IS NOT NULL";
      } else if (filter === "guests") {
        whereClause = "WHERE xc.user_id IS NULL";
      } else {
        whereClause = "WHERE 1=1";
      }

      if (search) {
        whereClause += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ? OR xc.ip_address LIKE ? OR xc.title LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
      }

      const chats = await all<{
        id: string;
        user_id: string | null;
        session_id: string;
        title: string | null;
        model: string;
        is_deleted: number;
        deleted_at: string | null;
        created_at: string;
        updated_at: string;
        ip_address: string | null;
        user_agent: string | null;
        full_name: string | null;
        email: string | null;
        student_id: string | null;
        message_count: number;
      }>(`SELECT xc.*, u.full_name, u.email, u.student_id,
          (SELECT COUNT(*) FROM xingyuan_messages xm WHERE xm.chat_id = xc.id AND xm.is_deleted = 0) as message_count
         FROM xingyuan_chats xc
         LEFT JOIN users u ON xc.user_id = u.id
         ${whereClause}
         ORDER BY xc.created_at DESC
         LIMIT ? OFFSET ?`, [...params, limit, offset]);

      const totalCount = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM xingyuan_chats xc
         LEFT JOIN users u ON xc.user_id = u.id
         ${whereClause}`,
        params,
      );

      res.json({
        success: true,
        data: {
          chats: chats || [],
          pagination: {
            page,
            limit,
            total: totalCount?.count || 0,
            totalPages: Math.ceil((totalCount?.count || 0) / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching Xingyuan chats:", error);
      res.status(500).json({ success: false, error: "Failed to fetch chats" });
    }
  },
);

router.get(
  "/chats/:id/messages",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id;

      const messages = await all<{
        id: string;
        chat_id: string;
        user_id: string | null;
        role: string;
        content: string | null;
        images: string;
        thinking: string | null;
        is_deleted: number;
        token_count: number;
        created_at: string;
      }>(
        `SELECT * FROM xingyuan_messages
         WHERE chat_id = ?
         ORDER BY created_at ASC`,
        [chatId],
      );

      res.json({
        success: true,
        data: messages || [],
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch messages" });
    }
  },
);

router.get("/users", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await all<{
      user_id: string;
      full_name: string | null;
      email: string | null;
      student_id: string | null;
      total_chats: number;
      active_chats: number;
      total_messages: number;
      total_tokens: number;
      image_uploads: number;
      last_active: string | null;
    }>(`SELECT
        xc.user_id,
        u.full_name,
        u.email,
        u.student_id,
        COUNT(DISTINCT xc.id) as total_chats,
        SUM(CASE WHEN xc.is_deleted = 0 THEN 1 ELSE 0 END) as active_chats,
        COALESCE((SELECT COUNT(*) FROM xingyuan_messages xm WHERE xm.user_id = xc.user_id), 0) as total_messages,
        COALESCE((SELECT COALESCE(SUM(xm.token_count), 0) FROM xingyuan_messages xm WHERE xm.user_id = xc.user_id), 0) as total_tokens,
        COALESCE((SELECT COUNT(*) FROM xingyuan_messages xm WHERE xm.user_id = xc.user_id AND xm.images != '[]' AND xm.images IS NOT NULL), 0) as image_uploads,
        MAX(xc.updated_at) as last_active
      FROM xingyuan_chats xc
      LEFT JOIN users u ON xc.user_id = u.id
      WHERE xc.user_id IS NOT NULL
      GROUP BY xc.user_id, u.full_name, u.email, u.student_id
      ORDER BY last_active DESC`);

    res.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    console.error("Error fetching Xingyuan users:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

router.get("/guests", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const guests = await all<{
      ip_address: string;
      user_agent: string | null;
      session_count: number;
      total_messages: number;
      total_tokens: number;
      first_seen: string;
      last_seen: string;
    }>(`SELECT
        xc.ip_address,
        xc.user_agent,
        COUNT(DISTINCT xc.id) as session_count,
        COALESCE((SELECT COUNT(*) FROM xingyuan_messages xm
          INNER JOIN xingyuan_chats xc2 ON xm.chat_id = xc2.id
          WHERE xc2.ip_address = xc.ip_address AND xc2.user_id IS NULL), 0) as total_messages,
        COALESCE((SELECT COALESCE(SUM(xm.token_count), 0) FROM xingyuan_messages xm
          INNER JOIN xingyuan_chats xc2 ON xm.chat_id = xc2.id
          WHERE xc2.ip_address = xc.ip_address AND xc2.user_id IS NULL), 0) as total_tokens,
        MIN(xc.created_at) as first_seen,
        MAX(xc.updated_at) as last_seen
      FROM xingyuan_chats xc
      WHERE xc.user_id IS NULL AND xc.ip_address IS NOT NULL
      GROUP BY xc.ip_address, xc.user_agent
      ORDER BY last_seen DESC`);

    res.json({
      success: true,
      data: guests || [],
    });
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ success: false, error: "Failed to fetch guests" });
  }
});

router.delete(
  "/chats/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id;
      const adminId = (req as any).user?.id;

      await run("DELETE FROM xingyuan_messages WHERE chat_id = ?", [chatId]);
      await run("DELETE FROM xingyuan_chats WHERE id = ?", [chatId]);

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
         VALUES (?, ?, 'hard_delete', 'xingyuan_chat', ?, '{}', ?, datetime('now'))`,
        [
          uuidv4(),
          adminId,
          chatId,
          getClientIp(req),
        ],
      );

      res.json({ success: true, message: "Chat hard deleted successfully" });
    } catch (error) {
      console.error("Error hard deleting chat:", error);
      res.status(500).json({ success: false, error: "Failed to delete chat" });
    }
  },
);

router.delete(
  "/messages/:id/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      const adminId = (req as any).user?.id;

      await run("DELETE FROM xingyuan_messages WHERE id = ?", [messageId]);

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
         VALUES (?, ?, 'hard_delete', 'xingyuan_message', ?, '{}', ?, datetime('now'))`,
        [
          uuidv4(),
          adminId,
          messageId,
          getClientIp(req),
        ],
      );

      res.json({ success: true, message: "Message hard deleted successfully" });
    } catch (error) {
      console.error("Error hard deleting message:", error);
      res.status(500).json({ success: false, error: "Failed to delete message" });
    }
  },
);

router.delete(
  "/guest/:ip/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const ipAddress = decodeURIComponent(req.params.ip);
      const adminId = (req as any).user?.id;

      const guestChats = await all<{ id: string }>(
        "SELECT id FROM xingyuan_chats WHERE ip_address = ? AND user_id IS NULL",
        [ipAddress],
      );

      for (const chat of guestChats) {
        await run("DELETE FROM xingyuan_messages WHERE chat_id = ?", [chat.id]);
      }

      await run(
        "DELETE FROM xingyuan_chats WHERE ip_address = ? AND user_id IS NULL",
        [ipAddress],
      );

      await run(
        "DELETE FROM xingyuan_usage_stats WHERE ip_address = ? AND user_id IS NULL",
        [ipAddress],
      );

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
         VALUES (?, ?, 'hard_delete', 'xingyuan_guest', ?, ?, ?, datetime('now'))`,
        [
          uuidv4(),
          adminId,
          ipAddress,
          JSON.stringify({ ip: ipAddress }),
          getClientIp(req),
        ],
      );

      res.json({
        success: true,
        message: `All data for guest IP ${ipAddress} hard deleted`,
      });
    } catch (error) {
      console.error("Error hard deleting guest data:", error);
      res.status(500).json({ success: false, error: "Failed to delete guest data" });
    }
  },
);

router.get(
  "/users/:userId/chats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;

      const userChats = await all<{
        id: string;
        session_id: string;
        title: string | null;
        model: string;
        is_deleted: number;
        created_at: string;
        updated_at: string;
        message_count: number;
      }>(`SELECT xc.id, xc.session_id, xc.title, xc.model, xc.is_deleted, xc.created_at, xc.updated_at,
          (SELECT COUNT(*) FROM xingyuan_messages xm WHERE xm.chat_id = xc.id AND xm.is_deleted = 0) as message_count
         FROM xingyuan_chats xc
         WHERE xc.user_id = ?
         ORDER BY xc.updated_at DESC`, [userId]);

      res.json({
        success: true,
        data: userChats || [],
      });
    } catch (error) {
      console.error("Error fetching user chats:", error);
      res.status(500).json({ success: false, error: "Failed to fetch user chats" });
    }
  },
);

router.delete(
  "/users/:userId/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const adminId = (req as any).user?.id;

      const userChats = await all<{ id: string }>(
        "SELECT id FROM xingyuan_chats WHERE user_id = ?",
        [userId],
      );

      for (const chat of userChats) {
        await run("DELETE FROM xingyuan_messages WHERE chat_id = ?", [chat.id]);
      }

      await run("DELETE FROM xingyuan_chats WHERE user_id = ?", [userId]);
      await run("DELETE FROM xingyuan_usage_stats WHERE user_id = ?", [userId]);

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
         VALUES (?, ?, 'hard_delete', 'xingyuan_user_all', ?, ?, ?, datetime('now'))`,
        [
          uuidv4(),
          adminId,
          userId,
          JSON.stringify({ userId, chatsDeleted: userChats.length }),
          getClientIp(req),
        ],
      );

      res.json({
        success: true,
        message: `All data for user ${userId} deleted (${userChats.length} chats)`,
      });
    } catch (error) {
      console.error("Error hard deleting user data:", error);
      res.status(500).json({ success: false, error: "Failed to delete user data" });
    }
  },
);

router.delete(
  "/all/hard",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user?.id;

      const chatCount = (await get<{ count: number }>("SELECT COUNT(*) as count FROM xingyuan_chats"))?.count || 0;
      const messageCount = (await get<{ count: number }>("SELECT COUNT(*) as count FROM xingyuan_messages"))?.count || 0;

      await run("DELETE FROM xingyuan_messages");
      await run("DELETE FROM xingyuan_chats");
      await run("DELETE FROM xingyuan_usage_stats");

      await run(
        `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
         VALUES (?, ?, 'hard_delete', 'xingyuan_all_data', 'ALL', ?, ?, datetime('now'))`,
        [
          uuidv4(),
          adminId,
          JSON.stringify({ chatsDeleted: chatCount, messagesDeleted: messageCount }),
          getClientIp(req),
        ],
      );

      res.json({
        success: true,
        message: `All Xingyuan AI data deleted (${chatCount} chats, ${messageCount} messages)`,
        deleted: { chats: chatCount, messages: messageCount },
      });
    } catch (error) {
      console.error("Error hard deleting all data:", error);
      res.status(500).json({ success: false, error: "Failed to delete all data" });
    }
  },
);

export default router;
