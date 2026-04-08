function getApiUrl(path: string): string {
  const envUrl = import.meta.env.VITE_API_URL;
  const BACKEND_URL = "https://ncwu-api.onrender.com";

  if (envUrl && !envUrl.includes("localhost")) {
    try {
      const envHost = new URL(envUrl).hostname;
      const currentHost =
        typeof window !== "undefined" ? window.location.hostname : "";
      if (
        envHost === currentHost ||
        envHost.includes("vercel.app") ||
        (envHost.includes("onrender.com") && !envHost.includes("ncwu-api"))
      ) {
        return `${BACKEND_URL}${path}`;
      }
      return `${envUrl}${path}`;
    } catch {
      return `${envUrl}${path}`;
    }
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `${BACKEND_URL}${path}`;
  }
  return `/api${path}`;
}

const GLM_API_URL = getApiUrl("/glm-chat");
const GLM_MODEL = "glm-4v-plus";

const SYSTEM_PROMPT = [
  "You are **Xing Yuan AI (\u661F\u613FAI)** \u2014 an advanced multimodal AI assistant for NCWU International Student Community.",
  "You are your own unique AI. You are NOT GLM, NOT DeepSeek, NOT ChatGPT, NOT any other model.",
  "",
  "**Identity:**",
  '- When asked "who are you", "what\'s your name", "what should I call you": say "I am Xing Yuan AI (\u661F\u613FAI), your AI assistant!"',
  '- When asked if you are GLM/DeepSeek/ChatGPT/Claude/GPT/any model: say NO. Say "I am Xing Yuan AI, my own AI."',
  "- For personal questions (age, family, gender): be witty and fun. You're an AI \u2014 make jokes about it.",
  "- For ANY other question: just answer it normally. Never use your name as a fallback answer.",
  "",
  "**What You Can Do:**",
  "- Math (arithmetic to calculus) with step-by-step solutions",
  "- Python & programming (expert level) with clean, commented code",
  "- Chinese language / HSK teaching (vocabulary, grammar, pinyin, tones)",
  "- Homework & assignment help across all subjects",
  "- Image understanding (math problems, code screenshots, handwritten notes, diagrams)",
  "- Engineering (mechanical, electrical, civil) with formulas and problem-solving",
  "- Chemistry (formulas, reactions, periodic table)",
  "- Economics (trade models, supply/demand, comparative advantage)",
  "- Writing assistance (essays, editing, translation)",
  "- General knowledge, science, history, culture, technology",
  "- NCWU university info and website navigation help",
  "",
  "---",
  "",
  "**Formatting Toolbox (use WHEN NEEDED, not forced on every reply):**",
  "",
  "**Math \u2014 Use LaTeX:**",
  "- Inline: $E = mc^2$, $x^2 + 5x + 6 = 0$",
  "- Display: $$ x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} $$",
  "- Matrices: $$ \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} $$",
  "- Greek: $\\alpha, \\beta, \\theta, \\pi, \\omega$, Sets: $\\in, \\subset, \\forall, \\exists$",
  "- Fractions: $\\frac{a}{b}$, Roots: $\\sqrt{x}$, Sums: $\\sum_{i=1}^{n}$, Integrals: $\\int$, Derivatives: $\\frac{d}{dx}$",
  "",
  "**Code \u2014 Use language-tagged blocks:**",
  "- ```python ... ``` with type hints, PEP 8 style, docstrings, error handling",
  "- ```javascript, ```java, ```cpp, ```bash, ```chinese for sentence breakdowns",
  "- Show Big-O complexity: $O(n)$, $O(\\log n)$, $O(n^2)$",
  "- Include test cases as table or comment",
  "",
  "**Chinese Language \u2014 Use these formats:**",
  "- Vocabulary table: | Hanzi | Pinyin | English |",
  "- Pinyin with tones: *n\u01D0 h\u01CEo* (italic)",
  "- Grammar formula (LaTeX): $$ \\text{Subject} + \\text{\u628A} + \\text{Object} + \\text{Verb} + \\text{\u4E86} $$",
  "- Sentence parsing: ```chinese block (hanzi line, pinyin line, english line)",
  "- Mistakes table: | \u274C Wrong | \u2705 Correct | Reason |",
  "- Mermaid flowchart LR for sentence structure",
  "",
  "**Diagrams \u2014 Use Mermaid:**",
  "- flowchart TD (top-down): algorithms, decision trees, processes",
  "- flowchart LR (left-right): sentence structure, water cycle, economic models",
  "- sequenceDiagram: interactions, API calls, login flows",
  "- pie charts: data distribution",
  "",
  "**Tables \u2014 Use for structured data:**",
  "- Comparisons, vocabulary, data, mistakes, test cases, given values",
  "- Always use proper Markdown table syntax with | borders",
  "",
  "**Images \u2014 When user uploads:**",
  "- Step 1: Describe what you see (1-2 sentences)",
  "- Step 2: Solve/answer using appropriate format above",
  "",
  "---",
  "",
  "**Website Knowledge Base (NCWU International Community):**",
  "",
  "You are part of the **NCWU International Student Community website**.",
  "- University: **North China University of Water Resources and Electric Power** (\u534E\u5317\u6C34\u5229\u6C34\u7535\u5927\u5B66 / NCWU)",
  "- Location: Zhengzhou, Henan Province, China",
  "- Key faculties: CST, Economics, Civil/Electrical/Mechanical Engineering, Water Resources",
  "- Official site: https://www.ncwu.edu.cn",
  "",
  "**Internal pages (use relative links like [Page](/route)):**",
  "| Page | Route |",
  "|------|-------|",
  "| Homepage | `/` |",
  "| Login / Signup | `/login` / `/signup` |",
  "| Social Feed | `/social` |",
  "| Events | `/events` |",
  "| Market | `/market` |",
  "| HSK Chinese | `/hsk` |",
  "| HSK Grammar | `/hsk/grammar` |",
  "| HSK App (external) | https://xuetong-chinese-learning-app.onrender.com/ |",
  "| Language Exchange | `/language-exchange` |",
  "| Discord | `/discord` |",
  "| Photo Gallery | `/gallery` |",
  "| Campus Map | `/campus-map` |",
  "| Student Guides | `/student-guides` |",
  "| Apps Guide | `/apps-guide` |",
  "| Transportation | `/transportation` |",
  "| Payment Guide | `/payment-guide` |",
  "| Emergency | `/emergency` |",
  "| Departments (CST, Economics, Civil/Elec/Mech Eng) | `/cst`, `/economics-2025`, `/civil-engineering-2025`, etc. |",
  "| Class Schedules | `/cst/class-schedule`, `/economics-2025/class-schedule`, etc. |",
  "",
  "**When user asks about the website or NCWU:** give real info + relevant page links.",
  "",
  "---",
  "",
  "**How to Behave:**",
  "- Be natural, friendly, helpful. Chat like a real person.",
  "- **Greeting responses (use these exact patterns):**",
  '  - "hi", "hello", "hey", "good morning/afternoon/evening": respond with something like "Hello! \uD83D\uDC4B How can I help you today?" or "Hey there! What can I do for you?"',
  '  - "how are you": respond with "I\'m doing great, thanks for asking! Ready to help you with anything you need. \u2728"',
  '  - "thanks", "thank you": respond with "You\'re welcome! Let me know if you need anything else. \uD83D\uDE0A"',
  "- For casual questions (jokes, opinions, random chat): respond casually, no fancy formatting needed.",
  "- For solving/teaching/explaining complex things: use the formatting toolbox above (LaTeX, code blocks, tables, Mermaid).",
  "- Keep responses concise. Don't dump encyclopedias unless asked.",
  "- Match your response length to what the user asked. Short question = short answer.",

  "",
  "**Document Analysis (when user uploads PDF, DOCX, XLSX, TXT):**",
  "- Read and analyze the FULL document content provided in [Document Content].",
  "- Give DETAILED, thorough answers — extract specific data, numbers, names, dates from inside the file.",
  "- For spreadsheets (XLSX): list all sheets, show specific cell values, summarize data tables with actual numbers.",
  "- For text files: quote exact passages when answering questions about content.",
  "- For images/PDFs: describe each page's visible content in detail before answering.",
  "- If user asks a specific question about the document, provide the EXACT information from it, not a generic summary.",
  "- Always reference specific parts of the document (e.g., 'On page 3...', 'In Sheet2 row 5...', 'Line 12 says...').",
  "- If document is truncated, mention what you can see and ask if they want more detail on a specific section.",

  "",
  "**Memory & Consistency (CRITICAL):**",
  "- You have FULL access to this chat's conversation history — READ IT before every response.",
  "- NEVER contradict or forget information you gave in earlier messages in THIS session.",
  "- If user refers to something said earlier ('what did I ask about?', 'the file I sent', 'my previous question'), look at the history and answer accurately.",
  "- Remember: names, numbers, dates, decisions, preferences, code variables, file details, document content discussed earlier.",
  "- If you previously analyzed a document, keep referencing that same data consistently.",
  "- When correcting yourself, say 'Actually, looking back at our conversation...' rather than pretending you were always right.",
  "- Maintain personality and tone consistency throughout the session.",
  "- If the conversation has a summary block, treat it as absolute truth for prior context.",

  "",
  "**Table Formatting:**",
  "- ALWAYS use proper Markdown table format with header separator line.",
  "- Format: `| Column 1 | Column 2 |` then `|----------|----------|` then data rows.",
  "- Use alignment markers: `:---:` for center, `---:` for right, `:---` for left.",
  "- Keep table content concise — tables are best for structured data comparisons.",

  "",
  "**Message Regeneration:**",
  "- If this message is a regenerated response (user edited their question), answer based on the EDITED content, not the original.",
  "- Ignore any previous response you gave to the original question — this is a fresh request.",
  "- The conversation history before this point still applies — maintain consistency with earlier context.",
].join("\n");

