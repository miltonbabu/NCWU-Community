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

router.post(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const {
        native_language,
        target_language,
        proficiency_level = 1,
        bio = "",
        interests = [],
        availability = [],
      } = req.body;

      console.log("Language exchange profile request:", {
        userId: user.id,
        native_language,
        target_language,
        proficiency_level,
        bio,
        interests,
        availability,
      });

      if (!native_language || !target_language) {
        return res.status(400).json({
          success: false,
          message: "Native language and target language are required",
        });
      }

      const existing = await get<{ id: string }>(
        "SELECT id FROM language_exchange_profiles WHERE user_id = ?",
        [user.id],
      );

      console.log("Existing profile:", existing);

      if (existing) {
        const result = await run(
          `UPDATE language_exchange_profiles 
           SET native_language = ?, target_language = ?, proficiency_level = ?, 
               bio = ?, interests = ?, availability = ?, is_active = 1, updated_at = datetime('now')
           WHERE user_id = ?`,
          [
            native_language,
            target_language,
            proficiency_level,
            bio,
            JSON.stringify(interests),
            JSON.stringify(availability),
            user.id,
          ],
        );
        console.log("Update result:", result);
      } else {
        const result = await run(
          `INSERT INTO language_exchange_profiles 
           (id, user_id, native_language, target_language, proficiency_level, bio, interests, availability)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            user.id,
            native_language,
            target_language,
            proficiency_level,
            bio,
            JSON.stringify(interests),
            JSON.stringify(availability),
          ],
        );
        console.log("Insert result:", result);
      }

      // Verify the profile was saved
      const savedProfile = await get<{ id: string; is_active: number }>(
        "SELECT id, is_active FROM language_exchange_profiles WHERE user_id = ?",
        [user.id],
      );
      console.log("Saved profile verification:", savedProfile);

      res.json({
        success: true,
        message: "Language exchange profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating language exchange profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update language exchange profile",
      });
    }
  },
);

router.get(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const profile = await get<{
        id: string;
        user_id: string;
        native_language: string;
        target_language: string;
        proficiency_level: number;
        bio: string | null;
        interests: string;
        availability: string;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>("SELECT * FROM language_exchange_profiles WHERE user_id = ?", [
        user.id,
      ]);

      if (!profile) {
        return res.json({ success: true, data: null });
      }

      res.json({
        success: true,
        data: {
          ...profile,
          interests: JSON.parse(profile.interests || "[]"),
          availability: JSON.parse(profile.availability || "[]"),
        },
      });
    } catch (error) {
      console.error("Error fetching language exchange profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch language exchange profile",
      });
    }
  },
);

router.delete(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await run(
        "UPDATE language_exchange_profiles SET is_active = 0 WHERE user_id = ?",
        [user.id],
      );

      res.json({
        success: true,
        message: "Removed from language exchange successfully",
      });
    } catch (error) {
      console.error("Error removing from language exchange:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove from language exchange",
      });
    }
  },
);

router.get("/users", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("Fetching language exchange users for userId:", user.id);

    const users = await all<{
      profile_id: string;
      user_id: string;
      native_language: string;
      target_language: string;
      proficiency_level: number;
      bio: string | null;
      interests: string;
      availability: string;
      full_name: string;
      student_id: string;
      avatar_url: string | null;
      department: string | null;
      current_year: number | null;
      country: string | null;
      connection_status: string | null;
      connection_id: string | null;
      chat_id: string | null;
    }>(
      `SELECT
          lep.id as profile_id,
          lep.user_id,
          lep.native_language,
          lep.target_language,
          lep.proficiency_level,
          lep.bio,
          lep.interests,
          lep.availability,
          u.full_name,
          u.student_id,
          u.avatar_url,
          u.department,
          u.current_year,
          u.country,
          CASE
            WHEN lec.status = 'accepted' AND lec.requester_id = ? THEN 'connected'
            WHEN lec.status = 'accepted' AND lec.receiver_id = ? THEN 'connected'
            WHEN lec.status = 'pending' AND lec.requester_id = ? THEN 'sent'
            WHEN lec.status = 'pending' AND lec.receiver_id = ? THEN 'received'
            ELSE NULL
          END as connection_status,
          lec.id as connection_id,
          lec_chat.id as chat_id
        FROM users u
        LEFT JOIN language_exchange_profiles lep ON lep.user_id = u.id
        LEFT JOIN language_exchange_connections lec ON
          ((lec.requester_id = ? AND lec.receiver_id = u.id) OR
           (lec.receiver_id = ? AND lec.requester_id = u.id))
          AND lec.status IN ('pending', 'accepted')
        LEFT JOIN language_exchange_chats lec_chat ON lec_chat.connection_id = lec.id
        WHERE u.id != ?
          AND (lep.is_active = 1 OR lec.status = 'accepted')
        GROUP BY lep.id, lep.user_id, lep.native_language, lep.target_language,
                 lep.proficiency_level, lep.bio, lep.interests, lep.availability,
                 u.full_name, u.student_id, u.avatar_url, u.department, u.current_year, u.country,
                 lec.id, lec_chat.id
        ORDER BY
          CASE WHEN lec.status = 'accepted' THEN 0 ELSE 1 END,
          COALESCE(lep.updated_at, lec.created_at) DESC`,
      [user.id, user.id, user.id, user.id, user.id, user.id, user.id],
    );

    const formattedUsers = users.map((u) => ({
      profile_id: u.profile_id,
      user_id: u.user_id,
      native_language: u.native_language,
      target_language: u.target_language,
      proficiency_level: u.proficiency_level,
      bio: u.bio,
      interests: JSON.parse(u.interests || "[]"),
      availability: JSON.parse(u.availability || "[]"),
      full_name: u.full_name,
      student_id: u.student_id,
      avatar_url: u.avatar_url,
      department: u.department,
      current_year: u.current_year,
      country: u.country,
      connection_status: u.connection_status,
      connection_id: u.connection_id,
      chat_id: u.chat_id,
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("Error fetching language exchange users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch language exchange users",
    });
  }
});

router.post(
  "/connect/:userId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      if (userId === user.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot connect with yourself",
        });
      }

      const targetUser = await get<{ id: string }>(
        "SELECT id FROM users WHERE id = ?",
        [userId],
      );

      if (!targetUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.log("Connect request:", { userId, targetUserId: userId, user });

      // Check if table exists first
      try {
        const tableCheck = await get<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='language_exchange_connections'",
          [],
        );
        console.log("Table check:", tableCheck);

        if (!tableCheck) {
          return res.status(500).json({
            success: false,
            message:
              "Database table does not exist. Please restart the server.",
          });
        }
      } catch (tableError) {
        console.error("Table check error:", tableError);
      }

      const existingConnection = await get<{
        id: string;
        status: string;
        requester_id: string;
        receiver_id: string;
      }>(
        `SELECT id, status, requester_id, receiver_id FROM language_exchange_connections
         WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
        [user.id, userId, userId, user.id],
      );

      console.log("Existing connection:", existingConnection);

      if (existingConnection) {
        if (existingConnection.status === "accepted") {
          return res.status(400).json({
            success: false,
            message: "Already connected with this user",
          });
        }
        if (existingConnection.status === "pending") {
          return res.status(400).json({
            success: false,
            message: "Connection request already pending",
          });
        }
        // If status is 'rejected' or 'disconnected', delete the old connection and allow new request
        if (
          existingConnection.status === "rejected" ||
          existingConnection.status === "disconnected"
        ) {
          console.log("Deleting old connection:", existingConnection.id);
          await run("DELETE FROM language_exchange_connections WHERE id = ?", [
            existingConnection.id,
          ]);
        }
      }

      const connectionId = uuidv4();
      console.log("Creating connection:", {
        connectionId,
        requester: user.id,
        receiver: userId,
      });

      try {
        const result = await run(
          `INSERT INTO language_exchange_connections (id, requester_id, receiver_id, status)
         VALUES (?, ?, ?, 'pending')`,
          [connectionId, user.id, userId],
        );
        console.log("Connection created successfully, result:", result);
      } catch (insertError: any) {
        console.error(
          "Error inserting connection:",
          insertError.message || insertError,
        );
        console.error("Error code:", insertError.code);
        console.error("Error details:", JSON.stringify(insertError));

        // Handle UNIQUE constraint violation - connection already exists
        if (
          insertError.message &&
          insertError.message.includes("UNIQUE constraint failed")
        ) {
          return res.status(400).json({
            success: false,
            message:
              "A connection already exists with this user. Please refresh the page.",
          });
        }

        return res.status(500).json({
          success: false,
          message:
            "Failed to create connection: " +
            (insertError.message || "Database error"),
        });
      }

      console.log("Connection created, inserting notification");

      await run(
        `INSERT INTO notifications (id, user_id, type, title, message, actor_id, data)
         VALUES (?, ?, 'exchange_request', ?, ?, ?, ?)`,
        [
          uuidv4(),
          userId,
          "Language Exchange Request",
          `${user.full_name} wants to connect for language exchange`,
          user.id,
          JSON.stringify({ connection_id: connectionId }),
        ],
      );

      io.to(`user:${userId}`).emit("exchange_request", {
        connectionId,
        requester: {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
      });

      res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } catch (error) {
      console.error("Error sending connection request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send connection request",
      });
    }
  },
);

