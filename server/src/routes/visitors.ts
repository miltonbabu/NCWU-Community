import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { run, get, all } from "../config/database.js";
import { optionalAuth } from "../middleware/auth.js";
import type { ApiResponse } from "../types/index.js";

const router = Router();

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

router.post("/track", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { page_visited, referrer, visit_type } = req.body;
    const ip = getClientIp(req);
    const userId = req.userId || null;

    await run(
      `INSERT INTO visitors (id, user_id, ip_address, user_agent, page_visited, referrer, visit_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        ip,
        req.headers["user-agent"] || "unknown",
        page_visited || null,
        referrer || null,
        visit_type || "page_view",
      ],
    );

    res.json({
      success: true,
      message: "Visit tracked",
    } as ApiResponse);
  } catch (error) {
    console.error("Track visitor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse);
  }
});

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const totalVisits = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM visitors",
    );
    const uniqueVisitors = await get<{ count: number }>(
      "SELECT COUNT(DISTINCT ip_address) as count FROM visitors",
    );
    const visitsToday = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM visitors WHERE date(visited_at) = date('now')",
    );

    res.json({
      success: true,
      data: {
        totalVisits: totalVisits?.count || 0,
        uniqueVisitors: uniqueVisitors?.count || 0,
        visitsToday: visitsToday?.count || 0,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get visitor stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as ApiResponse);
  }
});

export default router;
