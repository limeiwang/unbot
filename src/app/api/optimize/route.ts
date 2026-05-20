import { NextRequest, NextResponse } from "next/server";
import { optimize } from "@/lib/optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, config } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = optimize(text, config ?? {});

    return NextResponse.json({
      optimized: result.optimized,
      originalChars: result.originalChars,
      optimizedChars: result.optimizedChars,
      blocks: result.blocks.length,
    });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
