/**
 * Lightweight public HTTP smoke checks. Does not register users, submit
 * answers, retrieve candidate information or require any credentials.
 * Once the site is intentionally public, probes should return JSON rather
 * than Vercel Authentication pages.
 */
const BASE = "https://ds-test-roan.vercel.app";
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function verify() {
  const state = await fetch(BASE + "/api/state", {redirect:"manual",cache:"no-store"});
  if (state.status !== 200) throw new Error("Candidate state returned HTTP " + state.status);
  const contentType = state.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("Candidate state is not JSON");
  const data = await state.json();
  if (!["ready","unavailable"].includes(data.state)) {
    throw new Error("Unexpected candidate state: " + String(data.state));
  }
  if (JSON.stringify(data).includes("answer_index")) throw new Error("Public answer key exposure detected");
  const admin = await fetch(BASE + "/api/admin/overview",{redirect:"manual",cache:"no-store"});
  if (admin.status !== 401) throw new Error("Unauthenticated admin endpoint returned HTTP " + admin.status);
  const answerReview=await fetch(BASE + "/api/admin/attempt/00000000-0000-4000-8000-000000000000",
    {redirect:"manual",cache:"no-store"});
  if (answerReview.status !== 401)
    throw new Error("Unauthenticated answer-review endpoint returned HTTP " + answerReview.status);
  console.log("Public smoke passed: state=" + data.state + "; admin routes HTTP 401");
}

let message;
for (let tryNumber=1; tryNumber<=15; tryNumber++) {
  try {
    await verify();
    process.exit(0);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
    console.log("Public smoke attempt " + tryNumber + "/15: " + message);
    if (tryNumber<15) await pause(10000);
  }
}
console.error("Public smoke failed: " + message);
process.exit(1);
