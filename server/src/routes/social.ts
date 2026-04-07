import express, { Request, Response } from "express";
import { body, validationResult, query } from "express-validator";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { run, get, all } from "../config/database.js";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../config/cloudinary.js";
import {
  containsBadWords,
  detectBadWords,
  createUserFlag,
  isFeatureRestricted,
  scheduleContentDeletion,
} from "../utils/contentModeration.js";
import type {
  Post,
  PostWithAuthor,
  Comment,
  CommentWithAuthor,
  Like,
  Notification,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  AnonymityLevel,
  SafeUser,
} from "../types/index.js";

const router = express.Router();

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeContent(content: string): string {
  return content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

function parseAnonymityLevel(level: AnonymityLevel | undefined): {
  is_anonymous: boolean;
  show_profile_icon: boolean;
} {
  switch (level) {
    case "anonymous":
      return { is_anonymous: true, show_profile_icon: false };
    case "icon_only":
      return { is_anonymous: false, show_profile_icon: true };
    case "full":
    default:
      return { is_anonymous: false, show_profile_icon: true };
  }
}

function canUserSeePost(post: Post, user: SafeUser | undefined): boolean {
  // Admin users can see all posts regardless of visibility settings
  if (user?.is_admin) {
    return true;
  }

  if (post.visibility === "public" || post.visibility === "emergency") {
    return true;
  }

  if (!user) return false;

  if (post.visibility === "department") {
    if (!user.department) return false;
    const targetDepts = post.target_departments;
    return targetDepts.includes(user.department);
  }

  if (post.visibility === "department_year") {
    if (!user.department || !user.current_year) return false;
    const targetDepts = post.target_departments;
    const targetYears = post.target_years;
    return (
      targetDepts.includes(user.department) &&
      targetYears.includes(user.current_year)
    );
  }

  return false;
}

function calculatePostScore(
  post: PostWithAuthor,
  userInterests: string[] = [],
): number {
  const now = Date.now();
  const createdAt = new Date(post.created_at).getTime();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

  const engagementScore =
    post.like_count * 1 + post.comment_count * 2 + post.share_count * 3;

  // For small community (100-150 users): Lower thresholds
  // Every 5 engagement points = 1 hour extension (max 24 hours)
  const engagementBoost = Math.min(engagementScore * 0.2, 24);
  const effectiveHours = Math.max(0, hoursSinceCreation - engagementBoost);

  const recencyScore = Math.max(0, 100 - effectiveHours);
  const emergencyBonus = post.is_emergency ? 30 : 0; // Reduced from 50
  const pinnedBonus = post.is_pinned ? 100 : 0;

  // Interest matching bonus - if post tags match user interests
  let interestBonus = 0;
  if (userInterests.length > 0 && post.tags && post.tags.length > 0) {
    const matchingTags = post.tags.filter((tag: string) =>
      userInterests.some(
        (interest) =>
          tag.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(tag.toLowerCase()),
      ),
    );
    // 10 points per matching tag (max 30)
    interestBonus = Math.min(matchingTags.length * 10, 30);
  }

  // Balanced weights for small community
  return (
    engagementScore * 0.5 +
    recencyScore * 0.3 +
    emergencyBonus +
    pinnedBonus +
    interestBonus
  );
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string | null,
  data: Record<string, unknown>,
  actorId: string | null,
): Promise<void> {
  const notificationId = generateId();
  await run(
    `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, actor_id)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      notificationId,
      userId,
      type,
      title,
      message,
      JSON.stringify(data),
      actorId,
    ],
  );
}

router.get(
  "/feed",
  optionalAuth,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("emergency_only").optional().isBoolean().toBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const page = (req.query.page as unknown as number) || 1;
      const limit = (req.query.limit as unknown as number) || 20;
      const emergencyOnly = req.query.emergency_only === "true";
      const offset = (page - 1) * limit;

      const user = req.user as SafeUser | undefined;

      let posts: Post[] = [];

      if (user) {
        // Admin users can see all posts regardless of visibility settings
        if (user.is_admin) {
          posts = await all<Post>(
            `SELECT * FROM posts 
             WHERE deleted_at IS NULL 
             ${emergencyOnly ? "AND visibility = 'emergency'" : ""}
             ORDER BY is_pinned DESC, created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset],
          );
        } else if (emergencyOnly) {
          posts = await all<Post>(
            `SELECT * FROM posts 
             WHERE deleted_at IS NULL 
             AND visibility = 'emergency'
             ORDER BY is_pinned DESC, created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset],
          );
        } else {
          posts = await all<Post>(
            `SELECT * FROM posts 
             WHERE deleted_at IS NULL 
             AND (
               visibility = 'public' 
               OR visibility = 'emergency'
               OR (visibility = 'department' AND target_departments LIKE ?)
               OR (visibility = 'department_year' AND target_departments LIKE ? AND target_years LIKE ?)
               OR user_id = ?
             )
             ORDER BY is_pinned DESC, created_at DESC 
             LIMIT ? OFFSET ?`,
            [
              user.department ? `%"${user.department}"%` : "[]",
              user.department ? `%"${user.department}"%` : "[]",
              user.current_year ? `%"${user.current_year}"%` : "[]",
              user.id,
              limit,
              offset,
            ],
          );
        }
      } else {
        posts = await all<Post>(
          `SELECT * FROM posts 
           WHERE deleted_at IS NULL 
           AND visibility IN ('public', 'emergency')
           ORDER BY is_pinned DESC, created_at DESC 
           LIMIT ? OFFSET ?`,
          [limit, offset],
        );
      }

      const postsWithAuthors: PostWithAuthor[] = await Promise.all(
        posts.map(async (post) => {
          let author = null;

          if (!post.is_anonymous) {
            const authorData = await get<{
              id: string;
              full_name: string;
              student_id: string;
              avatar_url: string | null;
              department: string | null;
              current_year: number | null;
            }>(
              `SELECT id, full_name, student_id, avatar_url, department, current_year FROM users WHERE id = ?`,
              [post.user_id],
            );
            if (authorData) {
              const { student_id: _, ...restAuthorData } = authorData;
              if (!post.show_profile_icon) {
                author = restAuthorData;
              } else {
                author = restAuthorData;
              }
            }
          }

          const isLiked = user
            ? !!(await get<Like>(
                `SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`,
                [user.id, post.id],
              ))
            : false;

          return {
            ...post,
            images: JSON.parse((post.images as unknown as string) || "[]"),
            tags: JSON.parse((post.tags as unknown as string) || "[]"),
            target_departments: JSON.parse(
              (post.target_departments as unknown as string) || "[]",
            ),
            target_years: JSON.parse(
              (post.target_years as unknown as string) || "[]",
            ),
            author,
            is_liked: isLiked,
          };
        }),
      );

      // Get user interests for personalized feed
      let userInterests: string[] = [];
      if (user) {
        const userData = await get<{ interests: string }>(
          `SELECT interests FROM users WHERE id = ?`,
          [user.id],
        );
        if (userData?.interests) {
          try {
            userInterests = JSON.parse(userData.interests);
          } catch {
            userInterests = [];
          }
        }
      }

      const sortedPosts = postsWithAuthors.sort(
        (a, b) =>
          calculatePostScore(b, userInterests) -
          calculatePostScore(a, userInterests),
      );

      res.json({
        success: true,
        data: {
          posts: sortedPosts,
          pagination: {
            page,
            limit,
            hasMore: posts.length === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch feed",
      });
    }
  },
);

router.get(
  "/gallery",
  optionalAuth,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("tag").optional().isString(),
    query("search").optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const page = (req.query.page as unknown as number) || 1;
      const limit = (req.query.limit as unknown as number) || 20;
      const offset = (page - 1) * limit;
      const tagFilter = req.query.tag as string | undefined;
      const searchQuery = req.query.search as string | undefined;

      let whereClause = "WHERE post_type = 'gallery' AND deleted_at IS NULL";
      const params: any[] = [];

      if (tagFilter) {
        whereClause += " AND tags LIKE ?";
        params.push(`%"${tagFilter}"%`);
      }

      if (searchQuery) {
        whereClause += " AND (title LIKE ? OR content LIKE ?)";
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
      }

      const posts = await all<PostWithAuthor>(
        `SELECT p.*, u.full_name as author_name, u.avatar_url as author_avatar, u.department as author_department
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         ${whereClause}
         ORDER BY p.is_pinned DESC, p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

      // Parse JSON fields for each post
      const parsedPosts = (posts || []).map((post) => ({
        ...post,
        images: post.images ? JSON.parse(post.images as string) : [],
        tags: post.tags ? JSON.parse(post.tags as string) : [],
        target_departments: post.target_departments
          ? JSON.parse(post.target_departments as string)
          : [],
        target_years: post.target_years ? JSON.parse(post.target_years as string) : [],
        mentions: post.mentions ? JSON.parse(post.mentions as string) : [],
      }));

      const countResult = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM posts p ${whereClause}`,
        params,
      );

      res.json({
        success: true,
        data: {
          posts: parsedPosts,
          pagination: {
            page,
            limit,
            total: countResult?.count || 0,
            hasMore: (posts?.length || 0) === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch gallery",
      });
    }
  },
);

router.get(
  "/gallery/:id",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const post = await get<PostWithAuthor>(
        `SELECT p.*, u.full_name as author_name, u.avatar_url as author_avatar, u.department as author_department, u.current_year as author_year
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id = ? AND p.post_type = 'gallery' AND p.deleted_at IS NULL`,
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Gallery post not found",
        });
      }

      // Parse JSON fields for the post
      const parsedPost = {
        ...post,
        images: post.images ? JSON.parse(post.images as string) : [],
        tags: post.tags ? JSON.parse(post.tags as string) : [],
        target_departments: post.target_departments
          ? JSON.parse(post.target_departments as string)
          : [],
        target_years: post.target_years ? JSON.parse(post.target_years as string) : [],
        mentions: post.mentions ? JSON.parse(post.mentions as string) : [],
      };

      const comments = await all<CommentWithAuthor>(
        `SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar, u.department as author_department
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ? AND c.parent_comment_id IS NULL AND c.deleted_at IS NULL
         ORDER BY c.created_at ASC`,
        [id],
      );

      res.json({
        success: true,
        data: {
          post: parsedPost,
          comments: comments || [],
        },
      });
    } catch (error) {
      console.error("Error fetching gallery post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch gallery post",
      });
    }
  },
);

router.post(
  "/posts",
  authenticate,
  [
    body("content").isString().trim().isLength({ min: 1, max: 10000 }),
    body("visibility").isIn([
      "public",
      "department",
      "department_year",
      "emergency",
    ]),
    body("target_departments").optional().isArray(),
    body("target_years").optional().isArray(),
    body("is_emergency").optional().isBoolean(),
    body("anonymity_level").optional().isIn(["full", "icon_only", "anonymous"]),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = req.user!;

      if (!user.is_admin && isFeatureRestricted(user.id, "social_post")) {
        return res.status(403).json({
          success: false,
          message: "You are restricted from posting. Please contact admin.",
          code: "RESTRICTED",
        });
      }

      const data: CreatePostRequest = req.body;

      if (!user.is_admin && containsBadWords(data.content)) {
        const detectedWords = detectBadWords(data.content);

        const postId = generateId();
        const now = new Date().toISOString();
        const sanitizedContent = sanitizeContent(data.content);
        const { is_anonymous, show_profile_icon } = parseAnonymityLevel(
          data.anonymity_level,
        );

        await run(
          `INSERT INTO posts (
            id, user_id, content, images, feeling, location, tags, visibility, target_departments, target_years,
            is_emergency, is_anonymous, show_profile_icon, like_count, comment_count,
            share_count, is_pinned, is_locked, post_type, title, mentions, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?, ?, ?, ?)`,
          [
            postId,
            user.id,
            sanitizedContent,
            JSON.stringify(data.images || []),
            data.feeling || null,
            data.location || null,
            JSON.stringify(data.tags || []),
            data.visibility,
            JSON.stringify(data.target_departments || []),
            JSON.stringify(data.target_years || []),
            data.is_emergency ? 1 : 0,
            is_anonymous ? 1 : 0,
            show_profile_icon ? 1 : 0,
            data.post_type || "regular",
            data.title || null,
            JSON.stringify(data.mentions || []),
            now,
            now,
          ],
        );

        createUserFlag(
          user.id,
          "social_post",
          postId,
          data.content,
          detectedWords,
          3,
        );

        scheduleContentDeletion("post", postId, 1);

        return res.status(201).json({
          success: true,
          message:
            "Post created but flagged for inappropriate content. It will be removed in 1 minute.",
          data: {
            id: postId,
            flagged: true,
            detected_words: detectedWords,
          },
        });
      }

      const sanitizedContent = sanitizeContent(data.content);
      const { is_anonymous, show_profile_icon } = parseAnonymityLevel(
        data.anonymity_level,
      );

      const postId = generateId();
      const now = new Date().toISOString();
      const images = data.images || [];
      const tags = data.tags || [];

      await run(
        `INSERT INTO posts (
          id, user_id, content, images, feeling, location, tags, visibility, target_departments, target_years,
          is_emergency, is_anonymous, show_profile_icon, like_count, comment_count,
          share_count, is_pinned, is_locked, post_type, title, mentions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?, ?, ?, ?)`,
        [
          postId,
          user.id,
          sanitizedContent,
          JSON.stringify(images),
          data.feeling || null,
          data.location || null,
          JSON.stringify(tags),
          data.visibility,
          JSON.stringify(data.target_departments || []),
          JSON.stringify(data.target_years || []),
          data.is_emergency ? 1 : 0,
          is_anonymous ? 1 : 0,
          show_profile_icon ? 1 : 0,
          data.post_type || "regular",
          data.title || null,
          JSON.stringify(data.mentions || []),
          now,
          now,
        ],
      );

      const post = await get<Post>("SELECT * FROM posts WHERE id = ?", [
        postId,
      ]);

      const userData = await get<{
        id: string;
        full_name: string;
        avatar_url: string | null;
        department: string | null;
        current_year: number | null;
      }>(
        "SELECT id, full_name, avatar_url, department, current_year FROM users WHERE id = ?",
        [user.id],
      );

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: {
          ...post,
          images: JSON.parse((post?.images as unknown as string) || "[]"),
          tags: JSON.parse((post?.tags as unknown as string) || "[]"),
          target_departments: JSON.parse(
            (post?.target_departments as unknown as string) || "[]",
          ),
          target_years: JSON.parse(
            (post?.target_years as unknown as string) || "[]",
          ),
          author: userData
            ? {
                id: userData.id,
                full_name: userData.full_name,
                avatar_url: userData.avatar_url,
                department: userData.department,
                current_year: userData.current_year,
              }
            : null,
          is_liked: false,
        },
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create post",
      });
    }
  },
);

router.get(
  "/posts/tag/:tag",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { tag } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const user = req.user as SafeUser | undefined;

      const decodedTag = decodeURIComponent(tag).toLowerCase().replace("#", "");

      const posts = await all<Post>(
        `SELECT * FROM posts 
       WHERE deleted_at IS NULL 
       AND (
         tags LIKE ? OR 
         content LIKE ?
       )
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
        [`%"${decodedTag}"%`, `%#${decodedTag}%`, limit, offset],
      );

      const totalResult = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM posts 
       WHERE deleted_at IS NULL 
       AND (
         tags LIKE ? OR 
         content LIKE ?
       )`,
        [`%"${decodedTag}"%`, `%#${decodedTag}%`],
      );

      const postsWithAuthors: PostWithAuthor[] = await Promise.all(
        posts.map(async (post) => {
          let author = null;

          if (!post.is_anonymous) {
            const authorData = await get<{
              id: string;
              full_name: string;
              student_id: string;
              avatar_url: string | null;
              department: string | null;
              current_year: number | null;
            }>(
              `SELECT id, full_name, student_id, avatar_url, department, current_year FROM users WHERE id = ?`,
              [post.user_id],
            );
            if (authorData) {
              const { student_id: _, ...restAuthorData } = authorData;
              author = restAuthorData;
            }
          }

          const isLiked = user
            ? !!(await get<Like>(
                `SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`,
                [user.id, post.id],
              ))
            : false;

          return {
            ...post,
            images: JSON.parse((post.images as unknown as string) || "[]"),
            tags: JSON.parse((post.tags as unknown as string) || "[]"),
            target_departments: JSON.parse(
              (post.target_departments as unknown as string) || "[]",
            ),
            target_years: JSON.parse(
              (post.target_years as unknown as string) || "[]",
            ),
            author,
            is_liked: isLiked,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          posts: postsWithAuthors,
          tag: decodedTag,
          pagination: {
            page,
            limit,
            total: totalResult?.count || 0,
            hasMore: postsWithAuthors.length === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching posts by tag:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch posts by tag",
      });
    }
  },
);

