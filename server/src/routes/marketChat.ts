import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import xss from "xss";
import { body, validationResult } from "express-validator";
import { run, get, all } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import type { ApiResponse } from "../types/index.js";

const router = express.Router();

interface ChatSession {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  last_message_at: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  is_read: number;
  read_at: string | null;
  created_at: string;
}

function sanitizeInput(input: string): string {
  return xss(input.trim());
}

// Create or get existing chat session
router.post(
  "/market/chat/session",
  authenticate,
  [body("postId").trim().notEmpty().withMessage("Post ID is required")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array()[0].msg,
        } as ApiResponse<never>);
      }

      const userId = (req as any).user?.id;
      const { postId } = req.body;

      // Get post details
      const post = await get<{ user_id: string; title: string; is_sold: number; status: string }>(
        "SELECT user_id, title, is_sold, status FROM market_posts WHERE id = ?",
        [postId]
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      if (post.is_sold || post.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: "This item is no longer available",
        } as ApiResponse<never>);
      }

      if (post.user_id === userId) {
        return res.status(400).json({
          success: false,
          error: "You cannot chat with yourself about your own post",
        } as ApiResponse<never>);
      }

      const sellerId = post.user_id;
      const buyerId = userId;

      // Check if session already exists
      let session = await get<ChatSession>(
        `SELECT * FROM market_chat_sessions 
         WHERE post_id = ? AND buyer_id = ? AND seller_id = ? AND is_deleted = 0`,
        [postId, buyerId, sellerId]
      );

      if (!session) {
        // Create new session
        const sessionId = uuidv4();
        const now = new Date().toISOString();

        await run(
          `INSERT INTO market_chat_sessions (id, post_id, buyer_id, seller_id, status, created_at) 
           VALUES (?, ?, ?, ?, 'active', ?)`,
          [sessionId, postId, buyerId, sellerId, now]
        );

        session = await get<ChatSession>(
          "SELECT * FROM market_chat_sessions WHERE id = ?",
          [sessionId]
        );
      }

      // Get participant info
      const buyer = await get<{ full_name: string; avatar_url: string }>(
        "SELECT full_name, avatar_url FROM users WHERE id = ?",
        [buyerId]
      );

      const seller = await get<{ full_name: string; avatar_url: string }>(
        "SELECT full_name, avatar_url FROM users WHERE id = ?",
        [sellerId]
      );

      res.json({
        success: true,
        message: "Chat session created",
        data: {
          session: {
            ...session,
            post_title: post.title,
          },
          participants: {
            buyer: {
              id: buyerId,
              name: buyer?.full_name || "Unknown",
              avatar: buyer?.avatar_url || null,
            },
            seller: {
              id: sellerId,
              name: seller?.full_name || "Unknown",
              avatar: seller?.avatar_url || null,
            },
          },
        },
      } as any);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create chat session",
      } as ApiResponse<never>);
    }
  }
);

// Get user's chat sessions
router.get("/market/chat/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const sessions = await all<
      ChatSession & {
        post_title: string;
        post_price: number;
        post_images: string;
        other_user_id: string;
        other_user_name: string;
        other_user_avatar: string;
        unread_count: number;
        last_message: string;
        last_message_time: string;
      }
    >(
      `
      SELECT 
        mcs.*,
        mp.title as post_title,
        mp.price as post_price,
        mp.images as post_images,
        CASE 
          WHEN mcs.buyer_id = ? THEN mcs.seller_id 
          ELSE mcs.buyer_id 
        END as other_user_id,
        u.full_name as other_user_name,
        u.avatar_url as other_user_avatar,
        (SELECT COUNT(*) FROM market_chat_messages 
         WHERE session_id = mcs.id AND sender_id != ? AND is_read = 0) as unread_count,
        (SELECT content FROM market_chat_messages 
         WHERE session_id = mcs.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM market_chat_messages 
         WHERE session_id = mcs.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM market_chat_sessions mcs
      JOIN market_posts mp ON mcs.post_id = mp.id
      JOIN users u ON u.id = CASE 
        WHEN mcs.buyer_id = ? THEN mcs.seller_id 
        ELSE mcs.buyer_id 
      END
      WHERE (mcs.buyer_id = ? OR mcs.seller_id = ?) AND mcs.is_deleted = 0
      ORDER BY mcs.last_message_at DESC NULLS LAST, mcs.created_at DESC
      `,
      [userId, userId, userId, userId, userId]
    );

    const formattedSessions = sessions.map((session) => ({
      ...session,
      post_images: JSON.parse(session.post_images || "[]"),
      unread_count: session.unread_count || 0,
    }));

    res.json({
      success: true,
      data: formattedSessions,
    } as ApiResponse<typeof formattedSessions>);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat sessions",
    } as ApiResponse<never>);
  }
});

