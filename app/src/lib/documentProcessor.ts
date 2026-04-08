export type ProcessedDocument = {
  type: "pdf" | "docx" | "xlsx" | "txt" | "image";
  fileName: string;
  text?: string;
  images?: string[];
  pageCount?: number;
};

export async function processPDF(file: File): Promise<ProcessedDocument> {
  const pdfjsLib = await import("pdfjs-dist");

  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, 20);
  const images: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.85));
  }

  return {
    type: "pdf",
    fileName: file.name,
    images,
    pageCount: pdf.numPages,
  };
}

export async function processDOCX(file: File): Promise<ProcessedDocument> {
  const { default: mammoth } = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return {
    type: "docx",
    fileName: file.name,
    text: result.value,
  };
}

export async function processXLSX(file: File): Promise<ProcessedDocument> {
  const XLSX = await import("xlsx");

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheetTexts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csvText = XLSX.utils.sheet_to_csv(sheet);
    sheetTexts.push(`--- Sheet: ${sheetName} ---\n${csvText}`);
  }

  return {
    type: "xlsx",
    fileName: file.name,
    text: sheetTexts.join("\n\n"),
  };
}

export async function processTXT(file: File): Promise<ProcessedDocument> {
  const text = await file.text();
  return {
    type: "txt",
    fileName: file.name,
    text,
  };
}

export function getFileType(
  file: File,
): "pdf" | "docx" | "xlsx" | "txt" | "image" | null {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf"))
    return "pdf";
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  )
    return "docx";
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel" ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls")
  )
    return "xlsx";
  if (
    file.type === "text/plain" ||
    file.name.endsWith(".txt")
  )
    return "txt";
  if (file.type.startsWith("image/")) return "image";
  return null;
}
