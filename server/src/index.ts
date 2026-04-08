import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

import {
  initializeDatabase,
  ensureLanguageExchangeTables,
} from "./config/database";
import { run, get } from "./config/database";
import { hashPassword } from "./utils/auth";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import visitorRoutes from "./routes/visitors";
import hskRoutes from "./routes/hsk";
import socialRoutes from "./routes/social";
import discordRoutes, { ensureDefaultGroups } from "./routes/discord";
import adminDiscordRoutes from "./routes/adminDiscord";
import uploadRoutes from "./routes/upload";
import languageExchangeRoutes from "./routes/languageExchange";
import hskGrammarRoutes from "./routes/hsk-grammar";
import eventsRoutes from "./routes/events";
import { initGoogleAuth } from "./lib/firebaseAdmin.js";
import marketRoutes from "./routes/market";
import marketChatRoutes from "./routes/marketChat";
import chatbotRoutes from "./routes/chatbot";
import xingyuanAdminRoutes from "./routes/xingyuan-admin";
import xingyuanUserRoutes from "./routes/xingyuan-user";
import glmRoutes from "./routes/glm";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://ncwu-frontend.onrender.com",
  "https://ncwu-community.vercel.app",
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSockets = new Map<string, Set<string>>();
const userGroups = new Map<string, Set<string>>();

// Socket.IO connection rate limiting - Track connection attempts per IP
const socketConnectionAttempts = new Map<
  string,
  { count: number; firstAttempt: number }
>();
const SOCKET_CONNECTION_LIMIT = 20; // Max 20 connections per minute per IP
const SOCKET_CONNECTION_WINDOW = 60 * 1000; // 1 minute window

// Socket.IO message rate limiting - Track messages per user
const userMessageCounts = new Map<
  string,
  { count: number; windowStart: number }
>();
const MESSAGE_LIMIT = 30; // Max 30 messages per minute per user
const MESSAGE_WINDOW = 60 * 1000; // 1 minute window

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await get<{
      id: string;
      is_banned: number;
      is_admin: number;
      role: string;
    }>("SELECT id, is_banned, is_admin, role FROM users WHERE id = ?", [
      decoded.userId,
    ]);

    if (!user || user.is_banned) {
      return next(new Error("User not found or banned"));
    }

    const isAdmin =
      !!user.is_admin || user.role === "admin" || user.role === "superadmin";

    if (!isAdmin) {
      const clientIp = socket.handshake.address || "unknown";
      const now = Date.now();

      const attemptData = socketConnectionAttempts.get(clientIp);

      if (
        !attemptData ||
        now - attemptData.firstAttempt > SOCKET_CONNECTION_WINDOW
      ) {
        socketConnectionAttempts.set(clientIp, { count: 1, firstAttempt: now });
      } else {
        attemptData.count++;

        if (attemptData.count > SOCKET_CONNECTION_LIMIT) {
          return next(
            new Error("Too many connection attempts. Please try again later."),
          );
        }
      }
    }

    socket.data.userId = user.id;
    socket.data.isAdmin = isAdmin;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// Helper function to check message rate limit
function checkMessageRateLimit(
  userId: string,
  isAdmin: boolean = false,
): boolean {
  if (isAdmin) return true;
  const now = Date.now();
  const userCount = userMessageCounts.get(userId);

  if (!userCount || now - userCount.windowStart > MESSAGE_WINDOW) {
    // Reset counter if window has passed
    userMessageCounts.set(userId, { count: 1, windowStart: now });
    return true;
  }

  userCount.count++;
  return userCount.count <= MESSAGE_LIMIT;
}

