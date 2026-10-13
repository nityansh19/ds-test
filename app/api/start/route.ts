import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentAttempt, tokenHash } from "@/lib/attempt";
import { db } from "@/lib/db";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const prior = await currentAttempt();
    if (prior) return NextResponse.json({error:"This browser already has a registered attempt."},{status:409});
    const body = await req.json();
    const name = String(body.name ?? "").trim().replace(/\s+/g," ");
    const phone = String(body.phone ?? "").trim().replace(/[\s()-]/g,"");
    if (name.length < 2 || name.length > 80 || !/^\+?\d{10,15}$/.test(phone) || body.agreed !== true)
      return NextResponse.json({error:"Enter a valid name, phone number, and accept the test rules."},{status:400});

    const {data:questions,error:questionError} = await db().from("questions")
      .select("id,points").eq("active",true).order("created_at",{ascending:true}).limit(60);
    if (questionError) throw questionError;
    if (!questions || questions.length < 5)
      return NextResponse.json({error:"The test is not open yet."},{status:403});

    const session = randomBytes(32).toString("hex");
    const endsAt = new Date(Date.now() + 35 * 60 * 1000).toISOString();
    const {error} = await db().from("attempts").insert({
      name,phone,session_hash:tokenHash(session),ends_at:endsAt,
      question_ids:questions.map(q=>q.id),
      max_score:questions.reduce((n,q)=>n+q.points,0)
    });
    if (error?.code === "23505")
      return NextResponse.json({error:"This phone number already has a registered attempt."},{status:409});
    if (error) throw error;
    const response = NextResponse.json({ok:true});
    response.cookies.set("dv_attempt",session,{
      httpOnly:true,secure:process.env.NODE_ENV==="production",
      sameSite:"strict",path:"/",maxAge:60*60*24*14
    });
    return response;
  } catch {
    return NextResponse.json({error:"Unable to start the test. Contact the organizer."},{status:500});
  }
}
