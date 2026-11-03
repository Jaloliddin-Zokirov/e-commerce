import { isAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, processImage } from "@/lib/images";

export const dynamic = "force-dynamic";

const ALLOWED = /^image\/(jpeg|png|webp|avif|gif|heic|heif|tiff)$/i;

/** Admin image upload: each file becomes a set of WebP renditions. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Fayl oʻqilmadi" }, { status: 400 });
  }
  const purpose = String(form.get("purpose") ?? "product");
  const maxWidth = purpose === "banner" ? 2400 : purpose === "logo" ? 800 : 1600;
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return Response.json({ error: "Fayl tanlanmagan" }, { status: 400 });

  const assets = [];
  const errors: string[] = [];
  for (const file of files.slice(0, 20)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push(`${file.name}: 20 MB dan katta`);
      continue;
    }
    if (file.type && !ALLOWED.test(file.type)) {
      errors.push(`${file.name}: rasm formati emas`);
      continue;
    }
    try {
      assets.push(await processImage(Buffer.from(await file.arrayBuffer()), { maxWidth }));
    } catch {
      errors.push(`${file.name}: rasmni qayta ishlab boʻlmadi (JPG, PNG yoki WEBP yuklang)`);
    }
  }
  return Response.json({ assets, errors }, { status: assets.length ? 200 : 422 });
}