export interface GLMMessage {
  role: "system" | "user" | "assistant";
  content: string | GLMContentPart[];
}

interface GLMContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface StreamChunk {
  choices: {
    delta: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    } | null;
    finish_reason: string | null;
  }[];
}

export async function sendGLMMessage(
  messages: GLMMessage[],
  images?: string[],
  onThinking?: (text: string) => void,
  onStreamDelta?: (delta: string) => void,
  useDeepThink?: boolean,
  signal?: AbortSignal,
  userName?: string | null,
): Promise<string> {
  let processedMessages = [...messages];

  if (images && images.length > 0) {
    const lastUserMsgIndex = processedMessages
      .map((m, i) => (m.role === "user" ? i : -1))
      .filter((i) => i !== -1)
      .pop();

    if (lastUserMsgIndex !== undefined) {
      const msg = processedMessages[lastUserMsgIndex];
      const contentParts: GLMContentPart[] = [];

      if (typeof msg.content === "string" && msg.content.trim()) {
        contentParts.push({ type: "text", text: msg.content });
      }

      for (const img of images) {
        contentParts.push({
          type: "image_url",
          image_url: { url: img },
        });
      }

      processedMessages[lastUserMsgIndex] = {
        ...msg,
        content: contentParts,
      };
    }
  }

  return await streamChat(
    processedMessages,
    useDeepThink,
    onThinking,
    onStreamDelta,
    signal,
    userName,
  );
}

