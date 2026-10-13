import "server-only";
import { cookies } from "next/headers";
import { authClient } from "@/lib/db";

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get("dv_admin")?.value;
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!token || !email) return false;
  try {
    const { data, error } = await authClient().auth.getUser(token);
    return !error && Boolean(data.user?.email_confirmed_at) &&
      data.user?.email?.toLowerCase() === email;
  } catch {
    return false;
  }
}
