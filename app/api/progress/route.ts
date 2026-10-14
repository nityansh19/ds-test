import { NextRequest, NextResponse } from "next/server";
import { currentAttempt } from "@/lib/attempt";
import { sanitizeAnswers } from "@/lib/grading";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const attempt = await currentAttempt();
    if (!attempt || attempt.status !== "active")
      return NextResponse.json({error:"No active attempt."},{status:409});
    const body = await req.json();
    if (!body || !body.answers || typeof body.answers !== "object" ||
        Array.isArray(body.answers))
      return NextResponse.json({error:"Invalid answers."},{status:400});
    const answers = sanitizeAnswers(attempt.question_ids,body.answers);
    const {error} = await db().from("attempts").update({answers})
      .eq("id",attempt.id).eq("status","active");
    if (error) throw error;
    return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Unable to save progress."},{status:500});
  }
}
