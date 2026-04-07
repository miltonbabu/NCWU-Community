import express, { type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { run, get, all } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";
import * as fs from "fs";
import * as path from "path";

const router = express.Router();

// Global search - search across all HSK levels (MUST be before /vocabulary/:level)
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, level, limit = 100 } = req.query;
    const searchQuery = (q as string)?.toLowerCase().trim();
    const levelFilter = level ? parseInt(level as string) : null;
    const resultLimit = parseInt(limit as string) || 100;

    if (!searchQuery) {
      return res.json({
        success: true,
        data: [],
        message: "No search query provided",
      });
    }

    const dataDir = path.join(__dirname, "..", "..", "data", "hsk");
    const results: any[] = [];

    // Map levels to file names
    const levelToFile: Record<number, string> = {
      1: "hsk1_vocabulary.json",
      2: "hsk2_vocabulary.json",
      3: "hsk3_vocabulary.json",
      4: "hsk4_vocabulary.json",
      5: "hsk5_vocabulary.json",
      6: "hsk6_vocabulary.json",
      7: "hsk7-9_vocabulary.json",
      8: "hsk7-9_vocabulary.json",
      9: "hsk7-9_vocabulary.json",
    };

    // Determine which levels to search
    const levelsToSearch = levelFilter ? [levelFilter] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const searchedFiles = new Set<string>();

    for (const hskLevel of levelsToSearch) {
      const fileName = levelToFile[hskLevel];
      if (!fileName || searchedFiles.has(fileName)) {
        continue;
      }
      searchedFiles.add(fileName);

      const filePath = path.join(dataDir, fileName);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const data = fs.readFileSync(filePath, "utf-8");
      const vocabulary = JSON.parse(data);

      // Search in each word
      for (const word of vocabulary) {
        const matchesQuery =
          word.word?.toLowerCase().includes(searchQuery) ||
          word.pinyin?.toLowerCase().includes(searchQuery) ||
          word.english?.toLowerCase().includes(searchQuery) ||
          word.pos?.toLowerCase().includes(searchQuery) ||
          word.id?.toString().includes(searchQuery);

        if (matchesQuery) {
          results.push({
            ...word,
            level: hskLevel,
          });

          // Stop if we've reached the limit
          if (results.length >= resultLimit) {
            break;
          }
        }
      }

      // Stop if we've reached the limit
      if (results.length >= resultLimit) {
        break;
      }
    }

    console.log(`Search for "${searchQuery}" found ${results.length} results`);

    res.json({
      success: true,
      data: results,
      count: results.length,
      message: `Found ${results.length} words matching "${searchQuery}"`,
    });
  } catch (error) {
    console.error("Error searching HSK vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search vocabulary",
    });
  }
});

// Get HSK vocabulary by level
router.get("/vocabulary/:level", async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    // Go up from src/routes to server root, then into data/hsk
    const dataDir = path.join(__dirname, "..", "..", "data", "hsk");

    // Support "all" level to load all HSK vocabulary
    if (level === "all") {
      const allVocabulary: any[] = [];
      for (let i = 1; i <= 9; i++) {
        const filePath = path.join(dataDir, `hsk${i}_vocabulary.json`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, "utf-8");
          const vocabulary = JSON.parse(data);
          // Add level field to each word
          const vocabularyWithLevel = vocabulary.map((word: any) => ({
            ...word,
            level: i,
          }));
          allVocabulary.push(...vocabularyWithLevel);
        }
      }
      console.log(
        "Loaded all HSK levels:",
        allVocabulary.length,
        "total words",
      );
      res.json({
        success: true,
        data: allVocabulary,
        message: `All HSK vocabulary retrieved successfully`,
      });
      return;
    }

    const filePath = path.join(dataDir, `hsk${level}_vocabulary.json`);

    console.log("Looking for vocabulary file at:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("File not found at:", filePath);
      return res.status(404).json({
        success: false,
        message: `HSK ${level} vocabulary not found`,
      });
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const vocabulary = JSON.parse(data);

    // Add level field to each word
    const vocabularyWithLevel = vocabulary.map((word: any) => ({
      ...word,
      level: parseInt(level),
    }));

    console.log("Loaded", vocabularyWithLevel.length, "words for HSK", level);

    res.json({
      success: true,
      data: vocabularyWithLevel,
      message: `HSK ${level} vocabulary retrieved successfully`,
    });
  } catch (error) {
    console.error("Error loading HSK vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load vocabulary",
    });
  }
});

