"use client";

import { memo, useMemo } from "react";
import { cn } from "~/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

// simple markdown parser
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  const flushList = () => {
    if (currentList.length > 0) {
      const ListTag = listType === "ol" ? "ol" : "ul";
      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className={cn(
            "my-2 ml-4 space-y-1",
            listType === "ol" ? "list-decimal" : "list-disc"
          )}
        >
          {currentList.map((item, i) => (
            <li key={i} className="text-sm">
              {parseInline(item)}
            </li>
          ))}
        </ListTag>
      );
      currentList = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs"
          >
            <code className={codeBlockLang ? `language-${codeBlockLang}` : ""}>
              {codeBlockContent.join("\n")}
            </code>
          </pre>
        );
        codeBlockContent = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="mb-1 mt-3 text-sm font-semibold">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="mb-1.5 mt-4 text-base font-semibold">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="mb-2 mt-4 text-lg font-bold">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // horizontal rule
    if (line.match(/^(-{3,}|_{3,}|\*{3,})$/)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-border" />);
      continue;
    }

    // unordered list
    if (line.match(/^[-*+]\s/)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      currentList.push(line.replace(/^[-*+]\s/, ""));
      continue;
    }

    // ordered list
    if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      currentList.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }

    // blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-2 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground"
        >
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="my-1.5 text-sm leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  flushList();

  // handle unclosed code block
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre
        key={`code-${elements.length}`}
        className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs"
      >
        <code>{codeBlockContent.join("\n")}</code>
      </pre>
    );
  }

  return elements;
}

// parse inline elements
function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // inline code
    let match = remaining.match(/^`([^`]+)`/);
    if (match) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
        >
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // bold + italic
    match = remaining.match(/^\*\*\*([^*]+)\*\*\*/);
    if (match) {
      parts.push(
        <strong key={key++} className="font-bold italic">
          {match[1]}
        </strong>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // bold
    match = remaining.match(/^\*\*([^*]+)\*\*/);
    if (match) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[1]}
        </strong>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // italic
    match = remaining.match(/^\*([^*]+)\*/);
    if (match) {
      parts.push(
        <em key={key++} className="italic">
          {match[1]}
        </em>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // strikethrough
    match = remaining.match(/^~~([^~]+)~~/);
    if (match) {
      parts.push(
        <del key={key++} className="line-through">
          {match[1]}
        </del>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // link
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          {match[1]}
        </a>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // image
    match = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <img
          key={key++}
          src={match[2]}
          alt={match[1]}
          className="my-2 max-w-full rounded-lg"
        />
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // plain text until next special char
    match = remaining.match(/^[^`*~\[!]+/);
    if (match) {
      parts.push(match[0]);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // single special char
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return parts.length === 1 ? parts[0] : parts;
}

export const Markdown = memo(function Markdown({ children, className }: MarkdownProps) {
  const elements = useMemo(() => parseMarkdown(children), [children]);

  return <div className={cn("markdown-content", className)}>{elements}</div>;
});
