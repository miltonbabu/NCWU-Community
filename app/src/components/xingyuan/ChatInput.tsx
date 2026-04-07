import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Send,
  Square,
  Brain,
  Atom,
  ImagePlus,
  X,
  Loader2,
  AlertTriangle,
  FileText,
  FileImage,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { uploadImageToCloudinary } from "../../services/cloudinary";
import {
  processPDF,
  processDOCX,
  processXLSX,
  processTXT,
  getFileType,
} from "../../lib/documentProcessor";

type ProcessedDocument = {
  type: "pdf" | "docx" | "xlsx" | "txt" | "image";
  fileName: string;
  text?: string;
  images?: string[];
  pageCount?: number;
};

interface ChatInputProps {
  onSend: (
    message: string,
    deepThink?: boolean,
    images?: string[],
    documentText?: string,
  ) => void;
  onDeepThinkChange?: (deepThink: boolean) => void;
  isLoading?: boolean;
  onStop?: () => void;
  centered?: boolean;
  deepThink?: boolean;
  remainingMessages?: number;
  remainingImages?: number;
  remainingDocuments?: number;
  isGuest?: boolean;
  isAdmin?: boolean;
  userName?: string | null;
}

interface ImageItem {
  url: string;
  uploading: boolean;
  preview?: string;
}

interface DocumentItem {
  doc: ProcessedDocument | null;
  processing: boolean;
}

const MAX_DOC_SIZE = 10 * 1024 * 1024;

const SUGGESTIONS = [
  "Explain this PDF document in detail",
  "Help me write Python code for my assignment",
  "Solve this math problem step by step",
  "Analyze this Excel spreadsheet data",
  "Teach me Chinese HSK vocabulary",
  "Translate and explain this text",
];

const MOBILE_SUGGESTION_COUNT = 3;