// Get HSK progress for a user
router.get("/progress", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: user_id } = req.user!;
    const progress = await all(`SELECT * FROM hsk_progress WHERE user_id = ?`, [
      user_id,
    ]);
    res.json({
      success: true,
      data: progress,
      message: "HSK progress retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get HSK progress",
    });
  }
});

// Get HSK progress for a specific level
router.get(
  "/progress/:level",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { level } = req.params;
      const progress = await get(
        `SELECT * FROM hsk_progress WHERE user_id = ? AND level = ?`,
        [user_id, level],
      );
      res.json({
        success: true,
        data: progress,
        message: "HSK level progress retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get HSK level progress",
      });
    }
  },
);

// Update HSK progress
router.put("/progress", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: user_id } = req.user!;
    const {
      level,
      words_learned,
      total_words,
      quizzes_taken,
      average_score,
      last_studied,
      mastered_words,
      practicing_words,
    } = req.body;

    const existingProgress = await get(
      `SELECT id FROM hsk_progress WHERE user_id = ? AND level = ?`,
      [user_id, level],
    );

    if (existingProgress) {
      await run(
        `UPDATE hsk_progress SET words_learned = ?, total_words = ?, quizzes_taken = ?, average_score = ?, last_studied = ?, mastered_words = ?, practicing_words = ?, updated_at = datetime('now') WHERE user_id = ? AND level = ?`,
        [
          words_learned,
          total_words,
          quizzes_taken,
          average_score,
          last_studied,
          JSON.stringify(mastered_words),
          JSON.stringify(practicing_words),
          user_id,
          level,
        ],
      );
    } else {
      await run(
        `INSERT INTO hsk_progress (id, user_id, level, words_learned, total_words, quizzes_taken, average_score, last_studied, mastered_words, practicing_words) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          user_id,
          level,
          words_learned,
          total_words,
          quizzes_taken,
          average_score,
          last_studied,
          JSON.stringify(mastered_words),
          JSON.stringify(practicing_words),
        ],
      );
    }

    res.json({
      success: true,
      message: "HSK progress updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update HSK progress",
    });
  }
});

// Get quiz results
router.get(
  "/quiz-results",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const results = await all(
        `SELECT * FROM hsk_quiz_results WHERE user_id = ? ORDER BY created_at DESC`,
        [user_id],
      );
      res.json({
        success: true,
        data: results,
        message: "Quiz results retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get quiz results",
      });
    }
  },
);

// Add quiz result
router.post(
  "/quiz-results",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const {
        quiz_id,
        score,
        total_points,
        correct_answers,
        total_questions,
        time_spent,
        completed_at,
        answers,
      } = req.body;

      await run(
        `INSERT INTO hsk_quiz_results (id, user_id, quiz_id, score, total_points, correct_answers, total_questions, time_spent, completed_at, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          user_id,
          quiz_id,
          score,
          total_points,
          correct_answers,
          total_questions,
          time_spent,
          completed_at,
          JSON.stringify(answers),
        ],
      );

      res.json({
        success: true,
        message: "Quiz result added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to add quiz result",
      });
    }
  },
);

// Get bookmarks
router.get("/bookmarks", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: user_id } = req.user!;
    const bookmarks = await all(
      `SELECT resource_id FROM hsk_bookmarks WHERE user_id = ?`,
      [user_id],
    );
    res.json({
      success: true,
      data: bookmarks.map((b: any) => b.resource_id),
      message: "Bookmarks retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get bookmarks",
    });
  }
});

