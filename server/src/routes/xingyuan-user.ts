import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { run, get, all } from "../config/database.js";
import { verifyToken, extractTokenFromHeader } from "../utils/auth.js";

const router = Router();

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

async function getUserId(req: Request): string | null {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      console.log("[Xingyuan] No auth token found in request");
      return null;
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("[Xingyuan] Token verification failed");
      return null;
    }
    const user = await get<{ id: string }>("SELECT id FROM users WHERE id = ?", [
      decoded.userId,
    ]);
    if (user) {
      console.log("[Xingyuan] Authenticated user:", user.id);
      return user.id;
    }
    console.log("[Xingyuan] User not found in DB for id:", decoded.userId);
  } catch (err) {
    console.error("[Xingyuan] getUserId error:", err);
  }
  return null;
}

router.post("/chat/sync", async (req: Request, res: Response) => {
  try {
    const { chatId, title, messages, model } = req.body as {
      chatId: string;
      title?: string;
      messages?: Array<{
        id: string;
        role: string;
        content: string;
        images?: string[];
        thinking?: string;
        timestamp: Date | string;
      }>;
      model?: string;
    };

    console.log("[Xingyuan] /chat/sync received:", {
      chatId,
      userId: getUserId(req),
      messageCount: messages?.length,
    });

    if (!chatId) {
      return res
        .status(400)
        .json({ success: false, error: "chatId is required" });
    }

    const userId = getUserId(req);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;

    const existing = await get<{ id: string }>(
      "SELECT id FROM xingyuan_chats WHERE id = ?",
      [chatId],
    );

    if (!existing) {
      await run(
        `INSERT INTO xingyuan_chats (id, session_id, title, model, ip_address, user_agent, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          chatId,
          chatId,
          title || null,
          model || "glm-4v-plus",
          userId ? null : ipAddress,
          userAgent,
          userId,
        ],
      );
      console.log("[Xingyuan] Chat saved:", {
        chatId,
        userId,
        ipAddress: userId ? null : ipAddress,
        isGuest: !userId,
      });
    } else {
      await run(
        "UPDATE xingyuan_chats SET title = ?, updated_at = datetime('now') WHERE id = ?",
        [title || existing.id, chatId],
      );
    }

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const msgExists = await get<{ id: string }>(
          "SELECT id FROM xingyuan_messages WHERE id = ? AND chat_id = ?",
          [msg.id, chatId],
        );

        if (!msgExists) {
          const tokenCount = Math.ceil((msg.content?.length || 0) / 4);
          const hasImages = !!(msg.images && msg.images.length > 0);

          await run(
            `INSERT INTO xingyuan_messages (id, chat_id, user_id, role, content, images, thinking, token_count, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              msg.id,
              chatId,
              userId,
              msg.role,
              msg.content || null,
              JSON.stringify(msg.images || []),
              msg.thinking || null,
              tokenCount,
            ],
          );

          recordUsageStats(userId, ipAddress, tokenCount, hasImages, false);
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error syncing chat:", error);
    res.status(500).json({ success: false, error: "Failed to sync chat" });
  }
});

router.post("/message/add", async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, role, content, images, thinking } = req.body as {
      chatId: string;
      messageId: string;
      role: string;
      content: string;
      images?: string[];
      thinking?: string;
    };

    if (!chatId || !messageId || !role) {
      return res.status(400).json({
        success: false,
        error: "chatId, messageId, and role are required",
      });
    }

    const userId = getUserId(req);
    const ipAddress = getClientIp(req);

    const tokenCount = Math.ceil((content?.length || 0) / 4);
    const hasImages = !!(images && images.length > 0);

    await run(
      `INSERT OR IGNORE INTO xingyuan_messages (id, chat_id, user_id, role, content, images, thinking, token_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        messageId,
        chatId,
        userId,
        role,
        content || null,
        JSON.stringify(images || []),
        thinking || null,
        tokenCount,
      ],
    );

    await run("UPDATE xingyuan_chats SET updated_at = datetime('now') WHERE id = ?", [
      chatId,
    ]);

    recordUsageStats(userId, ipAddress, tokenCount, hasImages, false);

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ success: false, error: "Failed to add message" });
  }
});

router.post("/chat/soft-delete", async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body as { chatId: string };
    const userId = getUserId(req);

    if (!userId && !chatId) {
      return res.status(400).json({
        success: false,
        error: "Authentication required for soft delete",
      });
    }

    await run(
      "UPDATE xingyuan_chats SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ? AND user_id = ?",
      [chatId, userId],
    );

    await run(
      "UPDATE xingyuan_messages SET is_deleted = 1, deleted_at = datetime('now') WHERE chat_id = ? AND user_id = ?",
      [chatId, userId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error soft deleting chat:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to soft delete chat" });
  }
});

router.post("/message/soft-delete", async (req: Request, res: Response) => {
  try {
    const { chatId, messageId } = req.body as {
      chatId: string;
      messageId: string;
    };
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Authentication required for soft delete",
      });
    }

    await run(
      "UPDATE xingyuan_messages SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ? AND chat_id = ? AND user_id = ?",
      [messageId, chatId, userId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error soft deleting message:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to soft delete message" });
  }
});

async function recordUsageStats(
  userId: string | null,
  ipAddress: string,
  tokens: number,
  hasImage: boolean,
  hasDocument: boolean,
) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const existing = await get<{
      id: string;
      message_count: number;
      total_tokens: number;
      image_count: number;
      document_count: number;
    }>(
      "SELECT * FROM xingyuan_usage_stats WHERE user_id IS ? AND ip_address IS ? AND date = ?",
      [userId, ipAddress, today],
    );

    if (existing) {
      await run(
        `UPDATE xingyuan_usage_stats
         SET message_count = message_count + 1,
             total_tokens = total_tokens + ?,
             image_count = image_count + ?,
             document_count = document_count + ?
         WHERE id = ?`,
        [tokens, hasImage ? 1 : 0, hasDocument ? 1 : 0, existing.id],
      );
    } else {
      await run(
        `INSERT INTO xingyuan_usage_stats (id, user_id, ip_address, date, message_count, total_tokens, image_count, document_count, created_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))`,
        [
          uuidv4(),
          userId,
          ipAddress,
          today,
          tokens,
          hasImage ? 1 : 0,
          hasDocument ? 1 : 0,
        ],
      );
    }
  } catch (error) {
    console.error("Error recording usage stats:", error);
  }
}

export default router;
