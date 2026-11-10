/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

function verifySession(sessionValue: string): boolean {
  try {
    const [token, signature] = sessionValue.split(".");
    if (!token || !signature) return false;

    const secret =
      process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    if (!secret) return false;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  if (!session?.value || !verifySession(session.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Use a file under 10MB (JPG, PNG, or WEBP)." },
        { status: 400 }
      );
    }

    const mimeFromExt: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
    };
    const extFromMime: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif",
    };

    const rawExt = (file.name.split(".").pop() || "").toLowerCase();
    const ext = mimeFromExt[rawExt]
      ? rawExt === "jpeg"
        ? "jpg"
        : rawExt
      : extFromMime[file.type];

    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Unsupported image type. Upload JPG, PNG, or WEBP (not HEIC from iPhone).",
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
    }

    // Convert file to buffer and compress aggressively using sharp to WebP
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let uploadBuffer: Buffer = inputBuffer;
    let finalExt = ext;
    let finalContentType = mimeFromExt[ext] || file.type || "image/jpeg";

    try {
      uploadBuffer = await sharp(inputBuffer)
        .rotate() // auto-orient based on EXIF from phones
        .resize({
          width: 1400,
          height: 1400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      finalExt = "webp";
      finalContentType = "image/webp";
    } catch (sharpError) {
      console.warn("Sharp image compression fallback to original:", sharpError);
    }

    // Create a server-side client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const filePath = `${crypto.randomUUID()}.${finalExt}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, uploadBuffer, {
        contentType: finalContentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
