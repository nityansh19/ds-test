import { NextRequest, NextResponse } from "next/server";
import { currentAttempt } from "@/lib/attempt";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const attempt = await currentAttempt();
    if (!attempt || attempt.status !== "active")
      return NextResponse.json({state:"pending"});
    const payload = await req.json();
    const answers = payload.answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers))
      return NextResponse.json({error:"Invalid answers."},{status:400});
    const {data:questions,error} = await db().from("questions")
      .select("id,answer_index,points").in("id",attempt.question_ids);
    if (error || !questions) throw error ?? new Error("Questions missing");
    let score = 0;
    const allowed = new Set(attempt.question_ids);
    const clean: Record<string,number> = {};
    for (const [id,choice] of Object.entries(answers)) {
      if (allowed.has(id) && Number.isInteger(choice) && (choice as number)>=0 && (choice as number)<=3) {
        clean[id]=choice as number;
      }
    }
    for (const q of questions) if (clean[q.id] === q.answer_index) score += q.points;
    // Conditional update prevents the score overwriting an already disqualified attempt.
    const {error:updateError} = await db().from("attempts").update({
      score,answers:clean,status:"submitted",completed_at:new Date().toISOString()
    }).eq("id",attempt.id).eq("status","active");
    if (updateError) throw updateError;
    return NextResponse.json({state:"pending"});
  } catch {
    return NextResponse.json({error:"Submission failed. Try again."},{status:500});
  }
}