// Get chat messages for a session
router.get("/market/chat/sessions/:sessionId/messages", authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Verify user is part of this session
    const session = await get<ChatSession>(
      "SELECT * FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      } as ApiResponse<never>);
    }

    if (session.buyer_id !== userId && session.seller_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      } as ApiResponse<never>);
    }

    const messages = await all<
      ChatMessage & {
        sender_name: string;
        sender_avatar: string;
      }
    >(
      `
      SELECT 
        mcm.*,
        u.full_name as sender_name,
        u.avatar_url as sender_avatar
      FROM market_chat_messages mcm
      JOIN users u ON mcm.sender_id = u.id
      WHERE mcm.session_id = ?
      ORDER BY mcm.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [sessionId, limit, offset]
    );

    // Mark messages as read
    await run(
      `UPDATE market_chat_messages SET is_read = 1, read_at = datetime('now') 
       WHERE session_id = ? AND sender_id != ? AND is_read = 0`,
      [sessionId, userId]
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
    } as ApiResponse<typeof messages>);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat messages",
    } as ApiResponse<never>);
  }
});

// Send message (REST API fallback)
router.post(
  "/market/chat/sessions/:sessionId/messages",
  authenticate,
  [body("content").trim().notEmpty().withMessage("Message content is required")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array()[0].msg,
        } as ApiResponse<never>);
      }

      const { sessionId } = req.params;
      const userId = (req as any).user?.id;
      const { content } = req.body;

      // Verify user is part of this session
      const session = await get<ChatSession>(
        "SELECT * FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
        [sessionId]
      );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Chat session not found",
        } as ApiResponse<never>);
      }

      if (session.buyer_id !== userId && session.seller_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        } as ApiResponse<never>);
      }

      const messageId = uuidv4();
      const now = new Date().toISOString();
      const sanitizedContent = sanitizeInput(content);

      await run(
        `INSERT INTO market_chat_messages (id, session_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)`,
        [messageId, sessionId, userId, sanitizedContent, now]
      );

      // Update session last_message_at
      await run(
        `UPDATE market_chat_sessions SET last_message_at = ? WHERE id = ?`,
        [now, sessionId]
      );

      // Get sender info
      const sender = await get<{ full_name: string; avatar_url: string }>(
        "SELECT full_name, avatar_url FROM users WHERE id = ?",
        [userId]
      );

      const message = {
        id: messageId,
        session_id: sessionId,
        sender_id: userId,
        sender_name: sender?.full_name || "Unknown",
        sender_avatar: sender?.avatar_url || null,
        content: sanitizedContent,
        is_read: 0,
        created_at: now,
      };

      res.status(201).json({
        success: true,
        message: "Message sent",
        data: message,
      } as ApiResponse<typeof message>);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send message",
      } as ApiResponse<never>);
    }
  }
);

// Get unread message count
router.get("/market/chat/unread-count", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const result = await get<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM market_chat_messages mcm
      JOIN market_chat_sessions mcs ON mcm.session_id = mcs.id
      WHERE mcs.is_deleted = 0 
        AND (mcs.buyer_id = ? OR mcs.seller_id = ?)
        AND mcm.sender_id != ?
        AND mcm.is_read = 0
      `,
      [userId, userId, userId]
    );

    res.json({
      success: true,
      data: { unreadCount: result?.count || 0 },
    } as ApiResponse<{ unreadCount: number }>);
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
    } as ApiResponse<never>);
  }
});

