import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db";

const NAME = /^[a-z0-9]+(?:-\d+)?\.(webp|svg)$/;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = NAME.exec(file);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file));
    const isSvg = match[1] === "svg";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": isSvg ? "image/svg+xml" : "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // SVGs come only from the bundled demo set, but never let them run scripts.
        ...(isSvg ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
