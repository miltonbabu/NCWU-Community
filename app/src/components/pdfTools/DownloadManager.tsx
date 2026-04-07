import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import {
  Download,
  Trash2,
  FileArchive,
  FileImage,
  FileText,
  Package,
} from "lucide-react";
import { downloadFile, formatFileSize } from "@/utils/pdfConverter";
import type { ConvertedFile } from "@/types/pdfTools";

interface DownloadManagerProps {
  files: ConvertedFile[];
  onClear?: () => void;
}

export function DownloadManager({ files, onClear }: DownloadManagerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useTranslation();

  if (files.length === 0) return null;

  const getFileIcon = (format: string) => {
    switch (format) {
      case "docx":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "png":
      case "jpg":
        return <FileImage className="w-5 h-5 text-green-500" />;
      default:
        return <FileArchive className="w-5 h-5 text-amber-500" />;
    }
  };

  const handleDownloadAll = () => {
    files.forEach((file) => {
      setTimeout(() => downloadFile(file.blob, file.name), 100);
    });
  };

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 ${
        isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3
          className={`text-base font-semibold flex items-center gap-2 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          <Package className="w-5 h-5 text-green-500" />
          {t("pdfTools.convertedFiles", "Converted Files")} ({files.length})
        </h3>

        <div className="flex items-center gap-2">
          {files.length > 1 && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-md shadow-green-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              {t("pdfTools.downloadAll", "Download All")}
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("pdfTools.clear", "Clear")}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${
              isDark
                ? "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                : "bg-slate-50 border-slate-200 hover:border-slate-300"
            }`}
          >
            {getFileIcon(file.format)}

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {file.name}
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {formatFileSize(file.size)} •{" "}
                {file.format.toUpperCase()} •{" "}
                {file.createdAt.toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={() => downloadFile(file.blob, file.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:from-blue-600 hover:to-indigo-600 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              {t("pdfTools.download", "Download")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
