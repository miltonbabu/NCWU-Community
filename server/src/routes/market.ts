import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import xss from "xss";
import { body, validationResult } from "express-validator";
import { run, get, all } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import type { ApiResponse } from "../types/index.js";

const router = express.Router();

interface MarketPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string;
  category: string;
  tags: string;
  condition: string;
  phone_number: string | null;
  reference_links: string;
  is_sold: number;
  sold_at: string | null;
  auto_remove_at: string | null;
  status: string;
  views: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MarketComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface MarketComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  replies: any[];
  parent_reply_to_name?: string;
  created_at: string;
}

interface MarketBuyRequest {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  original_price: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

function sanitizeInput(input: string): string {
  return xss(input.trim());
}

function isNewPost(createdAt: string): boolean {
  const postDate = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

// Get all active market posts (public)
router.get("/market/posts", async (req: Request, res: Response) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = parseInt(req.query.offset as string) || 0;

    let whereClause =
      "WHERE mp.status = 'active' AND (mp.is_sold = 0 OR (mp.auto_remove_at IS NULL OR datetime('now') < mp.auto_remove_at))";
    const params: (string | number)[] = [];

    if (category) {
      whereClause += " AND mp.category = ?";
      params.push(category as string);
    }

    if (search) {
      whereClause += " AND (mp.title LIKE ? OR mp.description LIKE ?)";
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    if (minPrice !== undefined && minPrice !== "") {
      whereClause += " AND mp.price >= ?";
      params.push(parseFloat(minPrice as string));
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      whereClause += " AND mp.price <= ?";
      params.push(parseFloat(maxPrice as string));
    }

    let orderBy = "mp.created_at DESC";
    if (sort === "price_asc") orderBy = "mp.price ASC";
    else if (sort === "price_desc") orderBy = "mp.price DESC";
    else if (sort === "oldest") orderBy = "mp.created_at ASC";

    const countResult = await get<{ total: number }>(
      `SELECT COUNT(*) as total FROM market_posts mp ${whereClause}`,
      params,
    );
    const total = countResult?.total || 0;

    const posts = await all<
      MarketPost & {
        like_count: number;
        comment_count: number;
        user_name: string;
        user_avatar: string;
      }
    >(
      `
      SELECT mp.*,
        (SELECT COUNT(*) FROM market_likes WHERE post_id = mp.id) as like_count,
        (SELECT COUNT(*) FROM market_comments WHERE post_id = mp.id) as comment_count,
        u.full_name as user_name,
        u.avatar_url as user_avatar
      FROM market_posts mp
      LEFT JOIN users u ON mp.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `,
      [...params, limit, offset],
    );

    const formattedPosts = posts.map((post) => ({
      ...post,
      images: JSON.parse(post.images || "[]"),
      tags: JSON.parse(post.tags || "[]"),
      reference_links: JSON.parse(post.reference_links || "[]"),
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      is_new: isNewPost(post.created_at),
      is_sold: !!post.is_sold,
    }));

    res.json({
      success: true,
      data: formattedPosts,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    } as ApiResponse<typeof formattedPosts> & {
      total: number;
      page: number;
      totalPages: number;
    });
  } catch (error) {
    console.error("Error fetching market posts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market posts",
    } as ApiResponse<never>);
  }
});

