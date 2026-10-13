import { NextResponse } from "next/server";
import { currentAttempt, publicQuestions } from "@/lib/attempt";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const attempt = await currentAttempt();
    if (attempt) {
      if (attempt.status !== "active") return NextResponse.json({state:"pending"});
      return NextResponse.json({
        state:"active",
        endsAt:attempt.ends_at,
        questions:await publicQuestions(attempt.question_ids)
      }, {headers:{"Cache-Control":"no-store"}});
    }
    const {count,error} = await db().from("questions")
      .select("id",{count:"exact",head:true}).eq("active",true);
    if (error) throw error;
    return NextResponse.json({state: (count ?? 0) >= 5 ? "ready" : "unavailable"}, {
      headers: {"Cache-Control":"no-store"}
    });
  } catch {
    return NextResponse.json({error:"Test is not configured yet."},{status:503});
  }
}
