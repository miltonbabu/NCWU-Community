import * as pdfjsLib from "pdfjs-dist";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  convertInchesToTwip,
} from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import type {
  ConversionOptions,
  DocxOptions,
  ImageOptions,
  ConversionProgress,
} from "@/types/pdfTools";
import { QUALITY_DPI_MAP } from "@/types/pdfTools";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function loadPdfDocument(
  file: File,
): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await loadPdfDocument(file);
  return pdf.numPages;
}

interface TextItemWithPosition {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  isBold?: boolean;
  isItalic?: boolean;
}

async function extractPageContent(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  scale = 1.5,
) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const textContent = await page.getTextContent();
  const textItems: TextItemWithPosition[] = [];

  for (const item of textContent.items) {
    const ti = item as unknown as Record<string, unknown>;
    if (typeof ti.str === "string" && Array.isArray(ti.transform)) {
      const tx = ti.transform as number[];
      textItems.push({
        text: ti.str,
        x: tx[4],
        y: viewport.height - tx[5],
        width: typeof ti.width === "number" ? ti.width : 0,
        height: typeof ti.height === "number" ? ti.height : 0,
        fontName: typeof ti.fontName === "string" ? ti.fontName : "Helvetica",
        fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]),
        isBold: /bold/i.test(
          typeof ti.fontName === "string" ? ti.fontName : "",
        ),
        isItalic: /italic/i.test(
          typeof ti.fontName === "string" ? ti.fontName : "",
        ),
      });
    }
  }
  return {
    pageNumber: pageNum,
    textItems,
    images: [],
    pageWidth: viewport.width,
    pageHeight: viewport.height,
  };
}

function groupTextIntoParagraphs(items: TextItemWithPosition[], tol = 3) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) =>
    Math.abs(a.y - b.y) < tol ? a.x - b.x : a.y - b.y,
  );
  const result: TextItemWithPosition[][] = [];
  let line = [sorted[0]];
  let y = sorted[0].y;
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - y) <= tol) {
      line.push(sorted[i]);
    } else {
      if (line.length) result.push([...line].sort((a, b) => a.x - b.x));
      line = [sorted[i]];
      y = sorted[i].y;
    }
  }
  if (line.length) result.push([...line].sort((a, b) => a.x - b.x));
  return result;
}

function detectTables(paragraphs: TextItemWithPosition[][]) {
  if (paragraphs.length < 2)
    return {
      tableRows: [] as TextItemWithPosition[][],
      nonTableParagraphs: paragraphs,
    };
  const avg = paragraphs.reduce((s, p) => s + p.length, 0) / paragraphs.length;
  const tables: TextItemWithPosition[][] = [];
  const other: TextItemWithPosition[][] = [];
  for (const p of paragraphs) {
    if (p.length >= Math.max(2, Math.floor(avg * 0.7))) tables.push(p);
    else other.push(p);
  }
  return tables.length >= 2
    ? { tableRows: tables, nonTableParagraphs: other }
    : {
        tableRows: [] as TextItemWithPosition[][],
        nonTableParagraphs: paragraphs,
      };
}

async function createDocxFromPdf(
  pdfFile: File,
  options: DocxOptions,
  onProgress?: (p: ConversionProgress) => void,
): Promise<Blob> {
  const pdfDoc = await loadPdfDocument(pdfFile);
  const totalPages = pdfDoc.numPages;
  const start = options.pageRange === "all" ? 1 : options.pageRange.start;
  const end = options.pageRange === "all" ? totalPages : options.pageRange.end;
  const children: Array<Paragraph | Table | PageBreak> = [];

  for (let p = start; p <= end; p++) {
    onProgress?.({
      currentStep: "Extracting...",
      currentPage: p,
      totalPages: end - start + 1,
      percentage: Math.round(((p - start) / (end - start + 1)) * 100),
      isProcessing: true,
      isCancelled: false,
    });
    const content = await extractPageContent(pdfDoc, p);
    const paras = groupTextIntoParagraphs(content.textItems);
    let procParas = paras;
    let tRows: TextItemWithPosition[][] = [];
    if (options.extractTables) {
      const r = detectTables(paras);
      tRows = r.tableRows;
      procParas = r.nonTableParagraphs;
    }

    for (const para of procParas) {
      children.push(
        new Paragraph({
          children: para.map(
            (i) =>
              new TextRun({
                text: i.text,
                size: Math.round(
                  Math.max(8, Math.min(72, i.fontSize || 11)) * 2,
                ),
                font: {
                  name: i.fontName.includes("Times")
                    ? "Times New Roman"
                    : i.fontName.includes("Arial") ||
                        i.fontName.includes("Helvetica")
                      ? "Arial"
                      : "Calibri",
                },
                bold: !!i.isBold,
                italics: !!i.isItalic,
              }),
          ),
          spacing: { after: 120 },
        }),
      );
    }

    if (tRows.length && options.extractTables) {
      const maxC = Math.max(...tRows.map((r) => r.length));
      children.push(
        new Table({
          rows: tRows.map(
            (row) =>
              new TableRow({
                children: row
                  .map(
                    (item) =>
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: item.text,
                                size: Math.round(
                                  Math.max(8, Math.min(24, item.fontSize)) * 2,
                                ),
                                bold: item.isBold,
                                italics: item.isItalic,
                              }),
                            ],
                          }),
                        ],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 },
                        },
                      }),
                  )
                  .concat(
                    Array(Math.max(0, maxC - row.length))
                      .fill(null)
                      .map(
                        () =>
                          new TableCell({
                            children: [new Paragraph({ children: [] })],
                            borders: {
                              top: { style: BorderStyle.SINGLE, size: 1 },
                              bottom: { style: BorderStyle.SINGLE, size: 1 },
                              left: { style: BorderStyle.SINGLE, size: 1 },
                              right: { style: BorderStyle.SINGLE, size: 1 },
                            },
                          }),
                      ),
                  ),
              }),
          ),
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }
    if (p < end) children.push(new PageBreak());
  }

  onProgress?.({
    currentStep: "Generating...",
    currentPage: end - start + 1,
    totalPages: end - start + 1,
    percentage: 95,
    isProcessing: true,
    isCancelled: false,
  });
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: [...(children as any[]), { break: 'page' }],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  onProgress?.({
    currentStep: "Complete!",
    currentPage: end - start + 1,
    totalPages: end - start + 1,
    percentage: 100,
    isProcessing: false,
    isCancelled: false,
  });
  return blob;
}

