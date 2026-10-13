import { NextRequest, NextResponse } from "next/server";
import { currentAttempt } from "@/lib/attempt";
import { db } from "@/lib/db";
import { gradeSubmission } from "@/lib/grading";
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
    const {score,clean}=gradeSubmission(attempt.question_ids,questions,answers);
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