router.get("/posts/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as SafeUser | undefined;

    const post = await get<Post>(
      "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
      [id],
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!canUserSeePost(post, user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this post",
      });
    }

    let author = null;
    if (!post.is_anonymous) {
      const authorData = await get<{
        id: string;
        full_name: string;
        student_id: string;
        avatar_url: string | null;
        department: string | null;
        current_year: number | null;
      }>(
        `SELECT id, full_name, student_id, avatar_url, department, current_year FROM users WHERE id = ?`,
        [post.user_id],
      );
      if (authorData) {
        const { student_id: _, ...restAuthorData } = authorData;
        author = restAuthorData;
      }
    }

    const isLiked = user
      ? !!(await get<Like>(
          `SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`,
          [user.id, post.id],
        ))
      : false;

    const postWithAuthor: PostWithAuthor = {
      ...post,
      images: JSON.parse((post.images as unknown as string) || "[]"),
      tags: JSON.parse((post.tags as unknown as string) || "[]"),
      target_departments: JSON.parse(
        (post.target_departments as unknown as string) || "[]",
      ),
      target_years: JSON.parse(
        (post.target_years as unknown as string) || "[]",
      ),
      author,
      is_liked: isLiked,
    };

    res.json({
      success: true,
      data: postWithAuthor,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch post",
    });
  }
});

