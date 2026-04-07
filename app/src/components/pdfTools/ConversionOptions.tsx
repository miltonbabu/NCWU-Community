import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Image,
  Settings,
  CheckSquare,
  Square,
  Palette,
  Monitor,
} from "lucide-react";
import type {
  ConversionOptions,
  DocxOptions,
  ImageOptions,
  OutputFormat,
  ImageQuality,
  ImageColorMode,
} from "@/types/pdfTools";

interface ConversionOptionsProps {
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  totalPages: number;
}

export function ConversionOptions({
  options,
  onOptionsChange,
  totalPages,
}: ConversionOptionsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useTranslation();

  const updateOutputFormat = (format: OutputFormat) => {
    onOptionsChange({ ...options, outputFormat: format });
  };

  const updateDocxOptions = (updates: Partial<DocxOptions>) => {
    onOptionsChange({
      ...options,
      docxOptions: { ...options.docxOptions, ...updates },
    });
  };

  const updateImageOptions = (updates: Partial<ImageOptions>) => {
    onOptionsChange({
      ...options,
      imageOptions: { ...options.imageOptions, ...updates },
    });
  };

  const inputClasses = `w-full px-3 py-2 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
    isDark
      ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  const labelClasses = `block text-sm font-medium mb-1.5 ${
    isDark ? "text-slate-300" : "text-slate-700"
  }`;

  return (
    <div
      className={`rounded-xl border p-5 space-y-5 ${
        isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      <h3
        className={`text-base font-semibold flex items-center gap-2 ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        <Settings className="w-5 h-5 text-red-500" />
        {t("pdfTools.conversionSettings", "Conversion Settings")}
      </h3>

      <div className="flex gap-2">
        {(["docx", "png", "jpg"] as OutputFormat[]).map((format) => (
          <button
            key={format}
            onClick={() => updateOutputFormat(format)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              options.outputFormat === format
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                : isDark
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {format === "docx" ? (
              <FileText className="w-4 h-4" />
            ) : (
              <Image className="w-4 h-4" />
            )}
            {format.toUpperCase()}
          </button>
        ))}
      </div>

      {options.outputFormat === "docx" && (
        <div className="space-y-4 pt-2">
          <h4
            className={`text-sm font-semibold uppercase tracking-wide ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            DOCX Options
          </h4>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`relative w-5 h-5 rounded border-2 transition-colors ${
                options.docxOptions.preserveFormatting
                  ? "bg-red-500 border-red-500"
                  : isDark
                  ? "border-slate-600 group-hover:border-slate-500"
                  : "border-slate-300 group-hover:border-slate-400"
              }`}
            >
              {options.docxOptions.preserveFormatting && (
                <CheckSquare className="absolute inset-0 w-full h-full p-0.5 text-white" />
              )}
              {!options.docxOptions.preserveFormatting && (
                <Square className="absolute inset-0 w-full h-full p-0.5 opacity-0" />
              )}
            </div>
            <input
              type="checkbox"
              checked={options.docxOptions.preserveFormatting}
              onChange={(e) =>
                updateDocxOptions({ preserveFormatting: e.target.checked })
              }
              className="sr-only"
            />
            <span
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {t("pdfTools.preserveFormatting", "Preserve Formatting")}
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`relative w-5 h-5 rounded border-2 transition-colors ${
                options.docxOptions.includeImages
                  ? "bg-red-500 border-red-500"
                  : isDark
                  ? "border-slate-600 group-hover:border-slate-500"
                  : "border-slate-300 group-hover:border-slate-400"
              }`}
            >
              {options.docxOptions.includeImages && (
                <CheckSquare className="absolute inset-0 w-full h-full p-0.5 text-white" />
              )}
            </div>
            <input
              type="checkbox"
              checked={options.docxOptions.includeImages}
              onChange={(e) =>
                updateDocxOptions({ includeImages: e.target.checked })
              }
              className="sr-only"
            />
            <span
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {t("pdfTools.includeImages", "Include Images")}
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`relative w-5 h-5 rounded border-2 transition-colors ${
                options.docxOptions.extractTables
                  ? "bg-red-500 border-red-500"
                  : isDark
                  ? "border-slate-600 group-hover:border-slate-500"
                  : "border-slate-300 group-hover:border-slate-400"
              }`}
            >
              {options.docxOptions.extractTables && (
                <CheckSquare className="absolute inset-0 w-full h-full p-0.5 text-white" />
              )}
            </div>
            <input
              type="checkbox"
              checked={options.docxOptions.extractTables}
              onChange={(e) =>
                updateDocxOptions({ extractTables: e.target.checked })
              }
              className="sr-only"
            />
            <span
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {t("pdfTools.extractTables", "Detect & Extract Tables")}
            </span>
          </label>

          <div>
            <label className={labelClasses}>
              {t("pdfTools.pageRange", "Page Range")}
            </label>
            <select
              value={
                typeof options.docxOptions.pageRange === "string"
                  ? "all"
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value === "all") {
                  updateDocxOptions({ pageRange: "all" });
                }
              }}
              className={inputClasses}
            >
              <option value="all">
                {t("pdfTools.allPages", "All Pages ({{total}})", {
                  total: totalPages,
                })}
              </option>
              <option value="custom">
                {t("pdfTools.customRange", "Custom Range")}
              </option>
            </select>
            {typeof options.docxOptions.pageRange !== "string" && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={options.docxOptions.pageRange.start}
                  onChange={(e) =>
                    updateDocxOptions({
                      pageRange: {
                        start: parseInt(e.target.value) || 1,
                        end:
                          typeof options.docxOptions.pageRange !== "string"
                            ? options.docxOptions.pageRange.end
                            : totalPages,
                      },
                    })
                  }
                  placeholder="From"
                  className={`${inputClasses} w-24`}
                />
                <span
                  className={`self-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  -
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={
                    typeof options.docxOptions.pageRange !== "string"
                      ? options.docxOptions.pageRange.end
                      : totalPages
                  }
                  onChange={(e) =>
                    updateDocxOptions({
                      pageRange:
                        typeof options.docxOptions.pageRange === "string"
                          ? { start: 1, end: parseInt(e.target.value) || totalPages }
                          : {
                              ...options.docxOptions.pageRange,
                              end: parseInt(e.target.value) || totalPages,
                            },
                    })
                  }
                  placeholder="To"
                  className={`${inputClasses} w-24`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(options.outputFormat === "png" || options.outputFormat === "jpg") && (
        <div className="space-y-4 pt-2">
          <h4
            className={`text-sm font-semibold uppercase tracking-wide ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Image Options
          </h4>

          <div>
            <label className={labelClasses}>
              {t("pdfTools.quality", "Quality / DPI")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "standard", label: "Standard\n150 DPI" },
                  { key: "hd", label: "HD\n300 DPI" },
                  { key: "ultra", label: "Ultra\n600 DPI" },
                ] as Array<{ key: ImageQuality; label: string }>
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => updateImageOptions({ quality: key })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-pre-line leading-tight ${
                    options.imageOptions.quality === key
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : isDark
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasses}>{t("pdfTools.colorMode", "Color Mode")}</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "color" as ImageColorMode, label: "Color", icon: Palette },
                  { key: "grayscale" as ImageColorMode, label: "Grayscale", icon: Monitor },
                ]
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => updateImageOptions({ colorMode: key })}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    options.imageOptions.colorMode === key
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : isDark
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasses}>
              {t("pdfTools.pageRange", "Page Range")}
            </label>
            <select
              value={
                typeof options.imageOptions.pageRange === "string"
                  ? "all"
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value === "all") {
                  updateImageOptions({ pageRange: "all" });
                }
              }}
              className={inputClasses}
            >
              <option value="all">
                {t("pdfTools.allPages", "All Pages ({{total}})", {
                  total: totalPages,
                })}
              </option>
              <option value="custom">
                {t("pdfTools.customRange", "Custom Range")}
              </option>
            </select>
            {typeof options.imageOptions.pageRange !== "string" && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={options.imageOptions.pageRange.start}
                  onChange={(e) =>
                    updateImageOptions({
                      pageRange: {
                        start: parseInt(e.target.value) || 1,
                        end:
                          typeof options.imageOptions.pageRange !== "string"
                            ? options.imageOptions.pageRange.end
                            : totalPages,
                      },
                    })
                  }
                  placeholder="From"
                  className={`${inputClasses} w-24`}
                />
                <span
                  className={`self-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  -
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={
                    typeof options.imageOptions.pageRange !== "string"
                      ? options.imageOptions.pageRange.end
                      : totalPages
                  }
                  onChange={(e) =>
                    updateImageOptions({
                      pageRange:
                        typeof options.imageOptions.pageRange === "string"
                          ? { start: 1, end: parseInt(e.target.value) || totalPages }
                          : {
                              ...options.imageOptions.pageRange,
                              end: parseInt(e.target.value) || totalPages,
                            },
                    })
                  }
                  placeholder="To"
                  className={`${inputClasses} w-24`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