// Get chat sessions for a specific post (for sellers to see all conversations about their post)
router.get("/market/chat/post/:postId/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = (req as any).user?.id;

    // Verify user is the seller of this post
    const post = await get<{ user_id: string }>(
      "SELECT user_id FROM market_posts WHERE id = ?",
      [postId]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      } as ApiResponse<never>);
    }

    // Allow both seller and buyers to see sessions (buyers see their own, sellers see all for their post)
    const isSeller = post.user_id === userId;

    let whereClause = "WHERE mcs.post_id = ? AND mcs.is_deleted = 0";
    const params: any[] = [postId];

    if (!isSeller) {
      // If not seller, only show their own sessions
      whereClause += " AND (mcs.buyer_id = ? OR mcs.seller_id = ?)";
      params.push(userId, userId);
    }

    const sessions = await all<
      ChatSession & {
        buyer_name: string;
        buyer_avatar: string | null;
        last_message: string;
        last_message_time: string;
        unread_count: number;
      }
    >(
      `
      SELECT 
        mcs.*,
        u.full_name as buyer_name,
        u.avatar_url as buyer_avatar,
        (SELECT content FROM market_chat_messages 
         WHERE session_id = mcs.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM market_chat_messages 
         WHERE session_id = mcs.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM market_chat_messages 
         WHERE session_id = mcs.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM market_chat_sessions mcs
      JOIN users u ON mcs.buyer_id = u.id
      ${whereClause}
      ORDER BY mcs.last_message_at DESC NULLS LAST, mcs.created_at DESC
      `,
      [userId, ...params]
    );

    res.json({
      success: true,
      data: sessions,
    } as ApiResponse<typeof sessions>);
  } catch (error) {
    console.error("Error fetching post chat sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat sessions",
    } as ApiResponse<never>);
  }
});

// Soft delete chat session (for users - seller or buyer)
router.delete("/market/chat/sessions/:sessionId", authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.id;

    // Verify user is part of this session
    const session = await get<ChatSession>(
      "SELECT * FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      } as ApiResponse<never>);
    }

    if (session.buyer_id !== userId && session.seller_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      } as ApiResponse<never>);
    }

    const now = new Date().toISOString();

    // Soft delete
    await run(
      `UPDATE market_chat_sessions SET is_deleted = 1, deleted_at = ?, deleted_by = ?, status = 'deleted' WHERE id = ?`,
      [now, userId, sessionId]
    );

    // Add audit log
    await run(
      `INSERT INTO market_chat_audit_log (id, session_id, action, performed_by, details, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        sessionId,
        "soft_delete",
        userId,
        JSON.stringify({ reason: "User deleted chat session" }),
        now,
      ]
    );

    res.json({
      success: true,
      message: "Chat session deleted successfully",
    } as ApiResponse<never>);
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete chat session",
    } as ApiResponse<never>);
  }
});

// Admin Routes

// Get all chat sessions (admin)
router.get("/admin/market/chat/sessions", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { postId, status, isDeleted } = req.query;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (postId) {
      whereClause += " AND mcs.post_id = ?";
      params.push(postId);
    }

    if (status) {
      whereClause += " AND mcs.status = ?";
      params.push(status);
    }

    if (isDeleted !== undefined) {
      whereClause += " AND mcs.is_deleted = ?";
      params.push(isDeleted === "true" ? 1 : 0);
    }

    const sessions = await all<
      ChatSession & {
        post_title: string;
        post_price: number;
        buyer_name: string;
        buyer_avatar: string;
        seller_name: string;
        seller_avatar: string;
        message_count: number;
        deleted_by_name: string | null;
      }
    >(
      `
      SELECT 
        mcs.*,
        mp.title as post_title,
        mp.price as post_price,
        ub.full_name as buyer_name,
        ub.avatar_url as buyer_avatar,
        us.full_name as seller_name,
        us.avatar_url as seller_avatar,
        (SELECT COUNT(*) FROM market_chat_messages WHERE session_id = mcs.id) as message_count,
        db.full_name as deleted_by_name
      FROM market_chat_sessions mcs
      JOIN market_posts mp ON mcs.post_id = mp.id
      JOIN users ub ON mcs.buyer_id = ub.id
      JOIN users us ON mcs.seller_id = us.id
      LEFT JOIN users db ON mcs.deleted_by = db.id
      ${whereClause}
      ORDER BY mcs.created_at DESC
      `,
      params
    );

    res.json({
      success: true,
      data: sessions,
    } as ApiResponse<typeof sessions>);
  } catch (error) {
    console.error("Error fetching admin chat sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat sessions",
    } as ApiResponse<never>);
  }
});

// Get chat session details with messages (admin)
router.get("/admin/market/chat/sessions/:sessionId", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await get<
      ChatSession & {
        post_title: string;
        post_price: number;
        post_images: string;
        buyer_name: string;
        buyer_avatar: string;
        seller_name: string;
        seller_avatar: string;
        deleted_by_name: string | null;
      }
    >(
      `
      SELECT 
        mcs.*,
        mp.title as post_title,
        mp.price as post_price,
        mp.images as post_images,
        ub.full_name as buyer_name,
        ub.avatar_url as buyer_avatar,
        us.full_name as seller_name,
        us.avatar_url as seller_avatar,
        db.full_name as deleted_by_name
      FROM market_chat_sessions mcs
      JOIN market_posts mp ON mcs.post_id = mp.id
      JOIN users ub ON mcs.buyer_id = ub.id
      JOIN users us ON mcs.seller_id = us.id
      LEFT JOIN users db ON mcs.deleted_by = db.id
      WHERE mcs.id = ?
      `,
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      } as ApiResponse<never>);
    }

    const messages = await all<
      ChatMessage & {
        sender_name: string;
        sender_avatar: string;
      }
    >(
      `
      SELECT 
        mcm.*,
        u.full_name as sender_name,
        u.avatar_url as sender_avatar
      FROM market_chat_messages mcm
      JOIN users u ON mcm.sender_id = u.id
      WHERE mcm.session_id = ?
      ORDER BY mcm.created_at ASC
      `,
      [sessionId]
    );

    const auditLog = await all<{
      id: string;
      action: string;
      performed_by: string;
      performer_name: string;
      details: string;
      ip_address: string;
      created_at: string;
    }>(
      `
      SELECT 
        mcal.*,
        u.full_name as performer_name
      FROM market_chat_audit_log mcal
      JOIN users u ON mcal.performed_by = u.id
      WHERE mcal.session_id = ?
      ORDER BY mcal.created_at DESC
      `,
      [sessionId]
    );

    res.json({
      success: true,
      data: {
        session: {
          ...session,
          post_images: JSON.parse(session.post_images || "[]"),
        },
        messages,
        auditLog,
      },
    } as ApiResponse<{ session: typeof session; messages: typeof messages; auditLog: typeof auditLog }>);
  } catch (error) {
    console.error("Error fetching chat session details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat session details",
    } as ApiResponse<never>);
  }
});

// Soft delete chat session (admin)
router.delete("/admin/market/chat/sessions/:sessionId", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const adminId = (req as any).user?.id;
    const { reason } = req.body;

    const session = await get<ChatSession>(
      "SELECT * FROM market_chat_sessions WHERE id = ?",
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      } as ApiResponse<never>);
    }

    if (session.is_deleted) {
      return res.status(400).json({
        success: false,
        error: "Chat session is already deleted",
      } as ApiResponse<never>);
    }

    const now = new Date().toISOString();

    // Soft delete
    await run(
      `UPDATE market_chat_sessions SET is_deleted = 1, deleted_at = ?, deleted_by = ?, status = 'deleted' WHERE id = ?`,
      [now, adminId, sessionId]
    );

    // Add audit log
    await run(
      `INSERT INTO market_chat_audit_log (id, session_id, action, performed_by, details, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        sessionId,
        "soft_delete",
        adminId,
        JSON.stringify({ reason: reason || "Admin deletion" }),
        now,
      ]
    );

    res.json({
      success: true,
      message: "Chat session soft deleted successfully",
    } as ApiResponse<never>);
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete chat session",
    } as ApiResponse<never>);
  }
});

