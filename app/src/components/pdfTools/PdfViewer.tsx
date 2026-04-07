import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PdfFile } from "@/types/pdfTools";

interface PdfViewerProps {
  pdfFile: PdfFile | undefined;
}

export function PdfViewer({ pdfFile }: PdfViewerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      if (!pdfFile || !pdfFile.file) return;

      setIsLoading(true);
      setLoadError(null);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (!cancelled) setLoadError("Failed to load PDF. The file may be corrupted or password-protected.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfFile]);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || currentPage <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const page = await (pdfDoc as { getPage: (n: number) => Promise<unknown> }).getPage(currentPage);
      const viewport = (page as unknown as { getViewport: (opts: { scale: number }) => { width: number; height: number } }).getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await (page as unknown as { render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } }).render({
        canvasContext: ctx,
        viewport,
      }).promise;
    } catch (err) {
      console.error("Failed to render page:", err);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  if (!pdfFile || !pdfFile.file) {
    return (
      <div
        className={
          "flex items-center justify-center h-full min-h-[400px] rounded-xl border-2 border-dashed " +
          (isDark
            ? "border-slate-700 bg-slate-800/30 text-slate-500"
            : "border-slate-200 bg-slate-50 text-slate-400")
        }
      >
        <p className="text-sm">{t("pdfTools.noPdf", "Upload a PDF to preview")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={
          "flex flex-col items-center justify-center h-full min-h-[400px] rounded-xl border " +
          (isDark
            ? "bg-red-900/20 border-red-800 text-red-400"
            : "bg-red-50 border-red-200 text-red-600")
        }
      >
        <p className="text-sm font-medium p-4 text-center">{loadError}</p>
        <p className="text-xs opacity-70 px-4 pb-4">
          You can still convert this file using the Convert button.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-xl overflow-hidden border " +
        (isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")
      }
    >
      <div
        className={
          "flex items-center justify-between px-4 py-2 border-b " +
          (isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")
        }
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={
              "p-1.5 rounded-lg transition-colors disabled:opacity-30 " +
              (isDark
                ? "hover:bg-slate-700 text-slate-300"
                : "hover:bg-slate-200 text-slate-600")
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span
            className={
              "text-sm font-medium min-w-[80px] text-center " +
              (isDark ? "text-slate-300" : "text-slate-700")
            }
          >
            {t("pdfTools.pageOf", "{{current}} / {{total}}", {
              current: currentPage,
              total: totalPages || "?",
            })}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={
              "p-1.5 rounded-lg transition-colors disabled:opacity-30 " +
              (isDark
                ? "hover:bg-slate-700 text-slate-300"
                : "hover:bg-slate-200 text-slate-600")
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className={
              "p-1.5 rounded-lg transition-colors " +
              (isDark
                ? "hover:bg-slate-700 text-slate-300"
                : "hover:bg-slate-200 text-slate-600")
            }
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span
            className={
              "text-xs min-w-[45px] text-center " +
              (isDark ? "text-slate-400" : "text-slate-500")
            }
          >
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className={
              "p-1.5 rounded-lg transition-colors " +
              (isDark
                ? "hover:bg-slate-700 text-slate-300"
                : "hover:bg-slate-200 text-slate-600")
            }
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[600px] flex items-start justify-center p-4 bg-slate-100 dark:bg-slate-950">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        )}
      </div>
    </div>
  );
}