router.put(
  "/posts/:id",
  authenticate,
  [
    body("content").optional().isString().trim().isLength({ max: 10000 }),
    body("title").optional().isString().trim().isLength({ max: 200 }),
    body("images").optional().isArray(),
    body("location").optional().isString().trim(),
    body("tags").optional().isArray(),
    body("visibility")
      .optional()
      .isIn(["public", "department", "department_year", "emergency"]),
    body("target_departments").optional().isArray(),
    body("target_years").optional().isArray(),
    body("is_emergency").optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const user = req.user!;
      const data: UpdatePostRequest = req.body;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (post.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to edit this post",
        });
      }

      if (post.is_locked && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "This post is locked and cannot be edited",
        });
      }

      // Parse old images from JSON string if needed
      let oldImages: string[] = [];
      if (post.images) {
        if (Array.isArray(post.images)) {
          oldImages = post.images;
        } else if (typeof post.images === "string") {
          try {
            oldImages = JSON.parse(post.images);
          } catch {
            oldImages = [];
          }
        }
      }
      const newImages = data.images || [];

      const removedImages = oldImages.filter(
        (img: string) =>
          img && img.includes("cloudinary.com") && !newImages.includes(img),
      );

      for (const imageUrl of removedImages) {
        const publicId = extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
            console.log(`Deleted removed image from Cloudinary: ${publicId}`);
          } catch (deleteError) {
            console.error(`Failed to delete image ${publicId}:`, deleteError);
          }
        }
      }

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.content !== undefined) {
        updates.push("content = ?");
        params.push(data.content ? sanitizeContent(data.content) : null);
      }
      if (data.title !== undefined) {
        updates.push("title = ?");
        params.push(data.title || null);
      }
      if (data.visibility) {
        updates.push("visibility = ?");
        params.push(data.visibility);
      }
      if (data.target_departments !== undefined) {
        updates.push("target_departments = ?");
        params.push(JSON.stringify(data.target_departments));
      }
      if (data.target_years !== undefined) {
        updates.push("target_years = ?");
        params.push(JSON.stringify(data.target_years));
      }
      if (data.is_emergency !== undefined) {
        updates.push("is_emergency = ?");
        params.push(data.is_emergency ? 1 : 0);
      }
      if (data.anonymity_level !== undefined) {
        const { is_anonymous, show_profile_icon } = parseAnonymityLevel(
          data.anonymity_level,
        );
        updates.push("is_anonymous = ?");
        updates.push("show_profile_icon = ?");
        params.push(is_anonymous ? 1 : 0);
        params.push(show_profile_icon ? 1 : 0);
      }
      if (data.images !== undefined) {
        updates.push("images = ?");
        params.push(JSON.stringify(data.images));
      }
      if (data.feeling !== undefined) {
        updates.push("feeling = ?");
        params.push(data.feeling || null);
      }
      if (data.location !== undefined) {
        updates.push("location = ?");
        params.push(data.location ? data.location : null);
      }
      if (data.tags !== undefined) {
        updates.push("tags = ?");
        params.push(JSON.stringify(data.tags));
      }

      if (updates.length > 0) {
        updates.push("updated_at = ?");
        params.push(new Date().toISOString());
        params.push(id);

        await run(
          `UPDATE posts SET ${updates.join(", ")} WHERE id = ?`,
          params,
        );
      }

      const updatedPost = await get<Post>("SELECT * FROM posts WHERE id = ?", [
        id,
      ]);

      res.json({
        success: true,
        message: "Post updated successfully",
        data: {
          ...updatedPost,
          images: JSON.parse(
            (updatedPost?.images as unknown as string) || "[]",
          ),
          tags: JSON.parse((updatedPost?.tags as unknown as string) || "[]"),
          target_departments: JSON.parse(
            (updatedPost?.target_departments as unknown as string) || "[]",
          ),
          target_years: JSON.parse(
            (updatedPost?.target_years as unknown as string) || "[]",
          ),
        },
      });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update post",
      });
    }
  },
);

