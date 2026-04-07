import { Sparkles, Brain } from "lucide-react";

interface ThinkingIndicatorProps {
  deepThink?: boolean;
}

export function ThinkingIndicator({ deepThink = false }: ThinkingIndicatorProps) {
  if (deepThink) {
    return (
      <div className="flex gap-4 py-6 px-4 md:px-8 bg-muted/30">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
          <Brain className="size-4 text-violet-500 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Xing Yuan AI</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <Brain className="size-4 text-violet-500 animate-pulse" />
              <span className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                Deep thinking...
              </span>
              <div className="flex gap-0.5 ml-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-6 px-4 md:px-8">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Sparkles className="size-4 text-accent-foreground animate-pulse" />
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="font-medium text-sm">Xing Yuan AI</span>
        <div className="flex gap-1 items-center">
          <span
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
