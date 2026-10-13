import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/db";
export const runtime="nodejs";
export async function POST(req: NextRequest) {
  try {
    const {email,password} = await req.json();
    if (typeof email !== "string" || typeof password !== "string" ||
      email.toLowerCase().trim() !== process.env.ADMIN_EMAIL?.toLowerCase().trim())
      return NextResponse.json({error:"Invalid admin credentials."},{status:401});
    const {data,error} = await authClient().auth.signInWithPassword({email,password});
    if (error || !data.session || !data.user.email_confirmed_at)
      return NextResponse.json({error:"Invalid admin credentials or unverified account."},{status:401});
    const response = NextResponse.json({ok:true});
    response.cookies.set("dv_admin",data.session.access_token,{
      httpOnly:true,secure:process.env.NODE_ENV==="production",
      sameSite:"strict",path:"/",maxAge:Math.max(1, data.session.expires_in ?? 3600)
    });
    return response;
  } catch {
    return NextResponse.json({error:"Unable to sign in. Check server configuration."},{status:500});
  }
}