async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNum);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = vp.width;
  canvas.height = vp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  return canvas;
}

async function renderPdfPagesAsImages(
  pdfFile: File,
  options: ImageOptions,
  onProgress?: (p: ConversionProgress) => void,
): Promise<Array<{ blob: Blob; fileName: string }>> {
  const pdfDoc = await loadPdfDocument(pdfFile);
  const totalP = pdfDoc.numPages;
  const start = options.pageRange === "all" ? 1 : options.pageRange.start;
  const end = options.pageRange === "all" ? totalP : options.pageRange.end;
  const dpi = QUALITY_DPI_MAP[options.quality];
  const baseScale = dpi / 96;
  const results: Array<{ blob: Blob; fileName: string }> = [];

  for (let p = start; p <= end; p++) {
    onProgress?.({
      currentStep: `Rendering ${p}...`,
      currentPage: p - start + 1,
      totalPages: end - start + 1,
      percentage: Math.round(((p - start) / (end - start + 1)) * 100),
      isProcessing: true,
      isCancelled: false,
    });
    const canvas = await renderPdfPageToCanvas(pdfDoc, p, baseScale);
    if (options.colorMode === "grayscale") {
      const cx = canvas.getContext("2d");
      if (cx) {
        const id = cx.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          d[i] = g;
          d[i + 1] = g;
          d[i + 2] = g;
        }
        cx.putImageData(id, 0, 0);
      }
    }
    const blob = await new Promise<Blob>((r) =>
      canvas.toBlob(
        (b) => r(b!),
        options.format === "jpg" ? "image/jpeg" : "image/png",
        options.format === "jpg" ? 0.92 : undefined,
      ),
    );
    results.push({
      blob,
      fileName: `${pdfFile.name.replace(/\.pdf$/i, "")}_page_${String(p).padStart(3, "0")}.${options.format === "jpg" ? "jpg" : "png"}`,
    });
  }
  onProgress?.({
    currentStep: "Complete!",
    currentPage: end - start + 1,
    totalPages: end - start + 1,
    percentage: 100,
    isProcessing: false,
    isCancelled: false,
  });
  return results;
}

export async function convertPdf(
  pdfFile: File,
  options: ConversionOptions,
  onProgress?: (p: ConversionProgress) => void,
): Promise<{ blob: Blob; fileName: string }> {
  switch (options.outputFormat) {
    case "docx": {
      const b = await createDocxFromPdf(
        pdfFile,
        options.docxOptions,
        onProgress,
      );
      return {
        blob: b,
        fileName: `${pdfFile.name.replace(/\.pdf$/i, "")}.docx`,
      };
    }
    case "png":
    case "jpg": {
      const imgs = await renderPdfPagesAsImages(
        pdfFile,
        options.imageOptions,
        onProgress,
      );
      if (imgs.length === 1)
        return { blob: imgs[0].blob, fileName: imgs[0].fileName };
      const zip = new JSZip();
      imgs.forEach((i) => zip.file(i.fileName, i.blob));
      const zb = await zip.generateAsync({ type: "blob" });
      return {
        blob: zb,
        fileName: `${pdfFile.name.replace(/\.pdf$/i, "")}_images.zip`,
      };
    }
    default:
      throw new Error(`Unsupported format:${options.outputFormat}`);
  }
}

export function downloadFile(blob: Blob, fileName: string) {
  saveAs(blob, fileName);
}
export function downloadFilesAsZip(
  files: Array<{ blob: Blob; fileName: string }>,
  zipName: string,
) {
  const z = new JSZip();
  files.forEach((f) => z.file(f.fileName, f.blob));
  z.generateAsync({ type: "blob" }).then((c) => saveAs(c, zipName));
}
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