// Get single market post (public)
router.get("/market/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await get<
      MarketPost & {
        like_count: number;
        comment_count: number;
        user_name: string;
        user_avatar: string;
      }
    >(
      `
      SELECT mp.*, 
        (SELECT COUNT(*) FROM market_likes WHERE post_id = mp.id) as like_count,
        (SELECT COUNT(*) FROM market_comments WHERE post_id = mp.id) as comment_count,
        u.full_name as user_name,
        u.avatar_url as user_avatar
      FROM market_posts mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.id = ?
    `,
      [id],
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      } as ApiResponse<never>);
    }

    // Increment view count only if more than 1 minute has passed since last view
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    if (!post.last_viewed_at || post.last_viewed_at < oneMinuteAgo) {
      await run(
        "UPDATE market_posts SET views = views + 1, last_viewed_at = ? WHERE id = ?",
        [new Date().toISOString(), id],
      );
      post.views = (post.views || 0) + 1;
    }

    const userId = (req as any).user?.id;
    let userLiked = false;
    if (userId) {
      const like = await get<MarketLike>(
        "SELECT * FROM market_likes WHERE post_id = ? AND user_id = ?",
        [id, userId],
      );
      userLiked = !!like;
    }

    const formattedPost = {
      ...post,
      images: JSON.parse(post.images || "[]"),
      tags: JSON.parse(post.tags || "[]"),
      reference_links: JSON.parse(post.reference_links || "[]"),
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      is_new: isNewPost(post.created_at),
      is_sold: !!post.is_sold,
      user_liked: userLiked,
    };

    res.json({
      success: true,
      data: formattedPost,
    } as ApiResponse<typeof formattedPost>);
  } catch (error) {
    console.error("Error fetching market post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market post",
    } as ApiResponse<never>);
  }
});

// Get latest market posts for homepage (public)
router.get(
  "/market/posts/latest/:count",
  async (req: Request, res: Response) => {
    try {
      const count = parseInt(req.params.count) || 6;

      const posts = await all<
        MarketPost & {
          like_count: number;
          comment_count: number;
          user_name: string;
          user_avatar: string;
        }
      >(
        `
      SELECT mp.*, 
        (SELECT COUNT(*) FROM market_likes WHERE post_id = mp.id) as like_count,
        (SELECT COUNT(*) FROM market_comments WHERE post_id = mp.id) as comment_count,
        u.full_name as user_name,
        u.avatar_url as user_avatar
      FROM market_posts mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.status = 'active' AND (mp.is_sold = 0 OR (mp.auto_remove_at IS NULL OR datetime('now') < mp.auto_remove_at))
      ORDER BY mp.created_at DESC
      LIMIT ?
    `,
        [count],
      );

      const formattedPosts = posts.map((post) => ({
        ...post,
        images: JSON.parse(post.images || "[]"),
        tags: JSON.parse(post.tags || "[]"),
        reference_links: JSON.parse(post.reference_links || "[]"),
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        is_new: isNewPost(post.created_at),
        is_sold: !!post.is_sold,
      }));

      res.json({
        success: true,
        data: formattedPosts,
      } as ApiResponse<typeof formattedPosts>);
    } catch (error) {
      console.error("Error fetching latest market posts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch market posts",
      } as ApiResponse<never>);
    }
  },
);

// Get user's market posts (authenticated)
router.get(
  "/market/my-posts",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      console.log("Fetching market posts for user:", userId);

      const posts = await all<
        MarketPost & {
          like_count: number;
          comment_count: number;
        }
      >(
        `
      SELECT mp.*, 
        (SELECT COUNT(*) FROM market_likes WHERE post_id = mp.id) as like_count,
        (SELECT COUNT(*) FROM market_comments WHERE post_id = mp.id) as comment_count
      FROM market_posts mp
      WHERE mp.user_id = ?
      ORDER BY mp.created_at DESC
    `,
        [userId],
      );

      console.log("Found posts:", posts.length);
      console.log("Posts data:", JSON.stringify(posts, null, 2));

      const formattedPosts = posts.map((post) => ({
        ...post,
        images: JSON.parse(post.images || "[]"),
        tags: JSON.parse(post.tags || "[]"),
        reference_links: JSON.parse(post.reference_links || "[]"),
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        is_new: isNewPost(post.created_at),
        is_sold: !!post.is_sold,
      }));

      res.json({
        success: true,
        message: "User posts fetched successfully",
        data: formattedPosts,
      });
    } catch (error) {
      console.error("Error fetching user market posts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user posts",
      } as ApiResponse<never>);
    }
  },
);

