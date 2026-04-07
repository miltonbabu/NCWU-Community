import { useTheme } from "@/components/ThemeProvider";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import type { ConversionProgress } from "@/types/pdfTools";

interface Props {
  progress: ConversionProgress;
  onCancel?: () => void;
}

export function ConversionProgress({ progress, onCancel }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!progress.isProcessing && progress.percentage === 0) return null;

  return (
    <div className={"rounded-xl border p-5 space-y-4 " + (isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200") + (progress.percentage === 100 ? " ring-2 ring-green-500/20" : "")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {progress.percentage === 100 ? (<CheckCircle2 className="w-5 h-5 text-green-500" />) : (<Loader2 className="w-5 h-5 text-blue-500 animate-spin" />)}
          <div>
            <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-slate-900")}>{progress.currentStep}</p>
            {progress.totalPages > 0 && (<p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>Page {progress.currentPage}/{progress.totalPages}</p>)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={"text-sm font-bold tabular-nums " + (progress.percentage === 100 ? "text-green-500" : isDark ? "text-blue-400" : "text-blue-600")}>{progress.percentage}%</span>
          {progress.isProcessing && onCancel && (<button onClick={onCancel} className={"p-1.5 rounded-lg transition-colors " + (isDark ? "hover:bg-slate-700 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-700")}><X className="w-4 h-4" /></button>)}
        </div>
      </div>
      <div className={"h-2.5 rounded-full overflow-hidden " + (isDark ? "bg-slate-700" : "bg-slate-200")}>
        <div className={"h-full rounded-full transition-all duration-500 ease-out " + (progress.percentage === 100 ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400")} style={{ width: progress.percentage + "%", transition: progress.percentage > 90 ? "width 0.8s ease-out" : "width 0.3s ease-out" }} />
      </div>
    </div>
  );
}
