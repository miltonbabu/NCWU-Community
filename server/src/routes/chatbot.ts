import { Router, Request, Response } from "express";
import {
  knowledgeBase,
  fallbackResponse,
  defaultSuggestions,
  type KnowledgeEntry,
} from "../data/chatbotKnowledge.js";

const router = Router();

interface UserInfo {
  name?: string | null;
  department?: string | null;
  enrollmentYear?: number | null;
  currentYear?: number | null;
  isLoggedIn?: boolean;
}

interface ChatRequest {
  message: string;
  userInfo?: UserInfo;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDepartmentRoute(
  dept: string | null | undefined,
  year: number | null | undefined,
): { link: string; linkText: string } | null {
  if (!dept) return null;

  const d = dept.toLowerCase().trim();
  const y = year || new Date().getFullYear();

  const routes: Record<string, { base: string; hasYear: boolean }> = {
    "computer science & technology": { base: "/cst", hasYear: false },
    cst: { base: "/cst", hasYear: false },
    "computer science": { base: "/cst", hasYear: false },
    economics: { base: "/economics-2025", hasYear: false },
    "civil engineering": { base: `/civil-engineering-${y}`, hasYear: true },
    civil: { base: `/civil-engineering-${y}`, hasYear: true },
    "electrical engineering": {
      base: `/electrical-engineering-${y}`,
      hasYear: true,
    },
    electrical: { base: `/electrical-engineering-${y}`, hasYear: true },
    ee: { base: `/electrical-engineering-${y}`, hasYear: true },
    "mechanical engineering": {
      base: `/mechanical-engineering-${y}`,
      hasYear: true,
    },
    mechanical: { base: `/mechanical-engineering-${y}`, hasYear: true },
    mech: { base: `/mechanical-engineering-${y}`, hasYear: true },
  };

  for (const [key, val] of Object.entries(routes)) {
    if (d.includes(key)) {
      return {
        link: val.hasYear ? val.base.replace("${y}", String(y)) : val.base,
        linkText: `Visit ${dept} Page →`,
      };
    }
  }

  return null;
}

function getScheduleLink(
  dept: string | null | undefined,
  year: number | null | undefined,
): { link: string; linkText: string } | null {
  if (!dept) return null;

  const d = dept.toLowerCase().trim();

  if (d.includes("cst") || d.includes("computer")) {
    return {
      link: "/cst/class-schedule",
      linkText: "View Your Class Schedule →",
    };
  }
  if (d.includes("economics") || d.includes("econ")) {
    return {
      link: "/economics-2025/class-schedule",
      linkText: "View Your Schedule →",
    };
  }
  if (d.includes("civil")) {
    return {
      link: `/civil-engineering-${year || 2025}`,
      linkText: "Your Schedule →",
    };
  }
  if (d.includes("electrical") || d.includes("ee")) {
    return {
      link: `/electrical-engineering-${year || 2025}`,
      linkText: "Your Schedule →",
    };
  }
  if (d.includes("mechanical") || d.includes("mech")) {
    return {
      link: `/mechanical-engineering-${year || 2025}`,
      linkText: "Your Schedule →",
    };
  }

  return null;
}

function personalizeAnswer(answer: string, user: UserInfo): string {
  let result = answer;

  if (user.name && !user.isLoggedIn === false) {
    result = result.replace(/^(👋|Hi|Hello)/i, `👋 **Hi ${user.name}!**`);
  }

  if (user.department && user.isLoggedIn !== false) {
    const dept = user.department;

    result = result.replace(
      /\*\*CST Department\*\*/gi,
      `**${dept} Department**`,
    );
    result = result.replace(/CST Class Schedule/gi, `${dept} Class Schedule`);
    result = result.replace(/CST department/gi, `${dept} department`);
    result = result.replace(/CST program/gi, `${dept} program`);
    result = result.replace(/CST students/gi, `${dept} students`);
    result = result.replace(/CST page/gi, `${dept} page`);
    result = result.replace(/your CST/gi, `your ${dept}`);
    result = result.replace(/the CST/gi, `the ${dept}`);
    result = result.replace(/Computer Science & Technology/gi, dept);
    result = result.replace(/computer science/gi, dept);
    result = result.replace(/CS department/gi, `${dept} department`);
    result = result.replace(/\bCST\b/gi, dept);
  }

  if (user.enrollmentYear && user.isLoggedIn !== false) {
    result = result.replace(/\(2023\)/gi, `(${user.enrollmentYear})`);
    result = result.replace(/\(2024\)/gi, `(${user.enrollmentYear})`);
    result = result.replace(/\(2025\)/gi, `(${user.enrollmentYear})`);
  }

  return result;
}

function calculateRelevance(
  input: string,
  entry: KnowledgeEntry,
): { score: number; entry: KnowledgeEntry } {
  const normalizedInput = normalizeText(input);
  const inputWords = normalizedInput.split(" ").filter((w) => w.length > 0);

  let score = 0;

  for (const keyword of entry.keywords) {
    const nk = normalizeText(keyword);

    if (normalizedInput === nk || nk === normalizedInput) {
      score += 10;
    }

    if (normalizedInput.includes(nk) || nk.includes(normalizedInput)) {
      score += 5;
    }

    if (nk.length <= normalizedInput.length && normalizedInput.includes(nk)) {
      score += 3;
    }

    for (const word of inputWords) {
      if (word === nk || nk === word) {
        score += 8;
      }
      if (word.length >= 2 && (word.includes(nk) || nk.includes(word))) {
        score += 2;
      }
    }
  }

  for (const question of entry.questions) {
    const nq = normalizeText(question);

    if (normalizedInput === nq || nq === normalizedInput) {
      score += 15;
      continue;
    }

    if (normalizedInput.includes(nq) || nq.includes(normalizedInput)) {
      score += 8;
      continue;
    }

    const qWords = nq.split(" ").filter((w) => w.length > 1);
    let matchingWords = 0;
    for (const word of inputWords) {
      if (word.length < 2) continue;
      if (
        qWords.some(
          (qw) => qw === word || qw.includes(word) || word.includes(qw),
        )
      ) {
        matchingWords++;
        score += 2;
      }
    }

    if (matchingWords > 0 && qWords.length > 0) {
      const ratio = matchingWords / qWords.length;
      if (ratio >= 0.6) {
        score += 5;
      } else if (ratio >= 0.3) {
        score += 2;
      }
    }
  }

  return { score, entry };
}

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, userInfo }: ChatRequest = req.body;

    console.log(`\n🤖 [CHATBOT] Received message: "${message}"`);
    console.log(`🤖 [CHATBOT] User info:`, JSON.stringify(userInfo || {}));

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const trimmedMessage = message.trim();
    const user: UserInfo = userInfo || {};

    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message is too long (max 500 characters)",
      });
    }

    const results = knowledgeBase.map((entry) =>
      calculateRelevance(trimmedMessage, entry),
    );

    results.sort((a, b) => b.score - a.score);

    console.log(
      `🤖 [CHATBOT] Top 3 matches:` +
        `\n   1. ${results[0].entry.id} (score: ${results[0].score})` +
        `\n   2. ${results[1]?.entry.id} (score: ${results[1]?.score ?? 0})` +
        `\n   3. ${results[2]?.entry.id} (score: ${results[2]?.score ?? 0})`,
    );

    const bestMatch = results[0];

    if (bestMatch && bestMatch.score >= 0.5) {
      let answer = bestMatch.entry.answer;
      let link = bestMatch.entry.link;
      let linkText = bestMatch.entry.linkText;

      answer = personalizeAnswer(answer, user);

      if (
        user.department &&
        user.isLoggedIn &&
        (bestMatch.entry.id?.includes("schedule") ||
          bestMatch.entry.id?.includes("cst-department") ||
          trimmedMessage.toLowerCase().includes("my class") ||
          trimmedMessage.toLowerCase().includes("my schedule") ||
          trimmedMessage.toLowerCase().includes("timetable"))
      ) {
        const schedLink = getScheduleLink(user.department, user.enrollmentYear);
        if (schedLink) {
          link = schedLink.link;
          linkText = schedLink.linkText;
        }

        if (!answer.includes(user.department!)) {
          answer = `📅 **Your Personalized Class Schedule**\n\nBased on your profile (**${user.department}**, ${user.enrollmentYear ? `${user.enrollmentYear}` : ""} batch), here's your schedule:\n\n${answer}`;
        }
      }

      if (
        user.department &&
        user.isLoggedIn &&
        bestMatch.entry.category === "departments"
      ) {
        const deptLink = getDepartmentRoute(
          user.department,
          user.enrollmentYear,
        );
        if (deptLink) {
          link = deptLink.link;
          linkText = deptLink.linkText;
        }
      }

      console.log(
        `🤖 [CHATBOT] ✅ MATCH FOUND: "${bestMatch.entry.id}" (confidence: ${Math.min(bestMatch.score / 20, 1).toFixed(2)})`,
      );

      return res.json({
        success: true,
        data: {
          message: answer,
          link: link || undefined,
          linkText: linkText || undefined,
          confidence: Math.min(bestMatch.score / 20, 1),
          suggestions:
            bestMatch.entry.followUpQuestions || fallbackResponse.suggestions,
        },
      });
    }

    console.log(
      `🤖 [CHATBOT] ❌ NO MATCH - using fallback (best score: ${bestMatch?.score ?? 0})`,
    );

    return res.json({
      success: true,
      data: {
        message: fallbackResponse.message,
        link: fallbackResponse.link,
        linkText: fallbackResponse.linkText,
        confidence: 0,
        suggestions: fallbackResponse.suggestions,
      },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/suggestions", (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      suggestions: defaultSuggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load suggestions",
    });
  }
});

export default router;