// Create market post (authenticated)
router.post(
  "/market/posts",
  authenticate,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
  ],
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
      const {
        title,
        description,
        price,
        category,
        tags,
        condition,
        phone_number,
        reference_links,
        images,
      } = req.body;

      const postId = uuidv4();
      const now = new Date().toISOString();

      await run(
        `INSERT INTO market_posts (id, user_id, title, description, price, currency, images, category, tags, condition, phone_number, reference_links, status, views, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          postId,
          userId,
          sanitizeInput(title),
          sanitizeInput(description),
          price,
          "RMB",
          JSON.stringify(images || []),
          sanitizeInput(category),
          JSON.stringify(tags || []),
          condition || "good",
          phone_number || null,
          JSON.stringify(reference_links || []),
          "active",
          0,
          now,
          now,
        ],
      );

      const newPost = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [postId],
      );

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: {
          ...newPost,
          images: JSON.parse(newPost?.images || "[]"),
          tags: JSON.parse(newPost?.tags || "[]"),
          reference_links: JSON.parse(newPost?.reference_links || "[]"),
        },
      } as ApiResponse<typeof newPost>);
    } catch (error) {
      console.error("Error creating market post:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create post",
      } as ApiResponse<never>);
    }
  },
);

// Update market post (authenticated - owner only)
router.put(
  "/market/posts/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const post = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      if (post.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You can only edit your own posts",
        } as ApiResponse<never>);
      }

      const {
        title,
        description,
        price,
        category,
        tags,
        condition,
        phone_number,
        reference_links,
        images,
        status,
      } = req.body;
      const now = new Date().toISOString();

      await run(
        `UPDATE market_posts SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          category = COALESCE(?, category),
          tags = COALESCE(?, tags),
          condition = COALESCE(?, condition),
          phone_number = COALESCE(?, phone_number),
          reference_links = COALESCE(?, reference_links),
          images = COALESCE(?, images),
          status = COALESCE(?, status),
          updated_at = ?
         WHERE id = ?`,
        [
          title ? sanitizeInput(title) : null,
          description ? sanitizeInput(description) : null,
          price !== undefined ? price : null,
          category ? sanitizeInput(category) : null,
          tags ? JSON.stringify(tags) : null,
          condition || null,
          phone_number !== undefined ? phone_number : null,
          reference_links ? JSON.stringify(reference_links) : null,
          images ? JSON.stringify(images) : null,
          status || null,
          now,
          id,
        ],
      );

      const updatedPost = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Post updated successfully",
        data: {
          ...updatedPost,
          images: JSON.parse(updatedPost?.images || "[]"),
          tags: JSON.parse(updatedPost?.tags || "[]"),
          reference_links: JSON.parse(updatedPost?.reference_links || "[]"),
        },
      } as ApiResponse<typeof updatedPost>);
    } catch (error) {
      console.error("Error updating market post:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update post",
      } as ApiResponse<never>);
    }
  },
);

// Delete market post (authenticated - owner only)
router.delete(
  "/market/posts/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const post = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      if (post.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You can only delete your own posts",
        } as ApiResponse<never>);
      }

      // Delete related data
      await run("DELETE FROM market_likes WHERE post_id = ?", [id]);
      await run("DELETE FROM market_comments WHERE post_id = ?", [id]);
      await run("DELETE FROM market_buy_requests WHERE post_id = ?", [id]);
      await run("DELETE FROM market_posts WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Post deleted successfully",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error deleting market post:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete post",
      } as ApiResponse<never>);
    }
  },
);

// Mark post as sold (authenticated - owner only)
router.post(
  "/market/posts/:id/sold",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const post = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      if (post.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You can only mark your own posts as sold",
        } as ApiResponse<never>);
      }

      if (post.is_sold) {
        return res.status(400).json({
          success: false,
          error: "Post is already marked as sold",
        } as ApiResponse<never>);
      }

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      await run(
        `UPDATE market_posts SET is_sold = 1, sold_at = ?, auto_remove_at = ?, updated_at = ? WHERE id = ?`,
        [now.toISOString(), oneHourLater.toISOString(), now.toISOString(), id],
      );

      res.json({
        success: true,
        message:
          "Post marked as sold. It will be automatically removed in 1 hour.",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error marking post as sold:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark post as sold",
      } as ApiResponse<never>);
    }
  },
);

// Like/Unlike post (authenticated)
router.post(
  "/market/posts/:id/like",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const post = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      const existingLike = await get<MarketLike>(
        "SELECT * FROM market_likes WHERE post_id = ? AND user_id = ?",
        [id, userId],
      );

      if (existingLike) {
        return res.status(400).json({
          success: false,
          error: "You have already liked this post",
        } as ApiResponse<never>);
      }

      const likeId = uuidv4();
      await run(
        `INSERT INTO market_likes (id, post_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
        [likeId, id, userId, new Date().toISOString()],
      );

      res.status(201).json({
        success: true,
        message: "Post liked",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({
        success: false,
        error: "Failed to like post",
      } as ApiResponse<never>);
    }
  },
);