// Add bookmark
router.post("/bookmarks", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: user_id } = req.user!;
    const { resource_id } = req.body;

    const existing = await get(
      `SELECT id FROM hsk_bookmarks WHERE user_id = ? AND resource_id = ?`,
      [user_id, resource_id],
    );
    if (existing) {
      return res.json({
        success: true,
        message: "Bookmark already exists",
      });
    }

    await run(
      `INSERT INTO hsk_bookmarks (id, user_id, resource_id) VALUES (?, ?, ?)`,
      [uuidv4(), user_id, resource_id],
    );

    res.json({
      success: true,
      message: "Bookmark added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add bookmark",
    });
  }
});

// Remove bookmark
router.delete(
  "/bookmarks/:resource_id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { resource_id } = req.params;

      await run(
        `DELETE FROM hsk_bookmarks WHERE user_id = ? AND resource_id = ?`,
        [user_id, resource_id],
      );

      res.json({
        success: true,
        message: "Bookmark removed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove bookmark",
      });
    }
  },
);

// Get favorite partners
router.get(
  "/favorite-partners",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const favorites = await all(
        `SELECT partner_id FROM hsk_favorite_partners WHERE user_id = ?`,
        [user_id],
      );
      res.json({
        success: true,
        data: favorites.map((f: any) => f.partner_id),
        message: "Favorite partners retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get favorite partners",
      });
    }
  },
);

// Add favorite partner
router.post(
  "/favorite-partners",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { partner_id } = req.body;

      const existing = await get(
        `SELECT id FROM hsk_favorite_partners WHERE user_id = ? AND partner_id = ?`,
        [user_id, partner_id],
      );
      if (existing) {
        return res.json({
          success: true,
          message: "Partner already in favorites",
        });
      }

      await run(
        `INSERT INTO hsk_favorite_partners (id, user_id, partner_id) VALUES (?, ?, ?)`,
        [uuidv4(), user_id, partner_id],
      );

      res.json({
        success: true,
        message: "Partner added to favorites successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to add favorite partner",
      });
    }
  },
);

// Remove favorite partner
router.delete(
  "/favorite-partners/:partner_id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { partner_id } = req.params;

      await run(
        `DELETE FROM hsk_favorite_partners WHERE user_id = ? AND partner_id = ?`,
        [user_id, partner_id],
      );

      res.json({
        success: true,
        message: "Partner removed from favorites successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove favorite partner",
      });
    }
  },
);

// Get word lists
router.get("/word-lists", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: user_id } = req.user!;
    const lists = await all(
      `SELECT * FROM hsk_word_lists WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id],
    );
    res.json({
      success: true,
      data: lists.map((list: any) => ({
        ...list,
        words: JSON.parse(list.words as string),
      })),
      message: "Word lists retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get word lists",
    });
  }
});

// Add word list
router.post(
  "/word-lists",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { name, level, words, completed_at } = req.body;

      await run(
        `INSERT INTO hsk_word_lists (id, user_id, name, level, words, completed_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), user_id, name, level, JSON.stringify(words), completed_at],
      );

      res.json({
        success: true,
        message: "Word list added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to add word list",
      });
    }
  },
);

// Remove word list
router.delete(
  "/word-lists/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { id } = req.params;

      await run(`DELETE FROM hsk_word_lists WHERE id = ? AND user_id = ?`, [
        id,
        user_id,
      ]);

      res.json({
        success: true,
        message: "Word list removed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove word list",
      });
    }
  },
);

// Clear all HSK data for user
router.delete(
  "/clear-data",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;

      await run(`DELETE FROM hsk_progress WHERE user_id = ?`, [user_id]);
      await run(`DELETE FROM hsk_quiz_results WHERE user_id = ?`, [user_id]);
      await run(`DELETE FROM hsk_bookmarks WHERE user_id = ?`, [user_id]);
      await run(`DELETE FROM hsk_favorite_partners WHERE user_id = ?`, [
        user_id,
      ]);
      await run(`DELETE FROM hsk_word_lists WHERE user_id = ?`, [user_id]);
      await run(`DELETE FROM hsk_learned_words WHERE user_id = ?`, [user_id]);
      await run(`DELETE FROM hsk_saved_words WHERE user_id = ?`, [user_id]);

      res.json({
        success: true,
        message: "HSK data cleared successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to clear HSK data",
      });
    }
  },
);

