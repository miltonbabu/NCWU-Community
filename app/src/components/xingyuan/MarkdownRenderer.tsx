import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const rendered = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push(
          <span
            key={key++}
            dangerouslySetInnerHTML={{
              __html: processInlineContent(textBefore),
            }}
          />,
        );
      }

      const language = match[1] || "plaintext";
      const code = match[2].trim();
      parts.push(<CodeBlock key={key++} code={code} language={language} />);

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      parts.push(
        <span
          key={key++}
          dangerouslySetInnerHTML={{
            __html: processInlineContent(remainingText),
          }}
        />,
      );
    }

    return parts.length > 0 ? (
      parts
    ) : (
      <span
        dangerouslySetInnerHTML={{ __html: processInlineContent(content) }}
      />
    );
  }, [content]);

  return <div className="markdown-content">{rendered}</div>;
}

function renderMath(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, {
      display,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch {
    return display
      ? `<div class="math-error my-2 p-2 bg-red-50 text-red-600 rounded text-sm">${latex}</div>`
      : `<span class="math-error text-red-500">${latex}</span>`;
  }
}

function processInlineContent(text: string): string {
  let processed = text;

  processed = processTables(processed);

  processed = processed.replace(
    /\\\[[\s\S]*?\\\]/g,
    (match) =>
      '<div class="my-4 p-4 bg-muted/50 rounded-lg overflow-x-auto flex justify-center">' +
      renderMath(match.slice(2, -2), true) +
      "</div>",
  );

  processed = processed.replace(
    /\$\$[\s\S]*?\$\$/g,
    (match) =>
      '<div class="my-4 p-4 bg-muted/50 rounded-lg overflow-x-auto flex justify-center">' +
      renderMath(match.slice(2, -2), true) +
      "</div>",
  );

  processed = processed.replace(
    /\\\(([\s\S]+?)\\\)/g,
    (_match, latex) =>
      '<span class="inline-math align-middle">' +
      renderMath(latex.trim(), false) +
      "</span>",
  );

  processed = processed.replace(
    /\$([^\$\n]+)\$/g,
    (match, latex) =>
      '<span class="inline-math align-middle">' +
      renderMath(latex.trim(), false) +
      "</span>",
  );

  processed = processed.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold">$1</strong>',
  );
  processed = processed.replace(
    /__([^_]+)__/g,
    '<strong class="font-semibold">$1</strong>',
  );

  processed = processed.replace(
    /(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g,
    "<em>$1</em>",
  );

  processed = processed.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">$1</code>',
  );

  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-500 underline hover:text-blue-700 hover:no-underline cursor-pointer" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  processed = processed.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>',
  );
  processed = processed.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>',
  );
  processed = processed.replace(
    /^# (.+)$/gm,
    '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>',
  );

  processed = processed.replace(
    /^[*-] (.+)$/gm,
    '<li class="ml-4 list-disc">$1</li>',
  );

  processed = processed.replace(
    /^\d+\. (.+)$/gm,
    '<li class="ml-4 list-decimal">$1</li>',
  );

  processed = processed.replace(
    /^> (.+)$/gm,
    '<blockquote class="pl-4 border-l-4 border-primary/30 italic text-muted-foreground">$1</blockquote>',
  );

  processed = processed.replace(/\n\n/g, '</p><p class="my-3">');
  processed = processed.replace(/\n/g, "<br />");

  return `<p class="my-3 leading-relaxed">${processed}</p>`;
}

function processTables(text: string): string {
  const tableRegex = /^(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)*)/gm;

  return text.replace(tableRegex, (_match, headerLine, separatorLine, bodyLines) => {
    const headers = parseTableRow(headerLine);
    const aligns = parseTableAlign(separatorLine);

    const bodyRows = bodyLines
      .trimEnd()
      .split("\n")
      .filter((line: any) => line.trim().startsWith("|"))
      .map((line: any) => parseTableRow(line));

    const headerHtml = headers
      .map(
        (cell, i) =>
          `<th class="px-3 py-2.5 font-semibold text-left border-b-2 border-border bg-muted/50 whitespace-nowrap${aligns[i] ? ` text-${aligns[i]}` : ""}">${cell}</th>`,
      )
      .join("");

    const bodyHtml = bodyRows
      .map(
        (row: any) =>
          `<tr>${row.map((cell: any) => `<td class="px-3 py-2 border-b border-border">${cell}</td>`).join("")}</tr>`,
      )
      .join("");

    return `<div class="overflow-x-auto my-4 rounded-lg border border-border"><table class="w-full text-sm border-collapse"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
  });

  return text;
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .filter((c) => c !== "")
    .map((c) => c.trim());
}

function parseTableAlign(separatorLine: string): (string | null)[] {
  const cells = separatorLine.split("|").filter((c) => c.trim());
  return cells.map((cell) => {
    const trimmed = cell.trim();
    if (/^:-+::$/.test(trimmed)) return "center";
    if (/^:-+$/.test(trimmed)) return "left";
    if (/^:-+:$/.test(trimmed)) return "right";
    return null;
  });
}