router.delete(
  "/market/posts/:id/like",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      await run("DELETE FROM market_likes WHERE post_id = ? AND user_id = ?", [
        id,
        userId,
      ]);

      res.json({
        success: true,
        message: "Like removed",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({
        success: false,
        error: "Failed to unlike post",
      } as ApiResponse<never>);
    }
  },
);

// Get comments for post
router.get(
  "/market/posts/:id/comments",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const comments = await all<
        MarketComment & { user_name: string; user_avatar: string }
      >(
        `
      SELECT mc.*, u.full_name as user_name, u.avatar_url as user_avatar
      FROM market_comments mc
      LEFT JOIN users u ON mc.user_id = u.id
      WHERE mc.post_id = ?
      ORDER BY mc.created_at ASC
    `,
        [id],
      );

      console.log(
        "Raw comments from DB:",
        JSON.stringify(
          comments.map((c) => ({
            id: c.id,
            parent_id: c.parent_id,
            content: c.content?.substring(0, 20),
          })),
          null,
          2,
        ),
      );

      // Organize comments into threads (parent -> replies)
      const commentMap = new Map<string, any>();
      const topLevelComments: any[] = [];

      comments.forEach((comment) => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });

      comments.forEach((comment) => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parentComment = commentMap.get(comment.parent_id);
          comment.parent_reply_to_name = parentComment.user_name || "Anonymous";
          parentComment.replies.push(comment);
          console.log(
            `Nesting comment ${comment.id} under parent ${comment.parent_id}`,
          );
        } else {
          topLevelComments.push(comment);
          console.log(
            `Adding comment ${comment.id} as top-level (parent_id: ${comment.parent_id})`,
          );
        }
      });

      console.log("Top-level comments count:", topLevelComments.length);
      console.log(
        "Top-level comments structure:",
        JSON.stringify(
          topLevelComments.map((c) => ({
            id: c.id,
            repliesCount: c.replies?.length,
          })),
          null,
          2,
        ),
      );

      res.json({
        success: true,
        data: topLevelComments,
      } as ApiResponse<typeof topLevelComments>);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch comments",
      } as ApiResponse<never>);
    }
  },
);

