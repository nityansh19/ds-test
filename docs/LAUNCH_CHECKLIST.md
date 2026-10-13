# DataVerse recruitment — launch checklist (October 2026)

The backend Supabase project is **already created** and contains the database schema and **20 active MCQs totaling 100 points**. There is no need to rerun the SQL schema or re-enter the starter questions.

## Current resources
- Source code: https://github.com/nityansh19/ds-test (main)
- Supabase: https://supabase.com/dashboard/project/rbbeqndegsofcepabtrt
- Supabase project: `dataverse-recruitment` (Mumbai `ap-south-1`)
- Supabase API URL: `https://rbbeqndegsofcepabtrt.supabase.co`
- Deployment: **not connected**. Vercel connector returned HTTP 403 for the account scope and has not created a site.
- Exam access is deliberately **closed** until `EXAM_OPEN=true` is set in Vercel and redeployed.

## 1. Create the private administrator account yourself

1. Visit the linked Supabase project in your own browser.
2. Go to **Authentication > Users**; create an email/password user for yourself via the dashboard and verify the email if prompted. Do not use a candidate account as the administrator.
3. Keep the chosen password private. Set `ADMIN_EMAIL` in Vercel to the exact verified admin email, not an email supplied by a candidate.
4. Disable public user sign-ups for this dedicated project if you do not need them.

## 2. Resolve the Vercel connection (requires account authorization)

The automated Vercel connection currently cannot access your scope (HTTP 403). Open https://vercel.com/new while logged into the account that owns the GitHub integration. Import `nityansh19/ds-test` into a new project named `ds-test` (or re-authorize the Vercel connector's correct account scope).

- Framework: **Next.js**
- Root directory: repository root `./`
- Production branch: **main**
- Don't expose the exam link to candidates yet.
- Verify the Vercel GitHub app is authorized for this repository if it does not appear in the list.

## 3. Add these Vercel environment variables (Production and Preview, optionally Development)

| Key | Where to get it | Exposure |
| --- | --- | --- |
| `SUPABASE_URL` | `https://rbbeqndegsofcepabtrt.supabase.co` | Server-side |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase > Project Settings > API Keys > publishable/default key | Server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API Keys > **secret/server** key (service role legacy key also works) | **Secret: encrypted, server-only** |
| `ADMIN_EMAIL` | Your **verified** Supabase Auth user email | Server-side |
| `EXAM_OPEN` | Set initially to `false` | Server-side |

Only supply the secret key in the Vercel dashboard. **Never paste it into GitHub, WhatsApp, chat, or a `NEXT_PUBLIC_` variable.** You may need to redeploy after changing environment variables.

## 4. Test in a supervised rehearsal BEFORE launch

- Open `/admin`, sign in using the verified admin email and password.
- Confirm the question bank lists 20 questions, total 100 points.
- With `EXAM_OPEN=false`, confirm candidates cannot begin new tests.
- For a rehearsal, set `EXAM_OPEN=true` on a **protected preview** deployment. Do not share the preview URL publicly.
- Register one test candidate with a **test number you control**, then answer and submit.
- Verify the candidate only sees **results pending** and the admin dashboard shows score, status and participant detail.
- Use another test identity to verify that leaving the tab produces a zero/flag in admin results. Test how your actual devices behave with calls, notifications and app switches.
- Delete any rehearsal records using authorized database administration before official recruitment.
- Keep the test **closed** until the intended opening window.

## 5. Practical and privacy limits

- A website cannot detect AI use, inspect other apps, or guarantee perfect anti-cheat. Switching focus can also be caused by harmless notifications or accessibility tools.
- The strict focus rule automatically marks attempted switches as 0 **when its network report reaches the server**, which is best effort. Provide a documented appeal pathway for false positives.
- Phone numbers are personally identifiable. Explain why collected, who can see them, and when records will be deleted. Do not publish candidates' phone numbers or the private CSV leaderboard.
- The current system uses one registration per submitted phone number, **not SMS-verified identity**. Confirm winners' identities separately.
- Running the test in a supervised room is more reliable than browser focus checks.

## 6. Release gate

When the site, Auth account, registration, scoring, strict focus behavior, and privacy notice are verified, set `EXAM_OPEN=true` for production and redeploy. This is the final explicit opening action.

## 7. Contact information

The name and phone fields are mandatory under the current requirement. For most university recruitment events, consider whether a college enrollment number or email would be less intrusive instead. Do not collect more personal data than you need.
