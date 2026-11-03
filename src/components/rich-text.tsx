import { Fragment, type ReactNode } from "react";

/** Inline **bold** support; everything else renders as plain, escaped text. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

type Block = { type: "p"; lines: string[] } | { type: "ul"; items: string[] } | { type: "h3"; text: string };

/**
 * Minimal formatting for admin-written descriptions:
 * blank line = new paragraph, "- " = bullet, "## " = heading, **bold**.
 */
export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];
    if (!line) {
      blocks.push({ type: "p", lines: [] });
      continue;
    }
    if (/^#{2,3}\s+/.test(line)) {
      blocks.push({ type: "h3", text: line.replace(/^#{2,3}\s+/, "") });
    } else if (/^[-•*]\s+/.test(line)) {
      const item = line.replace(/^[-•*]\s+/, "");
      if (last?.type === "ul") last.items.push(item);
      else blocks.push({ type: "ul", items: [item] });
    } else if (last?.type === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => b.type !== "p" || b.lines.length > 0);
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  return (
    <div className={className ?? "prose-pd"}>
      {blocks.map((block, i) => {
        if (block.type === "h3") return <h3 key={i}>{inline(block.text)}</h3>;
        if (block.type === "ul")
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
