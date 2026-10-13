import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const b=await req.json();
    const prompt=String(b.prompt??"").trim();
    const topic=String(b.topic??"Python").trim().slice(0,50);
    const choices=Array.isArray(b.choices) ? b.choices.map((v:unknown)=>String(v??"").trim()) : [];
    const answerIndex=Number(b.answer_index);
    const points=Number(b.points);
    if (prompt.length<12 || prompt.length>2000 || choices.length!==4 ||
       choices.some((v:string)=>v.length<1 || v.length>400) ||
       !Number.isInteger(answerIndex) || answerIndex<0 || answerIndex>3 ||
       !Number.isInteger(points) || points<1 || points>20)
      return NextResponse.json({error:"Enter a question, four choices, correct answer, and 1–20 points."},{status:400});
    const {error}=await db().from("questions").insert({
      prompt,topic:topic||"General",choices,answer_index:answerIndex,points
    });
    if (error) throw error;
    return NextResponse.json({ok:true});
  } catch {
    return NextResponse.json({error:"Unable to save question."},{status:500});
  }
}
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const {id}=await req.json();
    if (typeof id!=="string" || !/^[a-f0-9-]{36}$/i.test(id))
      return NextResponse.json({error:"Invalid question id"},{status:400});
    // Archive, do not delete: active attempts must retain their original question set.
    const {error}=await db().from("questions").update({active:false}).eq("id",id);
    if (error) throw error;
    return NextResponse.json({ok:true});
  } catch {
    return NextResponse.json({error:"Unable to archive question."},{status:500});
  }
}
