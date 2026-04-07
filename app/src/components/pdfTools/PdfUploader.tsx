import { useState, useCallback, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/utils/pdfConverter";
import type { PdfFile } from "@/types/pdfTools";

interface PdfUploaderProps {
  onFilesSelected: (files: PdfFile[]) => void;
  currentFiles: PdfFile[];
  maxFileSize?: number;
}

export function PdfUploader({
  onFilesSelected,
  currentFiles,
  maxFileSize = 50 * 1024 * 1024,
}: PdfUploaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const pdfFiles: PdfFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
          errors.push(`${file.name}: Not a PDF file`);
          continue;
        }
        if (file.size > maxFileSize) {
          errors.push(
            `${file.name}: File too large (max ${formatFileSize(maxFileSize)})`,
          );
          continue;
        }

        pdfFiles.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          pageCount: null,
          status: "ready",
        });
      }

      if (errors.length > 0) {
        toast.error(errors.join("\n"));
      }

      if (pdfFiles.length === 0) return;

      setIsProcessing(true);
      const newFiles = [...currentFiles, ...pdfFiles];
      onFilesSelected(newFiles);

      for (const pdfFile of pdfFiles) {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          const ab = await pdfFile.file.arrayBuffer();
          const doc = await pdfjsLib.getDocument({ data: ab }).promise;
          const pc = doc.numPages;
          onFilesSelected(
            newFiles.map((f) =>
              f.id === pdfFile.id ? { ...f, pageCount: pc } : f,
            ),
          );
        } catch {
          console.warn(
            "Could not count pages for",
            pdfFile.name,
            "- continuing anyway",
          );
        }
      }

      setIsProcessing(false);
      toast.success(
        t("pdfTools.uploadSuccess", "{{count}} PDF file(s) uploaded", {
          count: pdfFiles.length,
        }),
      );
    },
    [currentFiles, maxFileSize, onFilesSelected, t],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      onFilesSelected(currentFiles.filter((f) => f.id !== id));
    },
    [currentFiles, onFilesSelected],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 " +
          (isDragOver
            ? isDark
              ? "border-blue-400 bg-blue-500/10 scale-[1.02]"
              : "border-blue-500 bg-blue-50 scale-[1.02]"
            : isDark
              ? "border-slate-600 hover:border-slate-500 bg-slate-800/50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50")
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p
              className={
                "text-sm font-medium " +
                (isDark ? "text-slate-300" : "text-slate-600")
              }
            >
              {t("pdfTools.parsing", "Parsing PDF...")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={
                "p-4 rounded-full " +
                (isDragOver
                  ? "bg-blue-500/20"
                  : isDark
                    ? "bg-slate-700"
                    : "bg-slate-200")
              }
            >
              <Upload
                className={
                  "w-8 h-8 " +
                  (isDragOver
                    ? "text-blue-400"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500")
                }
              />
            </div>
            <div>
              <p
                className={
                  "text-base font-semibold " +
                  (isDark ? "text-white" : "text-slate-900")
                }
              >
                {t(
                  "pdfTools.dropZoneTitle",
                  "Drop PDF files here or click to browse",
                )}
              </p>
              <p
                className={
                  "text-sm mt-1 " +
                  (isDark ? "text-slate-400" : "text-slate-500")
                }
              >
                {t("pdfTools.dropZoneSubtitle", "Maximum file size: {{size}}", {
                  size: formatFileSize(maxFileSize),
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {currentFiles.length > 0 && (
        <div className="space-y-2">
          {currentFiles.map((pdfFile) => (
            <div
              key={pdfFile.id}
              className={
                "flex items-center gap-3 p-3 rounded-lg border transition-colors " +
                (isDark
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white border-slate-200")
              }
            >
              <FileText
                className={
                  "w-5 h-5 flex-shrink-0 " +
                  (pdfFile.status === "error"
                    ? "text-red-500"
                    : "text-blue-500")
                }
              />
              <div className="flex-1 min-w-0">
                <p
                  className={
                    "text-sm font-medium truncate " +
                    (isDark ? "text-white" : "text-slate-900")
                  }
                >
                  {pdfFile.name}
                </p>
                <p
                  className={
                    "text-xs " + (isDark ? "text-slate-400" : "text-slate-500")
                  }
                >
                  {formatFileSize(pdfFile.size)}
                  {pdfFile.pageCount &&
                    ` \u2022 ${pdfFile.pageCount} ${t("pdfTools.pages", "pages")}`}
                </p>
              </div>
              <button
                onClick={() => removeFile(pdfFile.id)}
                className={
                  "p-1 rounded-md transition-colors flex-shrink-0 " +
                  (isDark
                    ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-700")
                }
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