export function ChatInput({
  onSend,
  onDeepThinkChange,
  isLoading,
  onStop,
  centered,
  deepThink: deepThinkProp,
  remainingMessages = Infinity,
  remainingImages = Infinity,
  remainingDocuments = Infinity,
  isGuest = false,
  isAdmin = false,
  userName = null,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [internalDeepThink, setInternalDeepThink] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const displayedSuggestions = isMobile
    ? SUGGESTIONS.slice(0, MOBILE_SUGGESTION_COUNT)
    : SUGGESTIONS;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isControlled = deepThinkProp !== undefined;
  const deepThink = isControlled ? deepThinkProp : internalDeepThink;

  useEffect(() => {
    if (isControlled && deepThinkProp !== internalDeepThink) {
      setInternalDeepThink(deepThinkProp);
    }
  }, [deepThinkProp, isControlled, internalDeepThink]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 500)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    const finalImages = images
      .filter((img) => !img.uploading && img.url)
      .map((img) => img.url);

    const docText =
      document?.doc && !document.processing ? document.doc.text : undefined;

    if ((!trimmed && finalImages.length === 0 && !docText) || isLoading) return;

    const allImages = [...finalImages];
    if (document?.doc && !document.processing && document.doc.images) {
      allImages.push(...document.doc.images);
    }

    onSend(
      trimmed,
      deepThink,
      allImages.length > 0 ? allImages : undefined,
      docText || undefined,
    );
    setInput("");
    setImages([]);
    setDocument(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDeepThink = () => {
    const next = !deepThink;
    if (!isControlled) {
      setInternalDeepThink(next);
    }
    onDeepThinkChange?.(next);
  };

  const processFile = async (file: File) => {
    const fileType = getFileType(file);
    if (!fileType) return;

    if (fileType === "image") {
      const idx = images.length;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = ev.target?.result as string;
        setImages((prev) =>
          prev.map((img, i) => (i === idx ? { ...img, preview } : img)),
        );
      };
      reader.readAsDataURL(file);

      setImages((prev) => [
        ...prev,
        { url: "", uploading: true, preview: undefined },
      ]);

      try {
        const result = await uploadImageToCloudinary(file, {
          folder: "xingyuan-ai",
        });
        setImages((prev) =>
          prev.map((img, i) =>
            i === idx
              ? {
                  url: result.url,
                  uploading: false,
                  preview: img.preview || undefined,
                }
              : img,
          ),
        );
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        setImages((prev) => prev.filter((_, i) => i !== idx));
      }
    }

    if (
      fileType === "pdf" ||
      fileType === "docx" ||
      fileType === "xlsx" ||
      fileType === "txt"
    ) {
      setDocument({ doc: null, processing: true });

      try {
        let processed: ProcessedDocument;
        if (fileType === "pdf") {
          processed = await processPDF(file);
        } else if (fileType === "docx") {
          processed = await processDOCX(file);
        } else if (fileType === "xlsx") {
          processed = await processXLSX(file);
        } else {
          processed = await processTXT(file);
        }

        setDocument({ doc: processed, processing: false });

        if (processed.type === "pdf" && processed.images) {
          for (const img of processed.images) {
            try {
              const blob = await (await fetch(img)).blob();
              const imageFile = new File([blob], `${file.name}-page.jpg`, {
                type: "image/jpeg",
              });
              const result = await uploadImageToCloudinary(imageFile, {
                folder: "xingyuan-ai",
              });
              processed.images![processed.images!.indexOf(img)] = result.url;
            } catch {
              console.error("Failed to upload PDF page image");
            }
          }
          setDocument((prev) => (prev ? { ...prev, doc: processed } : prev));
        }
      } catch (error) {
        console.error("Document processing failed:", error);
        setDocument(null);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const currentImageCount = images.length;
    const hasDoc = !!document && !document.processing;

    for (const file of fileList) {
      const fileType = getFileType(file);
      if (!fileType) continue;

      if (fileType !== "image" && file.size > MAX_DOC_SIZE) {
        setFileSizeError(
          `"${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 10 MB limit.`,
        );
        continue;
      }

      if (fileType === "image") {
        if (
          currentImageCount + images.filter((i) => i.type === "image").length >=
          4
        )
          break;
        await processFile(file);
      } else if (
        (fileType === "pdf" ||
          fileType === "docx" ||
          fileType === "xlsx" ||
          fileType === "txt") &&
        !hasDoc &&
        remainingDocuments > 0
      ) {
        await processFile(file);
        break;
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (fileSizeError) {
      const timer = setTimeout(() => setFileSizeError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [fileSizeError]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDocument = () => {
    setDocument(null);
  };

  const hasUploading =
    images.some((img) => img.uploading) || document?.processing;
  const readyImages = images
    .filter((img) => !img.uploading && img.url)
    .map((img) => img.url);
  const showLimitWarning =
    !isAdmin &&
    isGuest &&
    (remainingMessages <= 3 || remainingImages <= 1 || remainingDocuments <= 0);

  return (
    <div
      className={cn(
        "w-full max-w-[880px] mx-auto px-4",
        centered ? "flex flex-col items-center" : "",
      )}
    >
      {showLimitWarning && (
        <div className="w-full mb-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {isGuest && remainingMessages <= 3 && (
              <span className="font-medium">
                {remainingMessages} free message
                {remainingMessages !== 1 ? "s" : ""} left
              </span>
            )}
            {isGuest &&
              remainingMessages <= 3 &&
              (remainingImages <= 1 || remainingDocuments <= 0) &&
              " "}
            {isGuest && remainingImages <= 1 && (
              <span className="font-medium">
                {remainingImages} free image{remainingImages !== 1 ? "" : ""}{" "}
                left
              </span>
            )}
            {isGuest && remainingImages <= 1 && remainingDocuments <= 0 && " "}
            {isGuest && remainingDocuments <= 0 && (
              <span className="font-medium">No document uploads left</span>
            )}{" "}
            —{" "}
            <span
              className="underline cursor-pointer"
              onClick={() => (window.location.href = "/login")}
            >
              Sign in
            </span>{" "}
            for unlimited access!
          </span>
        </div>
      )}

      {fileSizeError && (
        <div className="w-full mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{fileSizeError}</span>
          <button
            onClick={() => setFileSizeError(null)}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {(images.length > 0 || document) && (
        <div className="flex gap-2 mb-2 flex-wrap max-w-[880px] items-center">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <div
                className={cn(
                  "w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted",
                  img.uploading && "animate-pulse",
                )}
              >
                {img.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="size-5 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <img
                    src={img.preview || img.url}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {document && (
            <div className="relative group">
              <div
                className={cn(
                  "w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center",
                  document.processing && "animate-pulse",
                )}
              >
                {document.processing ? (
                  <Loader2 className="size-5 text-indigo-500 animate-spin" />
                ) : document.doc?.type === "pdf" && document.doc.images?.[0] ? (
                  <img
                    src={document.doc.images[0]}
                    alt="PDF preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="size-6 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={removeDocument}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <span className="text-xs font-medium self-center flex items-center gap-1">
            {hasUploading ? (
              <>
                <Loader2 className="size-3 animate-spin text-indigo-500" />
                Processing...
              </>
            ) : (
              <>
                {readyImages.length > 0 && (
                  <span className="text-indigo-500">
                    {readyImages.length} image
                    {readyImages.length > 1 ? "s" : ""} attached
                  </span>
                )}
                {readyImages.length > 0 && document?.doc && " + "}
                {document?.doc && !document.processing && (
                  <span className="text-violet-500">
                    {document.doc.fileName}
                    {document.doc.pageCount
                      ? ` (${document.doc.pageCount} pages)`
                      : ""}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      )}

      {centered && (
        <div className="text-center mb-8">
          <Atom className="size-14 text-primary mx-auto mb-4" />
          <h1 className="text-xl sm:text-3xl font-bold mb-2">
            {userName ? `Hello, ${userName}! 👋` : "How can I help you today?"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Ask me anything — text questions, image analysis, coding, math, or
            upload photos, PDFs, Word, Excel and Text files and I'll read them.
          </p>
        </div>
      )}

      {centered && (
        <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-[680px] mx-auto">
          {displayedSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setInput(suggestion);
                textareaRef.current?.focus();
              }}
              className="px-4 py-2 rounded-full text-sm border border-border bg-muted/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full">
        <div
          className={cn(
            "relative bg-card border border-border rounded-3xl shadow-lg overflow-hidden transition-all",
            deepThink &&
              "border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              readyImages.length > 0 || document
                ? "Ask about the attached file(s)..."
                : "Ask me anything..."
            }
            className="min-h-[120px] max-h-[500px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14 pl-14 py-8 px-5 bg-transparent text-base"
            rows={1}
          />

          <button
            type="button"
            onClick={toggleDeepThink}
            className={cn(
              "absolute left-2 bottom-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              deepThink
                ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                : "bg-muted hover:bg-muted/80 text-muted-foreground",
            )}
          >
            <Brain className={cn("size-3.5", deepThink && "animate-pulse")} />
            Deep Think
          </button>

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={
                !isAdmin && isGuest && remainingDocuments <= 0
                  ? "Document limit reached. Sign in for more!"
                  : !isAdmin && isGuest && remainingImages <= 0
                    ? "Limit reached. Sign in for more!"
                    : "Attach file (image, PDF, DOCX, XLSX, TXT)"
              }
              disabled={
                hasUploading ||
                (!isAdmin && isGuest && remainingImages <= 0) ||
                (!isAdmin && isGuest && remainingDocuments <= 0) ||
                (!!document?.doc && !document.processing)
              }
              className={cn(
                "p-2 rounded-lg transition-colors",
                readyImages.length > 0 || document
                  ? "text-indigo-500 hover:bg-indigo-500/10"
                  : "text-muted-foreground hover:text-indigo-500 hover:bg-accent",
                (hasUploading ||
                  (!isAdmin && isGuest && remainingImages <= 0) ||
                  (!isAdmin && isGuest && remainingDocuments <= 0) ||
                  (!!document?.doc && !document.processing)) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              <FileImage className="size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.docx,.xlsx,.xls,.txt"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {isLoading ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={onStop}
                className="size-12 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive"
              >
                <Square className="size-5" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSend}
                disabled={
                  !input.trim() && readyImages.length === 0 && !document?.doc
                }
                className="size-12 rounded-xl hover:bg-accent"
              >
                <Send className="size-5" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Press Enter to send · Shift+Enter for new line · Supports images, PDF,
          DOCX, XLSX &amp; TXT
        </p>
      </div>
    </div>
  );
}
