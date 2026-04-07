import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import xss from "xss";
import { run, get, all } from "../config/database.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { authenticate } from "../middleware/auth.js";
import {
  verifyGoogleIdToken,
  type DecodedGoogleToken,
} from "../lib/firebaseAdmin.js";
import type {
  User,
  SignupRequest,
  LoginRequest,
  UpdateProfileRequest,
  ApiResponse,
} from "../types/index.js";

const router = Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 10;

interface LoginAttempt {
  id: string;
  user_id: string;
  ip_address: string;
  attempt_count: number;
  locked_until: string | null;
  last_attempt: string;
}

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
    google_uid: user.google_uid || null,
    profile_completed: !!user.profile_completed,
    auth_provider: (user.auth_provider as "password" | "google") || "password",
    google_photo_url: user.google_photo_url || null,
    agreed_to_terms: !!user.agreed_to_terms,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

async function logLoginAttempt(
  userId: string,
  req: Request,
  status: "success" | "failed",
  method: string = "password",
) {
  await run(
    `INSERT INTO login_logs (id, user_id, ip_address, user_agent, login_method, login_status) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      userId,
      getClientIp(req),
      req.headers["user-agent"] || "unknown",
      method,
      status,
    ],
  );
}

async function getLoginAttempt(userId: string): Promise<LoginAttempt | undefined> {
  return await get<LoginAttempt>("SELECT * FROM login_attempts WHERE user_id = ?", [
    userId,
  ]);
}

async function recordFailedAttempt(
  userId: string,
  req: Request,
): Promise<{ locked: boolean; remainingAttempts: number }> {
  const existingAttempt = await getLoginAttempt(userId);
  const clientIp = getClientIp(req);

  if (!existingAttempt) {
    await run(
      `INSERT INTO login_attempts (id, user_id, ip_address, attempt_count, last_attempt) VALUES (?, ?, ?, 1, datetime('now'))`,
      [uuidv4(), userId, clientIp],
    );
    return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  const newAttemptCount = existingAttempt.attempt_count + 1;

  if (newAttemptCount >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date(
      Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
    ).toISOString();
    await run(
      `UPDATE login_attempts SET attempt_count = ?, locked_until = ?, last_attempt = datetime('now'), ip_address = ? WHERE user_id = ?`,
      [newAttemptCount, lockedUntil, clientIp, userId],
    );
    return { locked: true, remainingAttempts: 0 };
  }

  await run(
    `UPDATE login_attempts SET attempt_count = ?, last_attempt = datetime('now'), ip_address = ? WHERE user_id = ?`,
    [newAttemptCount, clientIp, userId],
  );
  return {
    locked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttemptCount,
  };
}

async function clearLoginAttempts(userId: string) {
  await run("DELETE FROM login_attempts WHERE user_id = ?", [userId]);
}

async function isUserLocked(userId: string): Promise<{
  locked: boolean;
  lockedUntil: string | null;
}> {
  const attempt = await getLoginAttempt(userId);

  if (!attempt || !attempt.locked_until) {
    return { locked: false, lockedUntil: null };
  }

  const lockedUntilDate = new Date(attempt.locked_until);
  const now = new Date();

  if (now < lockedUntilDate) {
    return { locked: true, lockedUntil: attempt.locked_until };
  }

  await run(
    "UPDATE login_attempts SET attempt_count = 0, locked_until = NULL WHERE user_id = ?",
    [userId],
  );
  return { locked: false, lockedUntil: null };
}

router.post(
  "/signup",
  [
    body("student_id").trim().notEmpty().withMessage("Student ID is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("full_name").trim().notEmpty().withMessage("Full name is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("department").optional().trim(),
    body("enrollment_year").optional().isInt({ min: 2000, max: 2100 }),
    body("current_year").optional().isInt({ min: 1, max: 10 }),
    body("phone").optional().trim(),
    body("country").optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        } as ApiResponse);
      }

      const {
        student_id,
        email,
        full_name,
        password,
        department,
        enrollment_year,
        current_year,
        phone,
        country,
        agreed_to_terms,
      } = req.body;

      if (!agreed_to_terms) {
        return res.status(400).json({
          success: false,
          message: "You must agree to the Terms of Service and Privacy Policy",
        } as ApiResponse);
      }

      const existingStudentId = await get(
        "SELECT id FROM users WHERE student_id = ?",
        [sanitizeInput(student_id)],
      );
      if (existingStudentId) {
        return res.status(409).json({
          success: false,
          message: "Student ID already registered",
        } as ApiResponse);
      }

      const existingEmail = await get("SELECT id FROM users WHERE email = ?", [
        sanitizeInput(email),
      ]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        } as ApiResponse);
      }

      const passwordHash = await hashPassword(password);
      const userId = uuidv4();

      await run(
        `INSERT INTO users (
          id, student_id, email, full_name, password_hash, 
          department, enrollment_year, current_year, phone, country, is_verified,
          agreed_to_terms, agreed_to_terms_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, datetime('now'))`,
        [
          userId,
          sanitizeInput(student_id),
          sanitizeInput(email),
          sanitizeInput(full_name),
          passwordHash,
          department ? sanitizeInput(department) : null,
          enrollment_year || null,
          current_year || null,
          phone ? sanitizeInput(phone) : null,
          country ? sanitizeInput(country) : null,
        ],
      );

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [userId]);
      if (!user) {
        return res.status(500).json({
          success: false,
          message: "Failed to create user",
        } as ApiResponse);
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        isAdmin: !!user.is_admin,
      });

      logLoginAttempt(userId, req, "success", "signup");

      res.status(201).json({
        success: true,
        message:
          "Account created successfully. Please wait for admin verification to access all features.",
        data: {
          user: toSafeUser(user),
          token,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post(
  "/login",
  [
    body("login")
      .trim()
      .notEmpty()
      .withMessage("Student ID or email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        } as ApiResponse);
      }

      const { login, password } = req.body;
      const sanitizedLogin = sanitizeInput(login);

      const user = await get<User>(
        `SELECT * FROM users WHERE student_id = ? OR email = ?`,
        [sanitizedLogin, sanitizedLogin],
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        } as ApiResponse);
      }

      if (user.is_banned) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been banned. Please contact administrator.",
        } as ApiResponse);
      }

      if (!user.is_admin) {
        const lockStatus = await isUserLocked(user.id);
        if (lockStatus.locked) {
          const lockedUntil = new Date(lockStatus.lockedUntil!);
          const remainingSeconds = Math.ceil(
            (lockedUntil.getTime() - Date.now()) / 1000,
          );
          const remainingMinutes = Math.ceil(remainingSeconds / 60);

          return res.status(429).json({
            success: false,
            message: `Too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
            data: {
              lockedUntil: lockStatus.lockedUntil,
              remainingMinutes,
            },
          } as ApiResponse);
        }
      }

      const isValidPassword = await comparePassword(
        password,
        user.password_hash,
      );

      if (!isValidPassword) {
        if (!user.is_admin) {
          const result = await recordFailedAttempt(user.id, req);
          logLoginAttempt(user.id, req, "failed");

          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
            data: {
              remainingAttempts: result.remainingAttempts,
            },
          } as ApiResponse);
        }

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        } as ApiResponse);
      }

      if (!user.is_admin) {
        await clearLoginAttempts(user.id);
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        isAdmin: !!user.is_admin,
      });
      logLoginAttempt(user.id, req, "success");

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: toSafeUser(user),
          token,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: toSafeUser(req.user!),
    },
  } as ApiResponse);
});