io.on("connection", async (socket) => {
  const userId = socket.data.userId as string;
  const isAdmin = (socket.data.isAdmin as boolean) || false;
  console.log(`User ${userId} connected via socket ${socket.id}`);

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket.id);

  await run(
    `INSERT INTO discord_user_presence (id, user_id, status) 
     VALUES (?, ?, 'online')
     ON CONFLICT(user_id) DO UPDATE SET status = 'online', last_seen = datetime('now')`,
    [`presence_${userId}_${Date.now()}`, userId],
  );

  io.emit("user_online", { userId });

  socket.on("join_group", async (groupId: string) => {
    socket.join(`group:${groupId}`);

    if (!userGroups.has(userId)) {
      userGroups.set(userId, new Set());
    }
    userGroups.get(userId)!.add(groupId);

    socket
      .to(`group:${groupId}`)
      .emit("user_joined_group", { userId, groupId });
  });

  socket.on("join_chat", (chatId: string) => {
    console.log(`User ${userId} joining chat: ${chatId}`);
    socket.join(`chat:${chatId}`);
  });

  socket.on("leave_chat", (chatId: string) => {
    console.log(`User ${userId} leaving chat: ${chatId}`);
    socket.leave(`chat:${chatId}`);
  });

  socket.on("join_user_room", () => {
    console.log(`User ${userId} joining user room`);
    socket.join(`user:${userId}`);
  });

  // Language Exchange Chat - Typing Indicators
  socket.on("typing_start", (chatId: string) => {
    console.log(`User ${userId} started typing in chat: ${chatId}`);
    socket.to(`chat:${chatId}`).emit("user_typing", { userId, chatId });
  });

  socket.on("typing_stop", (chatId: string) => {
    console.log(`User ${userId} stopped typing in chat: ${chatId}`);
    socket.to(`chat:${chatId}`).emit("user_stopped_typing", { userId, chatId });
  });

  socket.on("leave_group", (groupId: string) => {
    socket.leave(`group:${groupId}`);

    if (userGroups.has(userId)) {
      userGroups.get(userId)!.delete(groupId);
    }

    socket.to(`group:${groupId}`).emit("user_left_group", { userId, groupId });
  });

  socket.on("send_message", async (data: { groupId: string; message: any }) => {
    if (!checkMessageRateLimit(userId, isAdmin)) {
      socket.emit("error", {
        message: "Message rate limit exceeded. Please slow down.",
      });
      return;
    }
    io.to(`group:${data.groupId}`).emit("new_message", data.message);
  });

  socket.on(
    "delete_message",
    (data: { groupId: string; messageId: string }) => {
      io.to(`group:${data.groupId}`).emit("message_deleted", {
        messageId: data.messageId,
        groupId: data.groupId,
      });
    },
  );

  socket.on("typing_start", (groupId: string) => {
    socket.to(`group:${groupId}`).emit("user_typing", { userId, groupId });
  });

  socket.on("typing_stop", (groupId: string) => {
    socket
      .to(`group:${groupId}`)
      .emit("user_stopped_typing", { userId, groupId });
  });

  socket.on(
    "mark_viewed",
    async (data: { groupId: string; messageIds: string[] }) => {
      for (const messageId of data.messageIds) {
        const viewCount = await get<{ count: number }>(
          "SELECT COUNT(*) as count FROM discord_message_views WHERE message_id = ?",
          [messageId],
        );
        io.to(`group:${data.groupId}`).emit("message_viewed", {
          messageId,
          viewCount: viewCount?.count || 0,
        });
      }
    },
  );

  socket.on(
    "update_presence",
    async (status: "online" | "offline" | "away") => {
      await run(
        "UPDATE discord_user_presence SET status = ?, last_seen = datetime('now') WHERE user_id = ?",
        [status, userId],
      );

      if (status === "offline") {
        io.emit("user_offline", { userId });
      } else {
        io.emit("user_online", { userId });
      }
    },
  );

  // Market Chat - Real-time messaging
  socket.on("market_chat_join", async (sessionId: string) => {
    console.log(`User ${userId} joining market chat session: ${sessionId}`);
    socket.join(`market_chat:${sessionId}`);

    // Verify user is part of this chat session
    const session = await get<{ buyer_id: string; seller_id: string }>(
      "SELECT buyer_id, seller_id FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
      [sessionId],
    );

    if (
      session &&
      (session.buyer_id === userId || session.seller_id === userId)
    ) {
      // Mark messages as read
      await run(
        `UPDATE market_chat_messages SET is_read = 1, read_at = datetime('now') 
         WHERE session_id = ? AND sender_id != ? AND is_read = 0`,
        [sessionId, userId],
      );

      // Notify other participant
      socket.to(`market_chat:${sessionId}`).emit("market_chat_user_joined", {
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("market_chat_leave", (sessionId: string) => {
    console.log(`User ${userId} leaving market chat session: ${sessionId}`);
    socket.leave(`market_chat:${sessionId}`);
    socket.to(`market_chat:${sessionId}`).emit("market_chat_user_left", {
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on(
    "market_chat_message",
    async (data: { sessionId: string; content: string }) => {
      try {
        if (!checkMessageRateLimit(userId, isAdmin)) {
          socket.emit("market_chat_error", {
            message: "Message rate limit exceeded. Please slow down.",
          });
          return;
        }

        const { sessionId, content } = data;

        // Verify user is part of this chat session
        const session = await get<{
          buyer_id: string;
          seller_id: string;
          post_id: string;
        }>(
          "SELECT buyer_id, seller_id, post_id FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
          [sessionId],
        );

        if (
          !session ||
          (session.buyer_id !== userId && session.seller_id !== userId)
        ) {
          socket.emit("market_chat_error", { message: "Unauthorized" });
          return;
        }

        // Create message
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        await run(
          `INSERT INTO market_chat_messages (id, session_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)`,
          [messageId, sessionId, userId, content, now],
        );

        // Update session last_message_at
        await run(
          `UPDATE market_chat_sessions SET last_message_at = ? WHERE id = ?`,
          [now, sessionId],
        );

        // Get sender info
        const sender = await get<{ full_name: string; avatar_url: string }>(
          "SELECT full_name, avatar_url FROM users WHERE id = ?",
          [userId],
        );

        const messageData = {
          id: messageId,
          session_id: sessionId,
          sender_id: userId,
          sender_name: sender?.full_name || "Unknown",
          sender_avatar: sender?.avatar_url || null,
          content: content,
          is_read: 0,
          created_at: now,
        };

        // Send confirmation back to sender
        socket.emit("market_chat_message_sent", messageData);

        // Broadcast to other participants in the chat (excluding sender)
        socket
          .to(`market_chat:${sessionId}`)
          .emit("market_chat_new_message", messageData);

        // Also notify the recipient if they're not in the chat
        const recipientId =
          session.buyer_id === userId ? session.seller_id : session.buyer_id;
        io.to(`user:${recipientId}`).emit("market_chat_notification", {
          sessionId,
          postId: session.post_id,
          senderId: userId,
          senderName: sender?.full_name || "Unknown",
          preview: content.substring(0, 50),
        });
      } catch (error) {
        console.error("Error sending market chat message:", error);
        socket.emit("market_chat_error", { message: "Failed to send message" });
      }
    },
  );

  socket.on("market_chat_typing_start", async (sessionId: string) => {
    const session = await get<{ buyer_id: string; seller_id: string }>(
      "SELECT buyer_id, seller_id FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
      [sessionId],
    );

    if (
      session &&
      (session.buyer_id === userId || session.seller_id === userId)
    ) {
      await run(
        `INSERT INTO market_chat_typing (id, session_id, user_id, is_typing, updated_at) 
         VALUES (?, ?, ?, 1, datetime('now'))
         ON CONFLICT(session_id, user_id) DO UPDATE SET is_typing = 1, updated_at = datetime('now')`,
        [`typing_${sessionId}_${userId}`, sessionId, userId],
      );

      socket.to(`market_chat:${sessionId}`).emit("market_chat_typing", {
        sessionId,
        userId,
        isTyping: true,
      });
    }
  });

  socket.on("market_chat_typing_stop", async (sessionId: string) => {
    await run(
      `UPDATE market_chat_typing SET is_typing = 0, updated_at = datetime('now') WHERE session_id = ? AND user_id = ?`,
      [sessionId, userId],
    );

    socket.to(`market_chat:${sessionId}`).emit("market_chat_typing", {
      sessionId,
      userId,
      isTyping: false,
    });
  });

  socket.on("market_chat_mark_read", async (sessionId: string) => {
    const session = await get<{ buyer_id: string; seller_id: string }>(
      "SELECT buyer_id, seller_id FROM market_chat_sessions WHERE id = ? AND is_deleted = 0",
      [sessionId],
    );

    if (
      session &&
      (session.buyer_id === userId || session.seller_id === userId)
    ) {
      await run(
        `UPDATE market_chat_messages SET is_read = 1, read_at = datetime('now') 
         WHERE session_id = ? AND sender_id != ? AND is_read = 0`,
        [sessionId, userId],
      );

      socket.to(`market_chat:${sessionId}`).emit("market_chat_messages_read", {
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected from socket ${socket.id}`);

    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        userSockets.delete(userId);
        userGroups.delete(userId);

        await run(
          "UPDATE discord_user_presence SET status = 'offline', last_seen = datetime('now') WHERE user_id = ?",
          [userId],
        );

        io.emit("user_offline", { userId });
      }
    }
  });
});

// Seed super admin user on startup
async function seedSuperAdmin() {
  const adminStudentId = "2023LXSB0316";
  const adminPassword = "milton9666";
  const adminEmail = "admin@ncwu.edu";
  const adminName = "Super Admin";

  try {
    // Check if admin already exists
    const existingAdmin = await get(
      "SELECT id FROM users WHERE student_id = ?",
      [adminStudentId],
    );

    if (existingAdmin) {
      console.log("✅ Super admin already exists");
      return;
    }

    // Create super admin
    const userId = uuidv4();
    const passwordHash = await hashPassword(adminPassword);

    await run(
      `INSERT INTO users (
        id, student_id, email, full_name, password,
        role, is_admin, is_verified, profile_completed,
        agreed_to_terms, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        userId,
        adminStudentId,
        adminEmail,
        adminName,
        passwordHash,
        "superadmin",
        1,
        1,
        1,
        1,
      ],
    );

    console.log("✅ Super admin created successfully!");
    console.log(`   Student ID: ${adminStudentId}`);
    console.log(`   Password: ${adminPassword}`);
  } catch (error) {
    console.error("Failed to seed super admin:", error);
  }
}

async function startServer() {
  // Register ALL middleware and routes FIRST (synchronous)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // General API rate limiter - 200 requests per 15 minutes
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: {
      success: false,
      message: "Too many requests, please try again after 15 minutes.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      if (req.path === "/api/health") return true;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) return true;
      return false;
    },
  });

  // Strict rate limiter for authentication endpoints - 10 requests per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message:
        "Too many authentication attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const authHeader = req.headers.authorization;
      return !!(authHeader && authHeader.startsWith("Bearer "));
    },
  });

  // Very strict limiter for password recovery - 3 requests per hour
  const passwordRecoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
      success: false,
      message:
        "Too many password recovery requests. Please try again after 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const authHeader = req.headers.authorization;
      return !!(authHeader && authHeader.startsWith("Bearer "));
    },
  });

  // Apply general limiter to all API routes
  app.use("/api/", generalLimiter);

  // Apply stricter limiter to auth routes
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/signup", authLimiter);

  // Apply very strict limiter to password recovery
  app.use("/api/auth/forgot-password", passwordRecoveryLimiter);

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/visitors", visitorRoutes);
  app.use("/api/hsk", hskRoutes);
  app.use("/api/social", socialRoutes);
  app.use("/api/discord", discordRoutes);
  app.use("/api/admin/discord", adminDiscordRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/language-exchange", languageExchangeRoutes);
  app.use("/api/hsk", hskGrammarRoutes);
  app.use("/api", eventsRoutes);
  app.use("/api", marketRoutes);
  app.use("/api", marketChatRoutes);
  app.use("/api/chatbot", chatbotRoutes);
  app.use("/api/admin/xingyuan", xingyuanAdminRoutes);
  app.use("/api/xingyuan", xingyuanUserRoutes);
  app.use("/api", glmRoutes);

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Error:", err.message);
      res.status(500).json({
        success: false,
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
      });
    },
  );

  app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  // NOW start listening - all routes/middleware are registered
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`👑 Admin endpoints: http://localhost:${PORT}/api/admin`);
    console.log(`📚 HSK endpoints: http://localhost:${PORT}/api/hsk`);
    console.log(`💬 Discord endpoints: http://localhost:${PORT}/api/discord`);
    console.log(`🎉 Events endpoints: http://localhost:${PORT}/api/events`);
    console.log(`🔌 Socket.io enabled for real-time communication`);
  });

  // Initialize database in background (non-blocking)
  setTimeout(async () => {
    try {
      await initializeDatabase();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }

    try {
      ensureLanguageExchangeTables();
      console.log("Language exchange tables initialized successfully");
    } catch (error) {
      console.error("Error initializing language exchange tables:", error);
    }

    try {
      await ensureDefaultGroups();
      console.log("Default Discord groups initialized successfully");
    } catch (error) {
      console.error("Error initializing default Discord groups:", error);
    }

    try {
      await initGoogleAuth();
      console.log("Google Auth initialized successfully");
    } catch (error) {
      console.error("Error initializing Google Auth:", error);
    }

    try {
      await seedSuperAdmin();
      console.log("Super admin check completed");
    } catch (error) {
      console.error("Error seeding super admin:", error);
    }
  }, 0);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // General API rate limiter - 200 requests per 15 minutes
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: {
      success: false,
      message: "Too many requests, please try again after 15 minutes.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      if (req.path === "/api/health") return true;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) return true;
      return false;
    },
  });

  // Strict rate limiter for authentication endpoints - 10 requests per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message:
        "Too many authentication attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const authHeader = req.headers.authorization;
      return !!(authHeader && authHeader.startsWith("Bearer "));
    },
  });

  // Very strict limiter for password recovery - 3 requests per hour
  const passwordRecoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
      success: false,
      message:
        "Too many password recovery requests. Please try again after 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const authHeader = req.headers.authorization;
      return !!(authHeader && authHeader.startsWith("Bearer "));
    },
  });

  // Apply general limiter to all API routes
  app.use("/api/", generalLimiter);

  // Apply stricter limiter to auth routes
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/signup", authLimiter);

  // Apply very strict limiter to password recovery
  app.use("/api/auth/forgot-password", passwordRecoveryLimiter);

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/visitors", visitorRoutes);
  app.use("/api/hsk", hskRoutes);
  app.use("/api/social", socialRoutes);
  app.use("/api/discord", discordRoutes);
  app.use("/api/admin/discord", adminDiscordRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/language-exchange", languageExchangeRoutes);
  app.use("/api/hsk", hskGrammarRoutes);
  app.use("/api", eventsRoutes);
  app.use("/api", marketRoutes);
  app.use("/api", marketChatRoutes);
  app.use("/api/chatbot", chatbotRoutes);
  app.use("/api/admin/xingyuan", xingyuanAdminRoutes);
  app.use("/api/xingyuan", xingyuanUserRoutes);
  app.use("/api", glmRoutes);

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Error:", err.message);
      res.status(500).json({
        success: false,
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
      });
    },
  );

  app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`👑 Admin endpoints: http://localhost:${PORT}/api/admin`);
    console.log(`📚 HSK endpoints: http://localhost:${PORT}/api/hsk`);
    console.log(`💬 Discord endpoints: http://localhost:${PORT}/api/discord`);
    console.log(`🎉 Events endpoints: http://localhost:${PORT}/api/events`);
    console.log(`🔌 Socket.io enabled for real-time communication`);
  });
}

startServer().catch(console.error);

export { io };