// Get learned words for user
router.get(
  "/learned-words",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      console.log("GET learned words for user:", user_id);
      const learnedWords = await all(
        `SELECT * FROM hsk_learned_words WHERE user_id = ? ORDER BY learned_at DESC`,
        [user_id],
      );
      console.log("Returning", learnedWords.length, "learned words");
      res.json({
        success: true,
        data: learnedWords,
        count: learnedWords.length,
      });
    } catch (error) {
      console.error("Error getting learned words:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get learned words",
      });
    }
  },
);

// Toggle learned word (add/remove)
router.post(
  "/learned-words",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { word_id, word, pinyin, english, pos, level } = req.body;

      console.log("Toggle learned word request:", {
        user_id,
        word_id,
        word,
        level,
      });

      // Check if already learned
      const existing = await get(
        `SELECT * FROM hsk_learned_words WHERE user_id = ? AND word_id = ?`,
        [user_id, word_id],
      );

      if (existing) {
        // Remove if already learned (toggle off)
        await run(
          `DELETE FROM hsk_learned_words WHERE user_id = ? AND word_id = ?`,
          [user_id, word_id],
        );
        console.log("Word removed from learned:", word_id);
        res.json({
          success: true,
          message: "Word removed from learned",
          action: "removed",
        });
      } else {
        // Add to learned - use 0 as default level if not provided
        const wordLevel = level ?? 0;
        await run(
          `INSERT INTO hsk_learned_words (id, user_id, word_id, word, pinyin, english, pos, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            user_id,
            word_id,
            word,
            pinyin,
            english,
            pos || null,
            wordLevel,
          ],
        );
        console.log("Word added to learned:", word_id, "level:", wordLevel);
        res.json({
          success: true,
          message: "Word marked as learned",
          action: "added",
        });
      }
    } catch (error) {
      console.error("Error toggling learned word:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle learned word",
      });
    }
  },
);

// Get saved words for user
router.get(
  "/saved-words",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      console.log("GET saved words for user:", user_id);
      const savedWords = await all(
        `SELECT * FROM hsk_saved_words WHERE user_id = ? ORDER BY saved_at DESC`,
        [user_id],
      );
      console.log("Returning", savedWords.length, "saved words");
      res.json({
        success: true,
        data: savedWords,
        count: savedWords.length,
      });
    } catch (error) {
      console.error("Error getting saved words:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get saved words",
      });
    }
  },
);

// Toggle saved word (add/remove)
router.post(
  "/saved-words",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: user_id } = req.user!;
      const { word_id, word, pinyin, english, pos, level } = req.body;

      console.log("Toggle saved word request:", {
        user_id,
        word_id,
        word,
        level,
      });

      // Check if already saved
      const existing = await get(
        `SELECT * FROM hsk_saved_words WHERE user_id = ? AND word_id = ?`,
        [user_id, word_id],
      );

      if (existing) {
        // Remove if already saved (toggle off)
        await run(
          `DELETE FROM hsk_saved_words WHERE user_id = ? AND word_id = ?`,
          [user_id, word_id],
        );
        console.log("Word removed from saved:", word_id);
        res.json({
          success: true,
          message: "Word removed from saved",
          action: "removed",
        });
      } else {
        // Add to saved - use 0 as default level if not provided
        const wordLevel = level ?? 0;
        await run(
          `INSERT INTO hsk_saved_words (id, user_id, word_id, word, pinyin, english, pos, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            user_id,
            word_id,
            word,
            pinyin,
            english,
            pos || null,
            wordLevel,
          ],
        );
        console.log("Word added to saved:", word_id, "level:", wordLevel);
        res.json({
          success: true,
          message: "Word saved to favorites",
          action: "added",
        });
      }
    } catch (error) {
      console.error("Error toggling saved word:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle saved word",
      });
    }
  },
);

export default router;