// Hard delete chat session (admin - permanent deletion)
router.delete("/admin/market/chat/sessions/:sessionId/permanent", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const adminId = (req as any).user?.id;
    const { reason } = req.body;

    const session = await get<ChatSession>(
      "SELECT * FROM market_chat_sessions WHERE id = ?",
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      } as ApiResponse<never>);
    }

    const now = new Date().toISOString();

    // Add audit log before deletion
    await run(
      `INSERT INTO market_chat_audit_log (id, session_id, action, performed_by, details, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        sessionId,
        "hard_delete",
        adminId,
        JSON.stringify({ 
          reason: reason || "Permanent deletion by admin",
          messageCount: await get<{ count: number }>("SELECT COUNT(*) as count FROM market_chat_messages WHERE session_id = ?", [sessionId])
        }),
        now,
      ]
    );

    // Delete messages first (foreign key constraint)
    await run("DELETE FROM market_chat_messages WHERE session_id = ?", [sessionId]);

    // Delete typing records
    await run("DELETE FROM market_chat_typing WHERE session_id = ?", [sessionId]);

    // Delete session
    await run("DELETE FROM market_chat_sessions WHERE id = ?", [sessionId]);

    res.json({
      success: true,
      message: "Chat session permanently deleted",
    } as ApiResponse<never>);
  } catch (error) {
    console.error("Error permanently deleting chat session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete chat session",
    } as ApiResponse<never>);
  }
});

// Restore soft-deleted chat session (admin)
router.post("/admin/market/chat/sessions/:sessionId/restore", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const adminId = (req as any).user?.id;

    const session = await get<ChatSession>(
      "SELECT * FROM market_chat_sessions WHERE id = ?",
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      } as ApiResponse<never>);
    }

    if (!session.is_deleted) {
      return res.status(400).json({
        success: false,
        error: "Chat session is not deleted",
      } as ApiResponse<never>);
    }

    const now = new Date().toISOString();

    // Restore
    await run(
      `UPDATE market_chat_sessions SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, status = 'active' WHERE id = ?`,
      [sessionId]
    );

    // Add audit log
    await run(
      `INSERT INTO market_chat_audit_log (id, session_id, action, performed_by, details, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        sessionId,
        "restore",
        adminId,
        JSON.stringify({ previousDeletedAt: session.deleted_at }),
        now,
      ]
    );

    res.json({
      success: true,
      message: "Chat session restored successfully",
    } as ApiResponse<never>);
  } catch (error) {
    console.error("Error restoring chat session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore chat session",
    } as ApiResponse<never>);
  }
});

