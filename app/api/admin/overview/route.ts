import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const [a,q] = await Promise.all([
      db().from("attempts").select("id,name,phone,status,score,max_score,violation_reason,started_at,completed_at").order("score",{ascending:false}).order("completed_at",{ascending:true}),
      db().from("questions").select("id,topic,prompt,choices,answer_index,points,active,created_at").order("created_at",{ascending:true})
    ]);
    if (a.error || q.error) throw a.error ?? q.error;
    return NextResponse.json({attempts:a.data,questions:q.data},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Failed to load leaderboard."},{status:500});
  }
}