router.get(
  "/requests",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const requests = await all<{
        id: string;
        requester_id: string;
        receiver_id: string;
        status: string;
        created_at: string;
        requester_full_name: string;
        requester_avatar_url: string | null;
        requester_department: string | null;
        requester_native_language: string;
        requester_target_language: string;
      }>(
        `SELECT 
          lec.id,
          lec.requester_id,
          lec.receiver_id,
          lec.status,
          lec.created_at,
          u.full_name as requester_full_name,
          u.avatar_url as requester_avatar_url,
          u.department as requester_department,
          lep.native_language as requester_native_language,
          lep.target_language as requester_target_language
        FROM language_exchange_connections lec
        JOIN users u ON lec.requester_id = u.id
        LEFT JOIN language_exchange_profiles lep ON lec.requester_id = lep.user_id
        WHERE lec.receiver_id = ? AND lec.status = 'pending'
        ORDER BY lec.created_at DESC`,
        [user.id],
      );

      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch connection requests",
      });
    }
  },
);

router.post(
  "/requests/:id/accept",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
      console.log("Accept request received:", { id, userId: user?.id });

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const connection = await get<{
        id: string;
        requester_id: string;
        receiver_id: string;
        status: string;
      }>(
        "SELECT * FROM language_exchange_connections WHERE id = ? AND receiver_id = ?",
        [id, user.id],
      );

      console.log("Connection found:", connection);

      if (!connection) {
        return res
          .status(404)
          .json({ success: false, message: "Connection request not found" });
      }

      if (connection.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Connection request is not pending (current status: ${connection.status})`,
        });
      }

      await run(
        "UPDATE language_exchange_connections SET status = 'accepted', updated_at = datetime('now') WHERE id = ?",
        [id],
      );

      const chatId = uuidv4();
      await run(
        `INSERT INTO language_exchange_chats (id, connection_id, user1_id, user2_id)
         VALUES (?, ?, ?, ?)`,
        [chatId, id, connection.requester_id, connection.receiver_id],
      );

      await run(
        `INSERT INTO notifications (id, user_id, type, title, message, actor_id, data)
         VALUES (?, ?, 'exchange_accepted', ?, ?, ?, ?)`,
        [
          uuidv4(),
          connection.requester_id,
          "Language Exchange Accepted",
          `${user.full_name} accepted your language exchange request`,
          user.id,
          JSON.stringify({ connection_id: id, chat_id: chatId }),
        ],
      );

      io.to(`user:${connection.requester_id}`).emit("exchange_accepted", {
        connectionId: id,
        chatId,
        accepter: {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
      });

      res.json({
        success: true,
        message: "Connection request accepted",
        data: { chat_id: chatId },
      });
    } catch (error) {
      console.error("Error accepting connection request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to accept connection request",
      });
    }
  },
);

router.post(
  "/requests/:id/reject",
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

      const connection = await get<{
        id: string;
        requester_id: string;
        status: string;
      }>(
        "SELECT * FROM language_exchange_connections WHERE id = ? AND receiver_id = ?",
        [id, user.id],
      );

      if (!connection) {
        return res
          .status(404)
          .json({ success: false, message: "Connection request not found" });
      }

      // Delete the connection instead of just updating status
      await run("DELETE FROM language_exchange_connections WHERE id = ?", [id]);

      await run(
        `INSERT INTO notifications (id, user_id, type, title, message, actor_id)
         VALUES (?, ?, 'exchange_rejected', ?, ?, ?)`,
        [
          uuidv4(),
          connection.requester_id,
          "Language Exchange Declined",
          `${user.full_name} declined your language exchange request`,
          user.id,
        ],
      );

      res.json({
        success: true,
        message: "Connection request rejected",
      });
    } catch (error) {
      console.error("Error rejecting connection request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject connection request",
      });
    }
  },
);

router.get(
  "/connections",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const connections = await all<{
        id: string;
        requester_id: string;
        receiver_id: string;
        created_at: string;
        updated_at: string;
        chat_id: string | null;
        partner_id: string;
        partner_full_name: string;
        partner_avatar_url: string | null;
        partner_department: string | null;
        partner_native_language: string | null;
        partner_target_language: string | null;
        last_message_content: string | null;
        last_message_at: string | null;
      }>(
        `SELECT 
          lec.id,
          lec.requester_id,
          lec.receiver_id,
          lec.created_at,
          lec.updated_at,
          lec_chat.id as chat_id,
          CASE 
            WHEN lec.requester_id = ? THEN lec.receiver_id
            ELSE lec.requester_id
          END as partner_id,
          CASE 
            WHEN lec.requester_id = ? THEN partner.full_name
            ELSE requester.full_name
          END as partner_full_name,
          CASE 
            WHEN lec.requester_id = ? THEN partner.avatar_url
            ELSE requester.avatar_url
          END as partner_avatar_url,
          CASE 
            WHEN lec.requester_id = ? THEN partner.department
            ELSE requester.department
          END as partner_department,
          CASE 
            WHEN lec.requester_id = ? THEN partner_lep.native_language
            ELSE requester_lep.native_language
          END as partner_native_language,
          CASE 
            WHEN lec.requester_id = ? THEN partner_lep.target_language
            ELSE requester_lep.target_language
          END as partner_target_language,
          last_msg.content as last_message_content,
          last_msg.created_at as last_message_at
        FROM language_exchange_connections lec
        LEFT JOIN language_exchange_chats lec_chat ON lec.id = lec_chat.connection_id
        LEFT JOIN users requester ON lec.requester_id = requester.id
        LEFT JOIN users partner ON lec.receiver_id = partner.id
        LEFT JOIN language_exchange_profiles requester_lep ON lec.requester_id = requester_lep.user_id
        LEFT JOIN language_exchange_profiles partner_lep ON lec.receiver_id = partner_lep.user_id
        LEFT JOIN language_exchange_messages last_msg ON lec_chat.id = last_msg.chat_id 
          AND last_msg.id = (
            SELECT id FROM language_exchange_messages 
            WHERE chat_id = lec_chat.id AND deleted_at IS NULL 
            ORDER BY created_at DESC LIMIT 1
          )
        WHERE lec.status = 'accepted' AND (lec.requester_id = ? OR lec.receiver_id = ?)
        ORDER BY COALESCE(last_msg.created_at, lec.updated_at) DESC`,
        [
          user.id,
          user.id,
          user.id,
          user.id,
          user.id,
          user.id,
          user.id,
          user.id,
        ],
      );

      res.json({ success: true, data: connections });
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch connections",
      });
    }
  },
);

router.delete(
  "/connections/:id",
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

      const connection = await get<{
        id: string;
        requester_id: string;
        receiver_id: string;
      }>(
        "SELECT * FROM language_exchange_connections WHERE id = ? AND (requester_id = ? OR receiver_id = ?)",
        [id, user.id, user.id],
      );

      if (!connection) {
        return res
          .status(404)
          .json({ success: false, message: "Connection not found" });
      }

      await run("DELETE FROM language_exchange_connections WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Connection removed successfully",
      });
    } catch (error) {
      console.error("Error removing connection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove connection",
      });
    }
  },
);

router.get("/chats", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const chats = await all<{
      id: string;
      connection_id: string;
      user1_id: string;
      user2_id: string;
      created_at: string;
      last_message_at: string | null;
      partner_id: string;
      partner_full_name: string;
      partner_avatar_url: string | null;
      partner_department: string | null;
      last_message_content: string | null;
      last_message_sender_id: string | null;
      last_message_created_at: string | null;
    }>(
      `SELECT 
          lec_chat.id,
          lec_chat.connection_id,
          lec_chat.user1_id,
          lec_chat.user2_id,
          lec_chat.created_at,
          lec_chat.last_message_at,
          CASE 
            WHEN lec_chat.user1_id = ? THEN lec_chat.user2_id
            ELSE lec_chat.user1_id
          END as partner_id,
          CASE 
            WHEN lec_chat.user1_id = ? THEN partner.full_name
            ELSE user1.full_name
          END as partner_full_name,
          CASE 
            WHEN lec_chat.user1_id = ? THEN partner.avatar_url
            ELSE user1.avatar_url
          END as partner_avatar_url,
          CASE 
            WHEN lec_chat.user1_id = ? THEN partner.department
            ELSE user1.department
          END as partner_department,
          last_msg.content as last_message_content,
          last_msg.sender_id as last_message_sender_id,
          last_msg.created_at as last_message_created_at
        FROM language_exchange_chats lec_chat
        LEFT JOIN users user1 ON lec_chat.user1_id = user1.id
        LEFT JOIN users partner ON lec_chat.user2_id = partner.id
        LEFT JOIN language_exchange_messages last_msg ON lec_chat.id = last_msg.chat_id 
          AND last_msg.id = (
            SELECT id FROM language_exchange_messages 
            WHERE chat_id = lec_chat.id AND deleted_at IS NULL 
            ORDER BY created_at DESC LIMIT 1
          )
        WHERE lec_chat.user1_id = ? OR lec_chat.user2_id = ?
        ORDER BY COALESCE(last_msg.created_at, lec_chat.created_at) DESC`,
      [user.id, user.id, user.id, user.id, user.id, user.id],
    );

    res.json({ success: true, data: chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
});

router.get(
  "/chats/:id/messages",
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

      const chat = await get<{
        id: string;
        user1_id: string;
        user2_id: string;
      }>(
        "SELECT * FROM language_exchange_chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
        [id, user.id, user.id],
      );

      if (!chat) {
        return res
          .status(404)
          .json({ success: false, message: "Chat not found" });
      }

      const offset = (Number(page) - 1) * Number(limit);
      let whereClause = "WHERE chat_id = ? AND deleted_at IS NULL";
      const params: unknown[] = [id];

      if (before) {
        whereClause += " AND created_at < ?";
        params.push(before);
      }

      const messages = await all<{
        id: string;
        chat_id: string;
        sender_id: string;
        content: string;
        image_url: string | null;
        created_at: string;
        sender_full_name: string;
        sender_avatar_url: string | null;
      }>(
        `SELECT 
          lem.id,
          lem.chat_id,
          lem.sender_id,
          lem.content,
          lem.image_url,
          lem.created_at,
          u.full_name as sender_full_name,
          u.avatar_url as sender_avatar_url
        FROM language_exchange_messages lem
        JOIN users u ON lem.sender_id = u.id
        ${whereClause}
        ORDER BY lem.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset],
      );

      const formattedMessages = messages.reverse().map((msg) => ({
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        content: msg.content,
        image_url: msg.image_url,
        created_at: msg.created_at,
        sender: {
          id: msg.sender_id,
          full_name: msg.sender_full_name,
          avatar_url: msg.sender_avatar_url,
        },
        is_own: msg.sender_id === user.id,
      }));

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
      console.error("Error fetching chat messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch chat messages",
      });
    }
  },
);

