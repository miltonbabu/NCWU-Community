import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import {
  ArrowRightLeft,
  Sparkles,
  Zap,
  Shield,
  Monitor,
  Home,
  Bot,
  Users,
  MessageCircle,
  BookOpen,
  Gift,
  Lock,
  XCircle,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { PdfUploader } from "@/components/pdfTools/PdfUploader";
import { PdfViewer } from "@/components/pdfTools/PdfViewer";
import { ConversionOptions } from "@/components/pdfTools/ConversionOptions";
import { ConversionProgress } from "@/components/pdfTools/ConversionProgress";
import { DownloadManager } from "@/components/pdfTools/DownloadManager";
import { convertPdf } from "@/utils/pdfConverter";
import type {
  PdfFile,
  ConversionOptions as ConversionOptionsType,
  ConvertedFile,
} from "@/types/pdfTools";
import { DEFAULT_CONVERSION_OPTIONS } from "@/types/pdfTools";

export default function PdfToolsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useTranslation();

  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [options, setOptions] = useState<ConversionOptionsType>(
    DEFAULT_CONVERSION_OPTIONS,
  );
  const [progress, setProgress] = useState({
    currentStep: "",
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    isProcessing: false,
    isCancelled: false,
  });
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const selectedFile =
    pdfFiles.find((f) => f.id === selectedFileId) || pdfFiles[0];
  const totalPages = selectedFile?.pageCount || 0;

  const handleFilesSelected = useCallback(
    (files: PdfFile[]) => {
      setPdfFiles(files);
      if (files.length > 0 && !selectedFileId) {
        setSelectedFileId(files[0].id);
      }
    },
    [selectedFileId],
  );

  const handleConvert = async () => {
    if (!selectedFile || !selectedFile.file) {
      toast.error(t("pdfTools.selectPdf", "Please select a valid PDF file"));
      return;
    }

    setProgress({
      currentStep: t("pdfTools.starting", "Starting conversion..."),
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
      isProcessing: true,
      isCancelled: false,
    });

    try {
      const result = await convertPdf(selectedFile.file, options, (p) =>
        setProgress(p),
      );

      const newConvertedFile: ConvertedFile = {
        id: crypto.randomUUID(),
        pdfId: selectedFile.id,
        name: result.fileName,
        format: options.outputFormat,
        size: result.blob.size,
        blob: result.blob,
        createdAt: new Date(),
      };

      setConvertedFiles((prev) => [...prev, newConvertedFile]);
      toast.success(
        t("pdfTools.conversionSuccess", "{{file}} converted successfully!", {
          file: result.fileName,
        }),
      );
    } catch (err) {
      console.error("Conversion failed:", err);
      toast.error(
        t("pdfTools.conversionError", "Conversion failed. Please try again."),
      );
    } finally {
      setProgress((p) => ({ ...p, isProcessing: false }));
    }
  };

  const handleCancel = () => {
    setProgress((p) => ({ ...p, isCancelled: true, isProcessing: false }));
    toast.info(t("pdfTools.cancelled", "Conversion cancelled"));
  };

  const handleClearFiles = () => {
    setConvertedFiles([]);
  };

  return (
    <div className={`min-h-screen ${isDark ? "" : "bg-slate-50"}`}>
      <nav
        className={
          "sticky top-0 z-50 border-b backdrop-blur-md " +
          (isDark
            ? "bg-slate-900/90 border-slate-700"
            : "bg-white/90 border-slate-200")
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-12 overflow-x-auto no-scrollbar">
            {[
              { icon: Home, label: "Home", to: "/" },
              { icon: Bot, label: "AI", to: "/xingyuan-ai" },
              { icon: Users, label: "Social", to: "/social" },
              {
                icon: MessageCircle,
                label: "Discord",
                to: "/discord",
              },
              {
                icon: BookOpen,
                label: "HSK 2026",
                to: "/hsk-2026",
              },
              {
                icon: Heart,
                label: "Support Us",
                to: "/support",
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all " +
                  (isDark
                    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
              isDark
                ? "bg-gradient-to-br from-red-500/20 to-orange-500/20"
                : "bg-gradient-to-br from-red-50 to-orange-50"
            }`}
          >
            <ArrowRightLeft
              className={`w-8 h-8 ${isDark ? "text-red-400" : "text-red-600"}`}
            />
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("pdfTools.title", "PDF Converter Tools")}
          </h1>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {t(
              "pdfTools.description",
              "Convert PDF files to DOCX or high-quality images with format preservation. All processing happens in your browser - no uploads to any server.",
            )}
          </p>
          <div
            className={
              "inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs font-medium " +
              (isDark
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200")
            }
          >
            <Gift className="w-3.5 h-3.5" />
            {t(
              "pdfTools.valueCompact",
              "100% Free \u00B7 No Limits \u00B7 No Sign-up \u00B7 Files Stay Private",
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-4 space-y-5">
            <PdfUploader
              onFilesSelected={handleFilesSelected}
              currentFiles={pdfFiles}
            />

            {pdfFiles.length > 1 && (
              <div
                className={`rounded-xl border p-4 ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {t("pdfTools.selectFile", "Select File")}
                </label>
                <select
                  value={selectedFileId || ""}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {pdfFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.pageCount && `(${f.pageCount} pages)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ConversionOptions
              options={options}
              onOptionsChange={setOptions}
              totalPages={totalPages}
            />

            <button
              onClick={handleConvert}
              disabled={
                !selectedFile || !selectedFile.file || progress.isProcessing
              }
              className={`w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                progress.isProcessing
                  ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white cursor-wait"
                  : "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02]"
              }`}
            >
              {progress.isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("pdfTools.converting", "Converting...")}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t("pdfTools.convertNow", "Convert Now")}
                </>
              )}
            </button>

            <ConversionProgress progress={progress} onCancel={handleCancel} />
          </div>

          <div className="lg:col-span-8">
            <PdfViewer pdfFile={selectedFile!} />
          </div>
        </div>

        <DownloadManager files={convertedFiles} onClear={handleClearFiles} />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: t("pdfTools.featureFast", "Lightning Fast"),
              description: t(
                "pdfTools.featureFastDesc",
                "All conversion happens locally in your browser. No waiting for server uploads.",
              ),
              color: "from-yellow-500 to-amber-500",
            },
            {
              icon: Shield,
              title: t("pdfTools.featurePrivate", "100% Private"),
              description: t(
                "pdfTools.featurePrivateDesc",
                "Your files never leave your device. No data is sent to any server.",
              ),
              color: "from-green-500 to-emerald-500",
            },
            {
              icon: Monitor,
              title: t("pdfTools.featureQuality", "High Quality"),
              description: t(
                "pdfTools.featureQualityDesc",
                "Preserves formatting, fonts, tables, and images with up to 600 DPI output.",
              ),
              color: "from-blue-500 to-indigo-500",
            },
          ].map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className={`rounded-xl border p-6 transition-all hover:shadow-lg ${
                isDark
                  ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-r ${color}`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