router.delete(
  "/posts/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (post.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this post",
        });
      }

      if (post.images && Array.isArray(post.images)) {
        for (const imageUrl of post.images) {
          if (imageUrl && imageUrl.includes("cloudinary.com")) {
            const publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              try {
                await deleteFromCloudinary(publicId);
                console.log(`Deleted image from Cloudinary: ${publicId}`);
              } catch (deleteError) {
                console.error(
                  `Failed to delete image ${publicId}:`,
                  deleteError,
                );
              }
            }
          }
        }
      }

      await run(`UPDATE posts SET deleted_at = ? WHERE id = ?`, [
        new Date().toISOString(),
        id,
      ]);

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete post",
      });
    }
  },
);

router.get(
  "/my-posts",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const page = (req.query.page as unknown as number) || 1;
      const limit = (req.query.limit as unknown as number) || 20;
      const offset = (page - 1) * limit;
      const user = req.user!;

      const posts = await all<Post>(
        `SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [user.id, limit, offset],
      );

      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const isLiked = !!(await get<Like>(
            `SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`,
            [user.id, post.id],
          ));

          return {
            ...post,
            images: JSON.parse((post.images as unknown as string) || "[]"),
            tags: JSON.parse((post.tags as unknown as string) || "[]"),
            target_departments: JSON.parse(
              (post.target_departments as unknown as string) || "[]",
            ),
            target_years: JSON.parse(
              (post.target_years as unknown as string) || "[]",
            ),
            author: {
              id: user.id,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              department: user.department,
              current_year: user.current_year,
            },
            is_liked: isLiked,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          posts: postsWithDetails,
          pagination: {
            page,
            limit,
            hasMore: posts.length === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user posts",
      });
    }
  },
);

router.get(
  "/my-posts/with-interactions",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      const posts = await all<Post>(
        `SELECT * FROM posts WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
        [user.id],
      );

      const postsWithInteractions = await Promise.all(
        posts.map(async (post) => {
          const likes = await all<{
            user_id: string;
            created_at: string;
          }>(
            `SELECT user_id, created_at FROM likes WHERE target_type = 'post' AND target_id = ? ORDER BY created_at DESC`,
            [post.id],
          );

          const likers = (
            await Promise.all(
              likes.map(async (like) => {
                const likerUser = await get<{
                  id: string;
                  full_name: string;
                  avatar_url: string | null;
                }>(`SELECT id, full_name, avatar_url FROM users WHERE id = ?`, [
                  like.user_id,
                ]);
                return likerUser
                  ? { ...likerUser, liked_at: like.created_at }
                  : null;
              }),
            )
          ).filter(Boolean);

          const comments = await all<{
            id: string;
            user_id: string;
            content: string;
            created_at: string;
          }>(
            `SELECT id, user_id, content, created_at FROM comments WHERE post_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
            [post.id],
          );

          const commenters = (
            await Promise.all(
              comments.map(async (comment) => {
                const commenterUser = await get<{
                  id: string;
                  full_name: string;
                  avatar_url: string | null;
                }>(`SELECT id, full_name, avatar_url FROM users WHERE id = ?`, [
                  comment.user_id,
                ]);
                return commenterUser
                  ? {
                      ...commenterUser,
                      comment_id: comment.id,
                      comment_preview: comment.content.substring(0, 100),
                      commented_at: comment.created_at,
                    }
                  : null;
              }),
            )
          ).filter(Boolean);

          return {
            ...post,
            images: JSON.parse((post.images as unknown as string) || "[]"),
            tags: JSON.parse((post.tags as unknown as string) || "[]"),
            target_departments: JSON.parse(
              (post.target_departments as unknown as string) || "[]",
            ),
            target_years: JSON.parse(
              (post.target_years as unknown as string) || "[]",
            ),
            likers,
            commenters,
            total_likes: likers.length,
            total_comments: commenters.length,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          posts: postsWithInteractions,
          total_posts: posts.length,
        },
      });
    } catch (error) {
      console.error("Error fetching user posts with interactions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user posts with interactions",
      });
    }
  },
);

router.post(
  "/posts/:id/like",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (!canUserSeePost(post, user)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to like this post",
        });
      }

      const existingLike = await get<Like>(
        `SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`,
        [user.id, id],
      );

      if (existingLike) {
        await run(`DELETE FROM likes WHERE id = ?`, [existingLike.id]);
        await run(`UPDATE posts SET like_count = like_count - 1 WHERE id = ?`, [
          id,
        ]);

        res.json({
          success: true,
          message: "Post unliked",
          data: { liked: false },
        });
      } else {
        const likeId = generateId();
        await run(
          `INSERT INTO likes (id, user_id, target_type, target_id) VALUES (?, ?, 'post', ?)`,
          [likeId, user.id, id],
        );
        await run(`UPDATE posts SET like_count = like_count + 1 WHERE id = ?`, [
          id,
        ]);

        if (post.user_id !== user.id) {
          await createNotification(
            post.user_id,
            "like",
            "New like on your post",
            `${user.full_name} liked your post`,
            { postId: id, likeId },
            user.id,
          );
        }

        res.json({
          success: true,
          message: "Post liked",
          data: { liked: true },
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle like",
      });
    }
  },
);

router.post(
  "/posts/:id/share",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const shareId = generateId();
      await run(
        `INSERT INTO shares (id, post_id, user_id, share_type) VALUES (?, ?, ?, 'internal')`,
        [shareId, id, user.id],
      );
      await run(`UPDATE posts SET share_count = share_count + 1 WHERE id = ?`, [
        id,
      ]);

      if (post.user_id !== user.id) {
        await createNotification(
          post.user_id,
          "share",
          "Your post was shared",
          `${user.full_name} shared your post`,
          { postId: id, shareId },
          user.id,
        );
      }

      res.json({
        success: true,
        message: "Post shared successfully",
        data: { shareId },
      });
    } catch (error) {
      console.error("Error sharing post:", error);
      res.status(500).json({
        success: false,
        message: "Failed to share post",
      });
    }
  },
);

router.post(
  "/posts/:id/view",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      await run(
        `UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`,
        [id],
      );

      const updatedPost = await get<Post>(
        "SELECT view_count FROM posts WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "View count incremented",
        data: {
          view_count: updatedPost?.view_count || 0,
        },
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to increment view count",
      });
    }
  },
);

router.get(
  "/posts/:id/comments",
  optionalAuth,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user as SafeUser | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (!canUserSeePost(post, user)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view comments on this post",
        });
      }

      console.log("Fetching comments for post:", id);

      const allComments = await all<
        Comment & { user_name: string; user_avatar: string | null }
      >(
        `SELECT c.*, u.full_name as user_name, u.avatar_url as user_avatar
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ? AND c.deleted_at IS NULL
         ORDER BY c.created_at ASC`,
        [id],
      );

      console.log(
        "Raw comments from DB:",
        allComments.map((c) => ({
          id: c.id,
          content: c.content?.substring(0, 30),
          parent_comment_id: c.parent_comment_id,
        })),
      );

      const commentMap = new Map<string, any>();
      const topLevelComments: any[] = [];

      for (const comment of allComments) {
        const isLiked = user
          ? !!(await get<Like>(
              `SELECT id FROM likes WHERE user_id = ? AND target_type = 'comment' AND target_id = ?`,
              [user.id, comment.id],
            ))
          : false;

        commentMap.set(comment.id, {
          ...comment,
          author: comment.is_anonymous
            ? null
            : {
                id: comment.user_id,
                full_name: comment.user_name,
                avatar_url: comment.user_avatar,
              },
          is_liked: isLiked,
          replies: [],
        });
      }

      allComments.forEach((comment) => {
        const commentWithAuthor = commentMap.get(comment.id);
        if (
          comment.parent_comment_id &&
          commentMap.has(comment.parent_comment_id)
        ) {
          const parentComment = commentMap.get(comment.parent_comment_id);
          commentWithAuthor.parent_reply_to_name =
            parentComment.author?.full_name || "Anonymous";
          parentComment.replies.push(commentWithAuthor);
        } else if (!comment.parent_comment_id) {
          // Only add to topLevelComments if it's actually a top-level comment
          // (Facebook-style: orphaned replies are deleted with parent)
          topLevelComments.push(commentWithAuthor);
        }
        // Note: Comments with parent_comment_id pointing to deleted comments
        // are NOT added since they should have been deleted with their parent
      });

      console.log(
        "Returning top level comments:",
        topLevelComments.map((c) => ({
          id: c.id,
          content: c.content?.substring(0, 30),
          repliesCount: c.replies?.length || 0,
        })),
      );

      res.json({
        success: true,
        data: {
          comments: topLevelComments,
          pagination: {
            page,
            limit,
            hasMore: allComments.length === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch comments",
      });
    }
  },
);

router.post(
  "/posts/:id/comments",
  authenticate,
  [
    body("content").isString().trim().isLength({ min: 1, max: 5000 }),
    body("parent_comment_id").optional().isString(),
    body("anonymity_level").optional().isIn(["full", "icon_only", "anonymous"]),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const user = req.user!;

      if (!user.is_admin && await isFeatureRestricted(user.id, "social_comment")) {
        return res.status(403).json({
          success: false,
          message: "You are restricted from commenting. Please contact admin.",
          code: "RESTRICTED",
        });
      }

      const data: CreateCommentRequest = req.body;

      const post = await get<Post>(
        "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (!canUserSeePost(post, user)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to comment on this post",
        });
      }

      if (post.is_locked) {
        return res.status(403).json({
          success: false,
          message: "This post is locked and cannot receive new comments",
        });
      }

      if (!user.is_admin && containsBadWords(data.content)) {
        const detectedWords = detectBadWords(data.content);

        const sanitizedContent = sanitizeContent(data.content);
        const { is_anonymous, show_profile_icon } = parseAnonymityLevel(
          data.anonymity_level,
        );

        const commentId = generateId();
        const now = new Date().toISOString();

        await run(
          `INSERT INTO comments (
            id, post_id, user_id, parent_comment_id, content, is_anonymous, 
            show_profile_icon, like_count, reply_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
          [
            commentId,
            id,
            user.id,
            data.parent_comment_id || null,
            sanitizedContent,
            is_anonymous ? 1 : 0,
            show_profile_icon ? 1 : 0,
            now,
            now,
          ],
        );

        createUserFlag(
          user.id,
          "social_comment",
          commentId,
          data.content,
          detectedWords,
          3,
        );

        scheduleContentDeletion("comment", commentId, 1);

        return res.status(201).json({
          success: true,
          message:
            "Comment created but flagged for inappropriate content. It will be removed in 1 minute.",
          data: {
            id: commentId,
            flagged: true,
            detected_words: detectedWords,
          },
        });
      }

      const sanitizedContent = sanitizeContent(data.content);
      const { is_anonymous, show_profile_icon } = parseAnonymityLevel(
        data.anonymity_level,
      );

      const commentId = generateId();
      const now = new Date().toISOString();

      console.log("Creating comment:", {
        commentId,
        postId: id,
        userId: user.id,
        parent_comment_id: data.parent_comment_id || null,
        content: sanitizedContent.substring(0, 50),
      });

      await run(
        `INSERT INTO comments (
          id, post_id, user_id, parent_comment_id, content, is_anonymous, 
          show_profile_icon, like_count, reply_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
        [
          commentId,
          id,
          user.id,
          data.parent_comment_id || null,
          sanitizedContent,
          is_anonymous ? 1 : 0,
          show_profile_icon ? 1 : 0,
          now,
          now,
        ],
      );

      // Verify the insert
      const insertedComment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ?",
        [commentId],
      );
      console.log("Inserted comment:", insertedComment);

      await run(
        `UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?`,
        [id],
      );

      if (data.parent_comment_id) {
        await run(
          `UPDATE comments SET reply_count = reply_count + 1 WHERE id = ?`,
          [data.parent_comment_id],
        );

        const parentComment = await get<Comment>(
          "SELECT * FROM comments WHERE id = ?",
          [data.parent_comment_id],
        );
        if (parentComment && parentComment.user_id !== user.id) {
          await createNotification(
            parentComment.user_id,
            "reply",
            "New reply to your comment",
            `${user.full_name} replied to your comment`,
            { postId: id, commentId, parentCommentId: data.parent_comment_id },
            user.id,
          );
        }
      } else {
        if (post.user_id !== user.id) {
          await createNotification(
            post.user_id,
            "comment",
            "New comment on your post",
            `${user.full_name} commented on your post`,
            { postId: id, commentId },
            user.id,
          );
        }
      }

      const comment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ?",
        [commentId],
      );

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: comment,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create comment",
      });
    }
  },
);

router.put(
  "/comments/:id",
  authenticate,
  [body("content").isString().trim().isLength({ min: 1, max: 5000 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const user = req.user!;
      const { content } = req.body;

      const comment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (comment.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to edit this comment",
        });
      }

      const sanitizedContent = sanitizeContent(content);

      await run(
        `UPDATE comments SET content = ?, updated_at = ? WHERE id = ?`,
        [sanitizedContent, new Date().toISOString(), id],
      );

      const updatedComment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComment,
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update comment",
      });
    }
  },
);

router.delete(
  "/comments/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const comment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (comment.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this comment",
        });
      }

      // Facebook-style: Delete the comment and ALL its replies recursively
      const now = new Date().toISOString();

      // Helper function to get all reply IDs recursively
      async function getAllReplyIds(parentId: string): Promise<string[]> {
        const replies = await all<{ id: string }>(
          "SELECT id FROM comments WHERE parent_comment_id = ? AND deleted_at IS NULL",
          [parentId],
        );
        let allIds = replies.map((r) => r.id);
        for (const reply of replies) {
          allIds = allIds.concat(await getAllReplyIds(reply.id));
        }
        return allIds;
      }

      // Get all reply IDs that need to be deleted
      const replyIdsToDelete = await getAllReplyIds(id);
      const totalDeletedCount = 1 + replyIdsToDelete.length; // 1 for parent + all replies

      // Delete the main comment
      await run(`UPDATE comments SET deleted_at = ? WHERE id = ?`, [now, id]);

      // Delete all replies
      for (const replyId of replyIdsToDelete) {
        await run(`UPDATE comments SET deleted_at = ? WHERE id = ?`, [
          now,
          replyId,
        ]);
      }

      // Update post comment count
      await run(
        `UPDATE posts SET comment_count = comment_count - ? WHERE id = ?`,
        [totalDeletedCount, comment.post_id],
      );

      if (comment.parent_comment_id) {
        await run(
          `UPDATE comments SET reply_count = reply_count - 1 WHERE id = ?`,
          [comment.parent_comment_id],
        );
      }

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete comment",
      });
    }
  },
);

router.post(
  "/comments/:id/like",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const comment = await get<Comment>(
        "SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      const existingLike = await get<Like>(
        `SELECT id FROM likes WHERE user_id = ? AND target_type = 'comment' AND target_id = ?`,
        [user.id, id],
      );

      if (existingLike) {
        await run(`DELETE FROM likes WHERE id = ?`, [existingLike.id]);
        await run(
          `UPDATE comments SET like_count = like_count - 1 WHERE id = ?`,
          [id],
        );

        res.json({
          success: true,
          message: "Comment unliked",
          data: { liked: false },
        });
      } else {
        const likeId = generateId();
        await run(
          `INSERT INTO likes (id, user_id, target_type, target_id) VALUES (?, ?, 'comment', ?)`,
          [likeId, user.id, id],
        );
        await run(
          `UPDATE comments SET like_count = like_count + 1 WHERE id = ?`,
          [id],
        );

        if (comment.user_id !== user.id) {
          await createNotification(
            comment.user_id,
            "like",
            "New like on your comment",
            `${user.full_name} liked your comment`,
            { commentId: id, likeId },
            user.id,
          );
        }

        res.json({
          success: true,
          message: "Comment liked",
          data: { liked: true },
        });
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle like",
      });
    }
  },
);

router.get(
  "/notifications",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("unread_only").optional().isBoolean().toBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const page = (req.query.page as unknown as number) || 1;
      const limit = (req.query.limit as unknown as number) || 20;
      const unreadOnly = req.query.unread_only === "true";
      const offset = (page - 1) * limit;
      const user = req.user!;

      let notifications: Notification[];
      if (unreadOnly) {
        notifications = await all<Notification>(
          `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [user.id, limit, offset],
        );
      } else {
        notifications = await all<Notification>(
          `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [user.id, limit, offset],
        );
      }

      const notificationsWithActors = await Promise.all(
        notifications.map(async (notification) => {
          let actor = null;
          if (notification.actor_id) {
            actor = await get<{
              id: string;
              full_name: string;
              avatar_url: string | null;
            }>(`SELECT id, full_name, avatar_url FROM users WHERE id = ?`, [
              notification.actor_id,
            ]);
          }
          return {
            ...notification,
            data: JSON.parse((notification.data as unknown as string) || "{}"),
            actor,
          };
        }),
      );

      const unreadCount = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
        [user.id],
      );

      res.json({
        success: true,
        data: {
          notifications: notificationsWithActors,
          unread_count: unreadCount?.count || 0,
          pagination: {
            page,
            limit,
            hasMore: notifications.length === limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
      });
    }
  },
);

router.post(
  "/notifications/:id/read",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const notification = await get<Notification>(
        `SELECT * FROM notifications WHERE id = ? AND user_id = ?`,
        [id, user.id],
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      await run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
      });
    }
  },
);

router.post(
  "/notifications/read-all",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      await run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [
        user.id,
      ]);

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
      });
    }
  },
);

export default router;