// Add comment (authenticated)
router.post(
  "/market/posts/:id/comments",
  authenticate,
  [body("content").trim().notEmpty().withMessage("Comment is required")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array()[0].msg,
        } as ApiResponse<never>);
      }

      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { content, parent_id } = req.body;

      console.log("Add comment request:", {
        postId: id,
        userId,
        parent_id,
        content: content?.substring(0, 30),
      });

      const post = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      // If replying to a comment, verify parent comment exists
      if (parent_id) {
        const parentComment = await get<MarketComment>(
          "SELECT * FROM market_comments WHERE id = ? AND post_id = ?",
          [parent_id, id],
        );
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            error: "Parent comment not found",
          } as ApiResponse<never>);
        }
      }

      const commentId = uuidv4();
      const now = new Date().toISOString();

      console.log("Inserting comment:", {
        commentId,
        postId: id,
        userId,
        content: content?.substring(0, 30),
        parent_id,
      });

      await run(
        `INSERT INTO market_comments (id, post_id, user_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [commentId, id, userId, sanitizeInput(content), parent_id || null, now],
      );

      // Verify the insert
      const insertedComment = await get<MarketComment>(
        "SELECT * FROM market_comments WHERE id = ?",
        [commentId],
      );
      console.log("Inserted comment from DB:", {
        id: insertedComment?.id,
        parent_id: insertedComment?.parent_id,
        content: insertedComment?.content?.substring(0, 20),
      });

      // Get user info for response
      const user = await get<{ full_name: string; avatar_url: string }>(
        "SELECT full_name, avatar_url FROM users WHERE id = ?",
        [userId],
      );

      res.status(201).json({
        success: true,
        message: parent_id ? "Reply added" : "Comment added",
        data: {
          id: commentId,
          post_id: id,
          user_id: userId,
          content: sanitizeInput(content),
          parent_id: parent_id || null,
          created_at: now,
          user_name: user?.full_name || "Anonymous",
          user_avatar: user?.avatar_url || null,
          replies: [],
        },
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add comment",
      } as ApiResponse<never>);
    }
  },
);

// Delete comment (authenticated, owner only)
router.delete(
  "/market/posts/:id/comments/:commentId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id, commentId } = req.params;
      const userId = (req as any).user?.id;

      const comment = await get<MarketComment>(
        "SELECT * FROM market_comments WHERE id = ? AND post_id = ?",
        [commentId, id],
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        } as ApiResponse<never>);
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You can only delete your own comments",
        } as ApiResponse<never>);
      }

      await run("DELETE FROM market_comments WHERE id = ?", [commentId]);

      res.json({
        success: true,
        message: "Comment deleted",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete comment",
      } as ApiResponse<never>);
    }
  },
);

// Buy via Admin request (authenticated)
router.post(
  "/market/posts/:id/buy-request",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const post = await get<MarketPost>(
        "SELECT * FROM market_posts WHERE id = ?",
        [id],
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        } as ApiResponse<never>);
      }

      if (post.is_sold) {
        return res.status(400).json({
          success: false,
          error: "This item is already sold",
        } as ApiResponse<never>);
      }

      if (post.user_id === userId) {
        return res.status(400).json({
          success: false,
          error: "You cannot buy your own item",
        } as ApiResponse<never>);
      }

      const platformFee = post.price * 0.07;
      const totalAmount = post.price + platformFee;
      const requestId = uuidv4();
      const now = new Date().toISOString();

      await run(
        `INSERT INTO market_buy_requests (id, post_id, buyer_id, seller_id, original_price, platform_fee, total_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          requestId,
          id,
          userId,
          post.user_id,
          post.price,
          platformFee,
          totalAmount,
          "pending",
          now,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Buy request submitted. An admin will process your request.",
        data: {
          id: requestId,
          original_price: post.price,
          platform_fee: platformFee,
          total_amount: totalAmount,
        },
      });
    } catch (error) {
      console.error("Error creating buy request:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create buy request",
      } as ApiResponse<never>);
    }
  },
);

// Admin Routes

// Get all market posts (admin)
router.get(
  "/admin/market/posts",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const posts = await all<
        MarketPost & {
          like_count: number;
          comment_count: number;
          user_name: string;
          user_avatar: string;
        }
      >(`
      SELECT mp.*, 
        (SELECT COUNT(*) FROM market_likes WHERE post_id = mp.id) as like_count,
        (SELECT COUNT(*) FROM market_comments WHERE post_id = mp.id) as comment_count,
        u.full_name as user_name,
        u.avatar_url as user_avatar
      FROM market_posts mp
      LEFT JOIN users u ON mp.user_id = u.id
      ORDER BY mp.created_at DESC
    `);

      const formattedPosts = posts.map((post) => ({
        ...post,
        images: JSON.parse(post.images || "[]"),
        tags: JSON.parse(post.tags || "[]"),
        reference_links: JSON.parse(post.reference_links || "[]"),
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        is_new: isNewPost(post.created_at),
        is_sold: !!post.is_sold,
      }));

      res.json({
        success: true,
        message: "Posts fetched successfully",
        data: {
          posts: formattedPosts,
          pagination: {
            page: 1,
            limit: 100,
            total: formattedPosts.length,
            totalPages: 1,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admin market posts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch posts",
      } as ApiResponse<never>);
    }
  },
);