router.put(
  "/profile",
  authenticate,
  [
    body("full_name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Full name cannot be empty"),
    body("department").optional().trim(),
    body("enrollment_year").optional().isInt({ min: 2000, max: 2100 }),
    body("current_year").optional().isInt({ min: 1, max: 10 }),
    body("phone").optional().trim(),
    body("country").optional().trim(),
    body("avatar_url").optional().trim(),
    body("bio").optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        } as ApiResponse);
      }

      const {
        full_name,
        department,
        enrollment_year,
        current_year,
        phone,
        country,
        avatar_url,
        bio,
      } = req.body;
      const userId = req.userId;

      const updateFields: string[] = [];
      const updateValues: (string | number | null)[] = [];

      if (full_name !== undefined) {
        updateFields.push("full_name = ?");
        updateValues.push(sanitizeInput(full_name));
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
      if (avatar_url !== undefined) {
        updateFields.push("avatar_url = ?");
        updateValues.push(avatar_url ? sanitizeInput(avatar_url) : null);
      }
      if (bio !== undefined) {
        updateFields.push("bio = ?");
        updateValues.push(bio ? sanitizeInput(bio) : null);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        } as ApiResponse);
      }

      const currentUser = await get<User>("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      if (
        currentUser &&
        currentUser.auth_provider === "google" &&
        !currentUser.profile_completed
      ) {
        updateFields.push("profile_completed = 1");
      }

      updateFields.push('updated_at = datetime("now")');
      updateValues.push(userId!);

      await run(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      const user = await get<User>("SELECT * FROM users WHERE id = ?", [userId]);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: toSafeUser(user!),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.put(
  "/password",
  authenticate,
  [
    body("current_password")
      .notEmpty()
      .withMessage("Current password is required"),
    body("new_password")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        } as ApiResponse);
      }

      const { current_password, new_password } = req.body;
      const user = req.user!;

      const isValidPassword = await comparePassword(
        current_password,
        user.password_hash,
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        } as ApiResponse);
      }

      const newPasswordHash = await hashPassword(new_password);
      await run(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
        [newPasswordHash, user.id],
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post("/logout", authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  } as ApiResponse);
});

