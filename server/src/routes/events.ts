import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import xss from "xss";
import { body, validationResult } from "express-validator";
import { run, get, all } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import type { ApiResponse } from "../types/index.js";

const router = Router();

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time: string | null;
  images: string;
  category: string;
  max_participants: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: number;
}

interface EventInterest {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  student_id: string | null;
  interested_at: string;
}

interface EventGoing {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  student_id: string | null;
  status: string;
  going_at: string;
}

function sanitizeInput(input: string): string {
  return xss(input.trim());
}

// Admin Routes

// Get all events (admin) - with both interest and going counts
router.get(
  "/admin/events",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const events = await all<
        Event & { interest_count: number; going_count: number }
      >(`
      SELECT e.*,
        COUNT(DISTINCT ei.id) as interest_count,
        COUNT(DISTINCT eg.id) as going_count
      FROM events e
      LEFT JOIN event_interests ei ON e.id = ei.event_id
      LEFT JOIN event_going eg ON e.id = eg.event_id
      GROUP BY e.id
      ORDER BY e.event_date DESC, e.created_at DESC
    `);

      const formattedEvents = events.map((event) => ({
        ...event,
        images: JSON.parse(event.images || "[]"),
        interest_count: event.interest_count || 0,
        going_count: event.going_count || 0,
      }));

      res.json({
        success: true,
        data: formattedEvents,
      } as ApiResponse<typeof formattedEvents>);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch events",
      } as ApiResponse<never>);
    }
  },
);

// Get interested users for an event (admin)
router.get(
  "/admin/events/:id/interested",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const interests = await all<EventInterest>(
        `
      SELECT * FROM event_interests
      WHERE event_id = ?
      ORDER BY interested_at DESC
    `,
        [id],
      );

      res.json({
        success: true,
        data: interests,
      } as ApiResponse<typeof interests>);
    } catch (error) {
      console.error("Error fetching interested users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch interested users",
      } as ApiResponse<never>);
    }
  },
);

// Get going users for an event (admin)
router.get(
  "/admin/events/:id/going",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const going = await all<EventGoing>(
        `
      SELECT * FROM event_going
      WHERE event_id = ?
      ORDER BY going_at DESC
    `,
        [id],
      );

      res.json({
        success: true,
        data: going,
      } as ApiResponse<typeof going>);
    } catch (error) {
      console.error("Error fetching going users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch going users",
      } as ApiResponse<never>);
    }
  },
);

// Export event data to CSV (admin)
router.get(
  "/admin/events/:id/export",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type = "all" } = req.query; // 'all', 'interested', 'going'

      const event = await get<Event>("SELECT * FROM events WHERE id = ?", [id]);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: "Event not found",
        } as ApiResponse<never>);
      }

      let csvContent = "Name,Email,Student ID,Status,Date\n";

      if (type === "all" || type === "interested") {
        const interests = await all<EventInterest>(
          `
        SELECT * FROM event_interests WHERE event_id = ? ORDER BY interested_at DESC
      `,
          [id],
        );

        interests.forEach((user) => {
          csvContent += `"${user.user_name}","${user.user_email || ""}","${user.student_id || ""}","Interested","${user.interested_at}"\n`;
        });
      }

      if (type === "all" || type === "going") {
        const going = await all<EventGoing>(
          `
        SELECT * FROM event_going WHERE event_id = ? ORDER BY going_at DESC
      `,
          [id],
        );

        going.forEach((user) => {
          csvContent += `"${user.user_name}","${user.user_email || ""}","${user.student_id || ""}","Going","${user.going_at}"\n`;
        });
      }

      // Set headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_attendees.csv"`,
      );

      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting event data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export event data",
      } as ApiResponse<never>);
    }
  },
);

