import { useTheme } from "./ThemeProvider";

interface NewsSectionProps {
  text?: string;
  speed?: "slow" | "normal" | "fast";
}

export function NewsSection({
  text = "Helping international students at North China University of Water Resources and Electric Power navigate campus life, overcome challenges, and feel at home in China.",
  speed = "normal",
}: NewsSectionProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const speedClasses = {
    slow: "animate-marquee-slow",
    normal: "animate-marquee",
    fast: "animate-marquee-fast",
  };

  return (
    <div
      className={`relative overflow-hidden py-2 ${isDark ? "bg-gradient-to-r from-red-600 via-amber-500 to-red-600" : "bg-gradient-to-r from-red-500 via-amber-400 to-red-500"}`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            News
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className={`whitespace-nowrap ${speedClasses[speed]} text-white font-medium text-sm`}
          >
            <span className="inline-block px-8">{text}</span>
            <span className="inline-block px-8">{text}</span>
            <span className="inline-block px-8">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