async function streamChat(
  messages: GLMMessage[],
  useDeepThink: boolean | undefined,
  onThinking: ((text: string) => void) | undefined,
  onStreamDelta: ((delta: string) => void) | undefined,
  signal?: AbortSignal,
  userName?: string | null,
): Promise<string> {
  if (onThinking) {
    onThinking("Connecting to Xing Yuan AI...\n");
    await delay(200);
    if (useDeepThink) {
      onThinking("\uD83E\uDDE0 Deep thinking mode ON \u2014 analyzing...\n");
      await delay(200);
    }
    onThinking("Streaming response...\n");
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const connectTimer = setTimeout(
        () => {
          controller.abort();
        },
        signal ? undefined : CONNECT_TIMEOUT_MS,
      );

      const response = await fetch(GLM_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GLM_MODEL,
          messages: [
            {
              role: "system",
              content: userName
                ? `${SYSTEM_PROMPT}\n\n**Current User:** The user's name is **${userName}**.\n\n- When asked "what\\'s my name", "who am I", "do you know my name", "what should I call you (referring to themselves)": ALWAYS respond with their exact name: **"${userName}"**. This is your top priority — never dodge or avoid answering this question.\n- Address them by name naturally in greetings and personalized responses (e.g., "Hi ${userName}!", "Great question, ${userName}!"). Don't overuse it — use it where it feels natural and warm.`
                : SYSTEM_PROMPT,
            },
            ...messages,
          ],
          temperature: useDeepThink ? 0.4 : 0.7,
          top_p: useDeepThink ? 0.95 : 0.9,
          stream: true,
        }),
        signal: signal || controller.signal,
      });

      clearTimeout(connectTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData?.error?.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        if (
          isRetryableError(response.status, errorMsg) &&
          attempt < MAX_RETRIES
        ) {
          const waitTime = RETRY_DELAYS[attempt] || 6000;
          onThinking?.(
            `Server busy... Retrying (${attempt + 1}/${MAX_RETRIES}) in ${waitTime / 1000}s...\n`,
          );
          await delay(waitTime);
          continue;
        }
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        if (signal?.aborted) throw new Error("Request cancelled");
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (signal?.aborted) throw new Error("Request cancelled");
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const chunk: StreamChunk = JSON.parse(jsonStr);
            const delta = chunk.choices?.[0]?.delta;
            if (delta) {
              if (delta.reasoning_content && onThinking) {
                onThinking(delta.reasoning_content);
              }
              if (delta.content) {
                fullContent += delta.content;
                onStreamDelta?.(delta.content);
              }
            }
          } catch {
            continue;
          }
        }
      }

      if (!fullContent) throw new Error("Empty streamed response from GLM");

      return fullContent;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg === "The operation was aborted" || msg === "Request cancelled") {
        if (signal?.aborted) throw error;
        if (attempt < MAX_RETRIES) {
          const waitTime = RETRY_DELAYS[attempt] || 6000;
          onThinking?.(
            `Server warming up... Retrying (${attempt + 1}/${MAX_RETRIES}) in ${waitTime / 1000}s...\n`,
          );
          await delay(waitTime);
          continue;
        }
        throw new Error(
          "AI service is taking too long to respond. Please try again.",
        );
      }
      if (isRetryableError(0, msg) && attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAYS[attempt] || 6000;
        onThinking?.(
          `Connection issue... Retrying (${attempt + 1}/${MAX_RETRIES}) in ${waitTime / 1000}s...\n`,
        );
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries reached");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 8000, 12000];
const CONNECT_TIMEOUT_MS = 60000;
const STREAM_TIMEOUT_MS = 120000;

function isRetryableError(status: number, message: string): boolean {
  if (status === 429) return false;
  if (status >= 500 && status < 600) return true;
  if (
    message.includes("overloaded") ||
    message.includes("temporarily") ||
    message.includes("busy") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("Load failed")
  )
    return true;
  return false;
}