router.get("/my-restrictions", authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const flags = await all<{
      id: string;
      flag_type: string;
      reason: string;
      source: string;
      restriction_type: string;
      restriction_days: number;
      restricted_features: string;
      restricted_at: string;
      restriction_ends_at: string | null;
      is_active: number;
      created_at: string;
    }>(
      `SELECT id, flag_type, reason, source, restriction_type, restriction_days,
                restricted_features, restricted_at, restriction_ends_at, is_active, created_at
         FROM user_flags 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
      [user.id],
    );

    const formattedFlags = flags.map((f) => ({
      ...f,
      restricted_features: JSON.parse(f.restricted_features || "[]"),
      is_expired: f.restriction_ends_at
        ? new Date(f.restriction_ends_at) < new Date()
        : false,
    }));

    res.json({
      success: true,
      data: formattedFlags,
    });
  } catch (error) {
    console.error("Get restrictions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get restrictions",
    } as ApiResponse);
  }
});

router.post(
  "/appeal/:flagId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { flagId } = req.params;
      const { message } = req.body;

      if (!message || message.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Appeal message must be at least 10 characters",
        } as ApiResponse);
      }

      // Verify the flag belongs to the user
      const flag = await get<{ id: string; user_id: string; appeal_status: string }>(
        "SELECT id, user_id, appeal_status FROM user_flags WHERE id = ?",
        [flagId],
      );

      if (!flag || flag.user_id !== user.id) {
        return res.status(404).json({
          success: false,
          message: "Flag not found",
        } as ApiResponse);
      }

      if (flag.appeal_status === "pending") {
        return res.status(400).json({
          success: false,
          message: "An appeal is already pending for this restriction",
        } as ApiResponse);
      }

      if (flag.appeal_status === "approved") {
        return res.status(400).json({
          success: false,
          message: "This restriction has already been appealed and approved",
        } as ApiResponse);
      }

      // Submit the appeal
      await run(
        `UPDATE user_flags 
         SET appeal_message = ?, appeal_submitted_at = datetime('now'), appeal_status = 'pending'
         WHERE id = ?`,
        [message.trim(), flagId],
      );

      res.json({
        success: true,
        message: "Appeal submitted successfully. An admin will review it.",
      } as ApiResponse);
    } catch (error) {
      console.error("Submit appeal error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit appeal",
      } as ApiResponse);
    }
  },
);

router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("student_id").trim().notEmpty().withMessage("Student ID is required"),
    body("recovery_email").optional().isEmail().normalizeEmail(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        } as ApiResponse);
      }

      const { email, student_id, recovery_email } = req.body;
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedStudentId = sanitizeInput(student_id);
      const sanitizedRecoveryEmail = recovery_email
        ? sanitizeInput(recovery_email)
        : null;

      const user = await get<User>(
        "SELECT * FROM users WHERE email = ? AND student_id = ?",
        [sanitizedEmail, sanitizedStudentId],
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "No account found with this email and student ID combination",
        } as ApiResponse);
      }

      if (user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "Admin accounts cannot use this feature",
        } as ApiResponse);
      }

      const existingRequest = await get<{ id: string; status: string }>(
        "SELECT id, status FROM password_recovery_requests WHERE user_id = ? AND status = 'pending'",
        [user.id],
      );

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: "You already have a pending password recovery request",
        } as ApiResponse);
      }

      const requestId = uuidv4();
      const finalRecoveryEmail = sanitizedRecoveryEmail || sanitizedEmail;

      await run(
        `INSERT INTO password_recovery_requests (id, user_id, email, student_id, recovery_email, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
        [
          requestId,
          user.id,
          sanitizedEmail,
          sanitizedStudentId,
          finalRecoveryEmail,
        ],
      );

      res.json({
        success: true,
        message:
          "Password recovery request submitted. An admin will review your request.",
      } as ApiResponse);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  },
);

