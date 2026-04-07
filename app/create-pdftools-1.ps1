$base = "e:\PYTHON PROJECT UNI\Ncwu Int. Community\Kimi_Agent_Build+Class+Schedule\Site\app\src"

# types/pdfTools.ts
Set-Content -Path "$base\types\pdfTools.ts" -Value @'
export type OutputFormat = "docx" | "png" | "jpg";
export type ImageQuality = "standard" | "hd" | "ultra";
export type ImageColorMode = "color" | "grayscale";

export interface PdfFile { id: string; file: File; name: string; size: number; pageCount: number | null; status: "uploading" | "ready" | "processing" | "completed" | "error"; error?: string; }
export interface DocxOptions { preserveFormatting: boolean; includeImages: boolean; extractTables: boolean; pageRange: "all" | { start: number; end: number }; }
export interface ImageOptions { format: "png" | "jpg"; quality: ImageQuality; pageRange: "all" | { start: number; end: number }; colorMode: ImageColorMode; }
export interface ConversionOptions { outputFormat: OutputFormat; docxOptions: DocxOptions; imageOptions: ImageOptions; }
export interface ConversionProgress { currentStep: string; currentPage: number; totalPages: number; percentage: number; isProcessing: boolean; isCancelled: boolean; }
export interface ConvertedFile { id: string; pdfId: string; name: string; format: OutputFormat; size: number; blob: Blob; createdAt: Date; }

export const QUALITY_DPI_MAP: Record<ImageQuality, number> = { standard: 150, hd: 300, ultra: 600 };
export const DEFAULT_DOCX_OPTIONS: DocxOptions = { preserveFormatting: true, includeImages: true, extractTables: true, pageRange: "all" };
export const DEFAULT_IMAGE_OPTIONS: ImageOptions = { format: "png", quality: "hd", pageRange: "all", colorMode: "color" };
export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = { outputFormat: "docx", docxOptions: DEFAULT_DOCX_OPTIONS, imageOptions: DEFAULT_IMAGE_OPTIONS };
'@

Write-Host "Types created"