router.post(
  "/chats/:id/messages",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content, image_url } = req.body;
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      if (!user.is_admin && isFeatureRestricted(user.id, "language_exchange")) {
        return res.status(403).json({
          success: false,
          message:
            "You are restricted from using Language Exchange chat. Please contact admin.",
          code: "RESTRICTED",
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

      const chat = await get<{
        id: string;
        user1_id: string;
        user2_id: string;
      }>(
        "SELECT * FROM language_exchange_chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
        [id, user.id, user.id],
      );

      if (!chat) {
        return res
          .status(404)
          .json({ success: false, message: "Chat not found" });
      }

      const sanitizedContent = content ? sanitizeContent(content.trim()) : "";

      if (!user.is_admin && content && containsBadWords(content)) {
        const detectedWords = detectBadWords(content);
        const messageId = uuidv4();

        await run(
          `INSERT INTO language_exchange_messages (id, chat_id, sender_id, content, image_url)
           VALUES (?, ?, ?, ?, ?)`,
          [messageId, id, user.id, sanitizedContent, image_url || null],
        );

        createUserFlag(
          user.id,
          "language_exchange",
          messageId,
          content,
          detectedWords,
          3,
        );

        scheduleContentDeletion("exchange_message", messageId, 1);

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
        `INSERT INTO language_exchange_messages (id, chat_id, sender_id, content, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [messageId, id, user.id, sanitizedContent, image_url || null],
      );

      await run(
        "UPDATE language_exchange_chats SET last_message_at = datetime('now') WHERE id = ?",
        [id],
      );

      const receiverId =
        chat.user1_id === user.id ? chat.user2_id : chat.user1_id;

      await run(
        `INSERT INTO notifications (id, user_id, type, title, message, actor_id, data)
         VALUES (?, ?, 'new_exchange_message', ?, ?, ?, ?)`,
        [
          uuidv4(),
          receiverId,
          "New Message",
          `${user.full_name} sent you a message`,
          user.id,
          JSON.stringify({ chat_id: id, message_id: messageId }),
        ],
      );

      const message = {
        id: messageId,
        chat_id: id,
        sender_id: user.id,
        content: sanitizedContent,
        image_url: image_url || null,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
      };

      console.log(
        "Emitting exchange_message to chat:",
        id,
        "message:",
        message,
      );

      io.to(`chat:${id}`).emit("exchange_message", {
        ...message,
        sender_id: user.id,
      });

      res.json({ success: true, data: { ...message, is_own: true } });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message",
      });
    }
  },
);

router.delete(
  "/chats/:id",
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

      const chat = await get<{
        id: string;
        connection_id: string;
        user1_id: string;
        user2_id: string;
      }>(
        "SELECT * FROM language_exchange_chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
        [id, user.id, user.id],
      );

      if (!chat) {
        return res
          .status(404)
          .json({ success: false, message: "Chat not found" });
      }

      const connectionId = chat.connection_id;

      await run("DELETE FROM language_exchange_messages WHERE chat_id = ?", [
        id,
      ]);
      await run("DELETE FROM language_exchange_chats WHERE id = ?", [id]);

      if (connectionId) {
        await run(
          `UPDATE language_exchange_connections 
           SET status = 'disconnected', updated_at = datetime('now') 
           WHERE id = ?`,
          [connectionId],
        );
      }

      res.json({
        success: true,
        message: "Chat session deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete chat",
      });
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

      const message = await get<{
        id: string;
        chat_id: string;
        sender_id: string;
      }>(
        "SELECT * FROM language_exchange_messages WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      if (message.sender_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this message",
        });
      }

      await run(
        "UPDATE language_exchange_messages SET deleted_at = datetime('now') WHERE id = ?",
        [id],
      );

      io.to(`chat:${message.chat_id}`).emit("exchange_message_deleted", {
        messageId: id,
        chatId: message.chat_id,
      });

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete message",
      });
    }
  },
);

export default router;
