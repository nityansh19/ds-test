import { NextResponse } from "next/server";
import { currentAttempt } from "@/lib/attempt";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function POST() {
  try {
    const attempt = await currentAttempt();
    if (attempt?.status === "active") {
      await db().from("attempts").update({
        status:"disqualified",score:0,answers:{},
        violation_reason:"Test page hidden, exited, or lost focus",
        completed_at:new Date().toISOString()
      }).eq("id",attempt.id).eq("status","active");
    }
    return NextResponse.json({state:"pending"});
  } catch {
    return NextResponse.json({state:"pending"});
  }
}
