import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "../ui/button";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  py: "python",
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  chinese: "plaintext",
};

export function CodeBlock({ code, language = "plaintext" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resolvedLang = LANGUAGE_ALIASES[language.toLowerCase()] || language;

  return (
    <div className="relative group rounded-lg overflow-hidden border my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 dark:bg-slate-900/80 border-b border-slate-700/50">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {resolvedLang}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="size-7 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          {copied ? (
            <Check className="size-3.5 text-green-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>

      <SyntaxHighlighter
        language={resolvedLang}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.875rem",
          borderRadius: 0,
        }}
        showLineNumbers={code.split("\n").length > 5}
        wrapLongLines
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
