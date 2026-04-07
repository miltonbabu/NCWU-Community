import { Router, Request, Response } from "express";

const router = Router();

const GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GLM_API_KEY = process.env.GLM_API_KEY;
const GLM_MODEL = process.env.GLM_MODEL || "glm-4v-plus";

interface GLMMessage {
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

router.post("/glm-chat", async (req: Request, res: Response) => {
  try {
    if (!GLM_API_KEY) {
      console.error("[GLM] GLM_API_KEY not configured in environment");
      return res.status(500).json({
        success: false,
        error: "AI service not configured. Please add GLM_API_KEY to server .env",
      });
    }

    const { model, messages, temperature, top_p, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required",
      });
    }

    console.log(`[GLM] Request received - Model: ${model || GLM_MODEL}, Messages: ${messages.length}, Stream: ${stream}`);

    const response = await fetch(GLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || GLM_MODEL,
        messages,
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.9,
        stream: stream ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GLM] API Error ${response.status}:`, errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `GLM API Error: ${response.status} - ${errorText}`,
      });
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body?.getReader();
      if (!reader) {
        return res.status(500).json({
          success: false,
          error: "Failed to get response stream",
        });
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const jsonStr = trimmed.slice(6).trim();
            if (jsonStr === "[DONE]") {
              res.write("data: [DONE]\n\n");
              continue;
            }

            try {
              const chunk: StreamChunk = JSON.parse(jsonStr);
              const delta = chunk.choices?.[0]?.delta;
              
              if (delta) {
                const responseData: StreamChunk = {
                  choices: [{
                    delta: {
                      role: delta.role,
                      content: delta.content,
                      reasoning_content: delta.reasoning_content,
                    },
                    finish_reason: chunk.choices[0]?.finish_reason || null,
                  }],
                };
                res.write(`data: ${JSON.stringify(responseData)}\n\n`);
              }
            } catch {
              res.write(`${trimmed}\n\n`);
            }
          }
        }

        res.end();
        console.log("[GLM] Stream completed successfully");
      } catch (streamError) {
        console.error("[GLM] Stream error:", streamError);
        res.end();
      }
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error("[GLM] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