// Get all buy requests (admin)
router.get(
  "/admin/market/buy-requests",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const requests = await all<
        MarketBuyRequest & {
          buyer_name: string;
          seller_name: string;
          post_title: string;
        }
      >(`
      SELECT mbr.*, 
        u1.full_name as buyer_name,
        u2.full_name as seller_name,
        mp.title as post_title
      FROM market_buy_requests mbr
      LEFT JOIN users u1 ON mbr.buyer_id = u1.id
      LEFT JOIN users u2 ON mbr.seller_id = u2.id
      LEFT JOIN market_posts mp ON mbr.post_id = mp.id
      ORDER BY mbr.created_at DESC
    `);

      res.json({
        success: true,
        message: "Buy requests fetched successfully",
        data: {
          requests: requests,
          pagination: {
            page: 1,
            limit: 100,
            total: requests.length,
            totalPages: 1,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching buy requests:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch buy requests",
      } as ApiResponse<never>);
    }
  },
);

// Process buy request (admin)
router.put(
  "/admin/market/buy-requests/:id",
  authenticate,
  requireAdmin,
  [
    body("status")
      .isIn(["approved", "rejected", "completed"])
      .withMessage("Invalid status"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      const adminId = (req as any).user?.id;

      const request = await get<MarketBuyRequest>(
        "SELECT * FROM market_buy_requests WHERE id = ?",
        [id],
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          error: "Request not found",
        } as ApiResponse<never>);
      }

      const now = new Date().toISOString();

      await run(
        `UPDATE market_buy_requests SET status = ?, admin_notes = ?, processed_by = ?, processed_at = ? WHERE id = ?`,
        [status, admin_notes || null, adminId, now, id],
      );

      res.json({
        success: true,
        message: "Request updated successfully",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error updating buy request:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update request",
      } as ApiResponse<never>);
    }
  },
);

// Delete market post (admin)
router.delete(
  "/admin/market/posts/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await run("DELETE FROM market_likes WHERE post_id = ?", [id]);
      await run("DELETE FROM market_comments WHERE post_id = ?", [id]);
      await run("DELETE FROM market_buy_requests WHERE post_id = ?", [id]);
      await run("DELETE FROM market_posts WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Post deleted successfully",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error deleting market post:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete post",
      } as ApiResponse<never>);
    }
  },
);

// Get market statistics (admin)
router.get(
  "/admin/market/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const totalPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_posts",
      );
      const activePosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_posts WHERE status = 'active' AND is_sold = 0",
      );
      const soldPosts = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_posts WHERE is_sold = 1",
      );
      const totalBuyRequests = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_buy_requests",
      );
      const pendingBuyRequests = await get<{ count: number }>(
        "SELECT COUNT(*) as count FROM market_buy_requests WHERE status = 'pending'",
      );
      const totalRevenue = await get<{ total: number }>(
        "SELECT SUM(platform_fee) as total FROM market_buy_requests WHERE status = 'completed'",
      );

      res.json({
        success: true,
        message: "Market statistics",
        data: {
          totalPosts: totalPosts?.count || 0,
          activePosts: activePosts?.count || 0,
          soldPosts: soldPosts?.count || 0,
          totalBuyRequests: totalBuyRequests?.count || 0,
          pendingBuyRequests: pendingBuyRequests?.count || 0,
          totalRevenue: totalRevenue?.total || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching market stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch stats",
      } as ApiResponse<never>);
    }
  },
);

export default router;
