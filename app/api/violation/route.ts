import { NextRequest, NextResponse } from "next/server";
import { currentAttempt } from "@/lib/attempt";
import { sanitizeAnswers } from "@/lib/grading";
import { db } from "@/lib/db";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const attempt = await currentAttempt();
    if (attempt?.status === "active") {
      // Browser sendBeacon includes the most recent local selections, so an
      // interruption can preserve answers even if an autosave is still pending.
      let savedAnswers: Record<string,number> | undefined;
      try {
        const payload = await req.json();
        if (payload?.answers && typeof payload.answers === "object" && !Array.isArray(payload.answers)) {
          const cleaned = sanitizeAnswers(attempt.question_ids,payload.answers);
          if (Object.keys(cleaned).length > 0) savedAnswers = cleaned;
        }
      } catch { /* Page exits may send no JSON body; preserve earlier autosaves. */ }
      const update: Record<string,unknown> = {
        status:"disqualified",score:0,
        violation_reason:"Test page hidden, exited, or lost focus",
        completed_at:new Date().toISOString()
      };
      if (savedAnswers) update.answers = savedAnswers;
      await db().from("attempts").update(update)
        .eq("id",attempt.id).eq("status","active");
    }
    return NextResponse.json({state:"pending"},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({state:"pending"},{headers:{"Cache-Control":"no-store"}});
  }
}
