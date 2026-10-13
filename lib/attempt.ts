import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export type Attempt = {
  id: string;
  name: string;
  phone: string;
  status: "active" | "submitted" | "disqualified" | "timed_out";
  ends_at: string;
  question_ids: string[];
};

export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function currentAttempt(): Promise<Attempt | null> {
  const token = (await cookies()).get("dv_attempt")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await db()
    .from("attempts")
    .select("id,name,phone,status,ends_at,question_ids")
    .eq("session_hash", tokenHash(token))
    .maybeSingle();
  if (error || !data) return null;
  if (data.status === "active" && new Date(data.ends_at).getTime() <= Date.now()) {
    await db().from("attempts")
      .update({status:"timed_out", score:0, violation_reason:"Time limit expired", completed_at:new Date().toISOString()})
      .eq("id", data.id).eq("status","active");
    return {...data,status:"timed_out"};
  }
  return data as Attempt;
}

export async function publicQuestions(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await db()
    .from("questions")
    .select("id,topic,prompt,choices,points")
    .in("id", ids);
  if (error) throw error;
  const indexed = new Map((data ?? []).map((q: any) => [q.id,q]));
  return ids.map(id => indexed.get(id)).filter(Boolean);
}