router.post("/google-login", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      } as ApiResponse);
    }

    const decodedToken: DecodedGoogleToken = await verifyGoogleIdToken(idToken);
    const googleUid = decodedToken.uid;
    const email = decodedToken.email;
    const fullName = decodedToken.name || "Google User";
    const photoUrl = decodedToken.picture || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required from Google account",
      } as ApiResponse);
    }

    let isNewUser = false;
    let user = await get<User>(
      "SELECT * FROM users WHERE email = ? OR google_uid = ?",
      [email, googleUid],
    );

    if (!user) {
      isNewUser = true;
      const userId = uuidv4();
      const autoStudentId = `GOOGLE_${googleUid.substring(0, 8)}`;
      await run(
        `INSERT INTO users (
          id, student_id, email, full_name, password_hash,
          avatar_url, google_uid, auth_provider, profile_completed,
          is_verified, agreed_to_terms, created_at
        ) VALUES (?, ?, ?, ?, '', ?, ?, 'google', 0, 1, 0, datetime('now'))`,
        [
          userId,
          autoStudentId,
          sanitizeInput(email),
          sanitizeInput(fullName),
          photoUrl,
          googleUid,
        ],
      );

      user = await get<User>("SELECT * FROM users WHERE id = ?", [userId]);

      if (!user) {
        return res.status(500).json({
          success: false,
          message: "Failed to create user from Google sign-in",
        } as ApiResponse);
      }

      logLoginAttempt(userId, req, "success", "google");
    } else {
      await run(
        `UPDATE users SET google_uid = ?, avatar_url = COALESCE(NULLIF(?,''), avatar_url), auth_provider = 'google', updated_at = datetime('now') WHERE id = ?`,
        [googleUid, photoUrl || "", user.id],
      );
      logLoginAttempt(user.id, req, "success", "google");
      user = await get<User>("SELECT * FROM users WHERE id = ?", [user.id]);
    }

    if (user && user.is_banned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned. Please contact administrator.",
      } as ApiResponse);
    }

    const token = generateToken({
      userId: user!.id,
      email: user!.email,
      isAdmin: !!user!.is_admin,
    });

    res.json({
      success: true,
      message: isNewUser
        ? "Account created via Google. Please complete your profile."
        : "Google login successful",
      data: {
        user: toSafeUser(user!),
        token,
        isNewUser,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    } as ApiResponse);
  }
});

export default router;