// Create event (admin)
router.post(
  "/admin/events",
  authenticate,
  requireAdmin,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("event_date").trim().notEmpty().withMessage("Event date is required"),
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
        location,
        event_date,
        event_time,
        images,
        category,
        max_participants,
      } = req.body;

      const eventId = uuidv4();
      const now = new Date().toISOString();

      await run(
        `INSERT INTO events (id, title, description, location, event_date, event_time, images, category, max_participants, created_by, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          sanitizeInput(title),
          sanitizeInput(description),
          sanitizeInput(location),
          event_date,
          event_time || null,
          JSON.stringify(images || []),
          sanitizeInput(category),
          max_participants || null,
          userId,
          now,
          now,
          1,
        ],
      );

      const newEvent = await get<Event>("SELECT * FROM events WHERE id = ?", [
        eventId,
      ]);

      res.status(201).json({
        success: true,
        data: {
          ...newEvent,
          images: JSON.parse(newEvent?.images || "[]"),
        },
      } as ApiResponse<typeof newEvent>);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create event",
      } as ApiResponse<never>);
    }
  },
);

// Update event (admin)
router.put(
  "/admin/events/:id",
  authenticate,
  requireAdmin,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("event_date").trim().notEmpty().withMessage("Event date is required"),
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

      const { id } = req.params;
      const {
        title,
        description,
        location,
        event_date,
        event_time,
        images,
        category,
        max_participants,
        is_active,
      } = req.body;

      const now = new Date().toISOString();

      await run(
        `UPDATE events SET
          title = ?,
          description = ?,
          location = ?,
          event_date = ?,
          event_time = ?,
          images = ?,
          category = ?,
          max_participants = ?,
          is_active = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          sanitizeInput(title),
          sanitizeInput(description),
          sanitizeInput(location),
          event_date,
          event_time || null,
          JSON.stringify(images || []),
          sanitizeInput(category),
          max_participants || null,
          is_active !== undefined ? (is_active ? 1 : 0) : 1,
          now,
          id,
        ],
      );

      const updatedEvent = await get<Event>(
        "SELECT * FROM events WHERE id = ?",
        [id],
      );

      if (!updatedEvent) {
        return res.status(404).json({
          success: false,
          error: "Event not found",
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        data: {
          ...updatedEvent,
          images: JSON.parse(updatedEvent.images || "[]"),
        },
      } as ApiResponse<typeof updatedEvent>);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update event",
      } as ApiResponse<never>);
    }
  },
);

// Delete event (admin)
router.delete(
  "/admin/events/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Delete related data first
      await run("DELETE FROM event_interests WHERE event_id = ?", [id]);
      await run("DELETE FROM event_going WHERE event_id = ?", [id]);

      // Delete event
      await run("DELETE FROM events WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Event deleted successfully",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete event",
      } as ApiResponse<never>);
    }
  },
);

// Public Routes

// Get active events (public)
router.get("/events", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const events = await all<
      Event & { interest_count: number; going_count: number }
    >(
      `
      SELECT e.*, 
        COUNT(DISTINCT ei.id) as interest_count,
        COUNT(DISTINCT eg.id) as going_count
      FROM events e
      LEFT JOIN event_interests ei ON e.id = ei.event_id
      LEFT JOIN event_going eg ON e.id = eg.event_id
      WHERE e.is_active = 1 AND e.event_date >= date('now')
      GROUP BY e.id
      ORDER BY e.event_date ASC
      LIMIT ? OFFSET ?
    `,
      [limit, offset],
    );

    const formattedEvents = events.map((event) => ({
      ...event,
      images: JSON.parse(event.images || "[]"),
      interest_count: event.interest_count || 0,
      going_count: event.going_count || 0,
    }));

    res.json({
      success: true,
      data: formattedEvents,
    } as ApiResponse<typeof formattedEvents>);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
    } as ApiResponse<never>);
  }
});

// Get single event (public)
router.get("/events/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const event = await get<
      Event & { interest_count: number; going_count: number }
    >(
      `
      SELECT e.*, 
        COUNT(DISTINCT ei.id) as interest_count,
        COUNT(DISTINCT eg.id) as going_count
      FROM events e
      LEFT JOIN event_interests ei ON e.id = ei.event_id
      LEFT JOIN event_going eg ON e.id = eg.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `,
      [id],
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      } as ApiResponse<never>);
    }

    let userInterested = false;
    let userGoing = false;

    if (userId) {
      const interest = await get<EventInterest>(
        "SELECT * FROM event_interests WHERE event_id = ? AND user_id = ?",
        [id, userId],
      );
      userInterested = !!interest;

      const going = await get<EventGoing>(
        "SELECT * FROM event_going WHERE event_id = ? AND user_id = ?",
        [id, userId],
      );
      userGoing = !!going;
    }

    res.json({
      success: true,
      data: {
        ...event,
        images: JSON.parse(event.images || "[]"),
        interest_count: event.interest_count || 0,
        going_count: event.going_count || 0,
        user_interested: userInterested,
        user_going: userGoing,
      },
    } as unknown as ApiResponse<typeof event>);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch event",
    } as ApiResponse<never>);
  }
});