// Get chat statistics (admin)
router.get("/admin/market/chat/stats", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalSessions = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_sessions"
    );

    const activeSessions = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_sessions WHERE status = 'active' AND is_deleted = 0"
    );

    const deletedSessions = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_sessions WHERE is_deleted = 1"
    );

    const totalMessages = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_messages"
    );

    const unreadMessages = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_messages WHERE is_read = 0"
    );

    const sessionsToday = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_sessions WHERE date(created_at) = date('now')"
    );

    const messagesToday = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM market_chat_messages WHERE date(created_at) = date('now')"
    );

    // Inactive sessions (no messages for 7+ days)
    const inactiveSessions = await get<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM market_chat_sessions 
      WHERE is_deleted = 0 
        AND (last_message_at IS NULL OR datetime(last_message_at) < datetime('now', '-7 days'))
      `
    );

    res.json({
      success: true,
      data: {
        totalSessions: totalSessions?.count || 0,
        activeSessions: activeSessions?.count || 0,
        deletedSessions: deletedSessions?.count || 0,
        totalMessages: totalMessages?.count || 0,
        unreadMessages: unreadMessages?.count || 0,
        sessionsToday: sessionsToday?.count || 0,
        messagesToday: messagesToday?.count || 0,
        inactiveSessions: inactiveSessions?.count || 0,
      },
    } as ApiResponse<{
      totalSessions: number;
      activeSessions: number;
      deletedSessions: number;
      totalMessages: number;
      unreadMessages: number;
      sessionsToday: number;
      messagesToday: number;
      inactiveSessions: number;
    }>);
  } catch (error) {
    console.error("Error fetching chat statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat statistics",
    } as ApiResponse<never>);
  }
});

// Trigger auto-cleanup of inactive sessions (admin)
router.post("/admin/market/chat/cleanup", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { daysInactive = 7 } = req.body;

    // Find inactive sessions
    const inactiveSessions = await all<{ id: string; last_message_at: string | null }>(
      `
      SELECT id, last_message_at 
      FROM market_chat_sessions 
      WHERE is_deleted = 0 
        AND (last_message_at IS NULL OR datetime(last_message_at) < datetime('now', '-${daysInactive} days'))
      `
    );

    const now = new Date().toISOString();
    let cleanedCount = 0;

    for (const session of inactiveSessions) {
      // Soft delete
      await run(
        `UPDATE market_chat_sessions SET is_deleted = 1, deleted_at = ?, deleted_by = ?, status = 'auto_deleted' WHERE id = ?`,
        [now, adminId, session.id]
      );

      // Add audit log
      await run(
        `INSERT INTO market_chat_audit_log (id, session_id, action, performed_by, details, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          session.id,
          "auto_cleanup",
          adminId,
          JSON.stringify({ 
            reason: `Auto-cleanup: No activity for ${daysInactive} days`,
            lastMessageAt: session.last_message_at 
          }),
          now,
        ]
      );

      cleanedCount++;
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} inactive sessions`,
      data: { cleanedCount },
    } as ApiResponse<{ cleanedCount: number }>);
  } catch (error) {
    console.error("Error cleaning up chat sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup chat sessions",
    } as ApiResponse<never>);
  }
});

export default router;
