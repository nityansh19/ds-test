import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = {"Cache-Control":"private, no-store"};

export async function GET(_req: NextRequest,{params}: {params:Promise<{id:string}>}) {
  if (!(await isAdmin()))
    return NextResponse.json({error:"Unauthorized"},{status:401,headers:privateHeaders});

  const {id}=await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return NextResponse.json({error:"Invalid attempt ID."},{status:400,headers:privateHeaders});

  try {
    const {data:attempt,error:attemptError}=await db().from("attempts")
      .select("id,name,phone,status,score,max_score,violation_reason,started_at,completed_at,question_ids,answers")
      .eq("id",id).maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt) return NextResponse.json({error:"Attempt not found."},{status:404,headers:privateHeaders});

    const ids: string[] = attempt.question_ids ?? [];
    if (!ids.length) return NextResponse.json({attempt,questions:[]},{headers:privateHeaders});

    const {data:questions,error:questionError}=await db().from("questions")
      .select("id,topic,prompt,choices,answer_index,points")
      .in("id",ids);
    if (questionError) throw questionError;

    const byId=new Map((questions??[]).map(q=>[q.id,q]));
    const recorded: Record<string,unknown> =
      attempt.answers && typeof attempt.answers==="object" && !Array.isArray(attempt.answers)
        ? attempt.answers : {};
    const review=ids.map((qid:string)=>{
      const q=byId.get(qid);
      if (!q) return null;
      const choice=recorded[qid];
      const selectedIndex=Number.isInteger(choice) && (choice as number)>=0 &&
        (choice as number)<q.choices.length ? choice as number : null;
      const outcome=selectedIndex===null?"unanswered":
        selectedIndex===q.answer_index?"correct":"incorrect";
      return {
        id:qid,topic:q.topic,prompt:q.prompt,choices:q.choices,points:q.points,
        selected_index:selectedIndex,correct_index:q.answer_index,outcome
      };
    }).filter(Boolean);
    return NextResponse.json({attempt,questions:review},{headers:privateHeaders});
  } catch {
    return NextResponse.json({error:"Could not load the candidate's answers."},{status:500,headers:privateHeaders});
  }
}