// Register interest in event (authenticated)
router.post(
  "/events/:id/interest",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.full_name || "Anonymous";
      const userEmail = (req as any).user?.email;
      const studentId = (req as any).user?.student_id;

      // Check if event exists and is active
      const event = await get<Event>(
        "SELECT * FROM events WHERE id = ? AND is_active = 1",
        [id],
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          error: "Event not found or inactive",
        } as ApiResponse<never>);
      }

      // Check if user already registered interest
      const existingInterest = await get<EventInterest>(
        "SELECT * FROM event_interests WHERE event_id = ? AND user_id = ?",
        [id, userId],
      );

      if (existingInterest) {
        return res.status(400).json({
          success: false,
          error: "You have already registered interest in this event",
        } as ApiResponse<never>);
      }

      // Register interest
      const interestId = uuidv4();
      await run(
        `INSERT INTO event_interests (id, event_id, user_id, user_name, user_email, student_id, interested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          interestId,
          id,
          userId,
          userName,
          userEmail || null,
          studentId || null,
          new Date().toISOString(),
        ],
      );

      res.status(201).json({
        success: true,
        message: "Interest registered successfully",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error registering interest:", error);
      res.status(500).json({
        success: false,
        error: "Failed to register interest",
      } as ApiResponse<never>);
    }
  },
);

// Remove interest in event (authenticated)
router.delete(
  "/events/:id/interest",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      await run(
        "DELETE FROM event_interests WHERE event_id = ? AND user_id = ?",
        [id, userId],
      );

      res.json({
        success: true,
        message: "Interest removed successfully",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error removing interest:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove interest",
      } as ApiResponse<never>);
    }
  },
);

// Register going to event (authenticated)
router.post(
  "/events/:id/going",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.full_name || "Anonymous";
      const userEmail = (req as any).user?.email;
      const studentId = (req as any).user?.student_id;

      // Check if event exists and is active
      const event = await get<Event>(
        "SELECT * FROM events WHERE id = ? AND is_active = 1",
        [id],
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          error: "Event not found or inactive",
        } as ApiResponse<never>);
      }

      // Check if max participants reached
      if (event.max_participants) {
        const goingCount = await get<{ count: number }>(
          "SELECT COUNT(*) as count FROM event_going WHERE event_id = ?",
          [id],
        );
        if (goingCount && goingCount.count >= event.max_participants) {
          return res.status(400).json({
            success: false,
            error: "Event has reached maximum participants",
          } as ApiResponse<never>);
        }
      }

      // Check if user already marked as going
      const existingGoing = await get<EventGoing>(
        "SELECT * FROM event_going WHERE event_id = ? AND user_id = ?",
        [id, userId],
      );

      if (existingGoing) {
        return res.status(400).json({
          success: false,
          error: "You are already marked as going to this event",
        } as ApiResponse<never>);
      }

      // Register going
      const goingId = uuidv4();
      await run(
        `INSERT INTO event_going (id, event_id, user_id, user_name, user_email, student_id, status, going_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goingId,
          id,
          userId,
          userName,
          userEmail || null,
          studentId || null,
          "going",
          new Date().toISOString(),
        ],
      );

      res.status(201).json({
        success: true,
        message: "You're going to this event!",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error registering going:", error);
      res.status(500).json({
        success: false,
        error: "Failed to register going",
      } as ApiResponse<never>);
    }
  },
);

// Remove going status (authenticated)
router.delete(
  "/events/:id/going",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      await run("DELETE FROM event_going WHERE event_id = ? AND user_id = ?", [
        id,
        userId,
      ]);

      res.json({
        success: true,
        message: "Going status removed",
      } as ApiResponse<never>);
    } catch (error) {
      console.error("Error removing going status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove going status",
      } as ApiResponse<never>);
    }
  },
);

// Get latest events for homepage (public)
router.get("/events/latest/:count", async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.params.count) || 3;

    const events = await all<
      Event & { interest_count: number; going_count: number }
    >(
      `
      SELECT e.*, 
        COUNT(DISTINCT ei.id) as interest_count,
        COUNT(DISTINCT eg.id) as going_count
      FROM events e
      LEFT JOIN event_interests ei ON e.id = ei.event_id
      LEFT JOIN event_going eg ON e.id = eg.event_id
      WHERE e.is_active = 1 AND e.event_date >= date('now')
      GROUP BY e.id
      ORDER BY e.event_date ASC
      LIMIT ?
    `,
      [count],
    );

    const formattedEvents = events.map((event) => ({
      ...event,
      images: JSON.parse(event.images || "[]"),
      interest_count: event.interest_count || 0,
      going_count: event.going_count || 0,
    }));

    res.json({
      success: true,
      data: formattedEvents,
    } as ApiResponse<typeof formattedEvents>);
  } catch (error) {
    console.error("Error fetching latest events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
    } as ApiResponse<never>);
  }
});

export default router;
