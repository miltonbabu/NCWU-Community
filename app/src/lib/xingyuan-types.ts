export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  thinking?: string;
  timestamp: Date;
  isEdited?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  displayName: string;
  avatar?: string;
  bio?: string;
  model: string;
  theme: "light" | "dark" | "system";
  soundEnabled: boolean;
  sendOnEnter: boolean;
}

export const AI_MODEL = {
  id: "glm-4v-plus",
  name: "GLM-4V Plus",
  description:
    "Premium vision model — advanced image understanding, OCR, reasoning",
} as const;

export type ModelId = typeof AI_MODEL.id;

export function isVisionModel(): boolean {
  return true;
}
