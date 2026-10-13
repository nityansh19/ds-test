# DataVerse — Founding Five Recruitment

A Next.js + Supabase examination application for recruiting five founding members of a student Data Science & Analytics Club.

## Features
- Candidate name and phone registration, one attempt per phone number.
- 35-minute timed MCQ assessment with private server-side grading.
- Strict focus detection: tab hidden, app switched, browser minimized, or window blur triggers zero and disqualification. Browser events are best-effort and can falsely trigger.
- Candidate sees a pending-results screen; scores never returned to the candidate.
- Only a verified Supabase Auth account matching ADMIN_EMAIL can access /admin.
- Protected question builder (4 options per question; Python, analytics, statistics etc.).
- Admin-only rankings: highest/lowest scores, candidate details, disqualification status, CSV export.
- Postgres RLS enabled; no public data API access to questions or attempts.

## Setup (complete before sending the test link)

1. Create a **new Supabase project** dedicated to recruitment, not your existing Health Tracker database.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In Supabase Authentication, create your own email/password user, verify the email, and use that email in `ADMIN_EMAIL`. Disable self sign-ups in Auth settings if this project is admin-only.
4. Copy `.env.example` to `.env.local`, fill in the URL, publishable key, **server-only** service role key, and ADMIN_EMAIL. Never expose the service role key in client-side code or commit your local env.
5. Install Node.js 20.9+ and run:

   ```bash
   npm install
   npm run lint
   npm run dev
   ```

6. Visit `http://localhost:3000/admin`; log in and add at least **five active questions**. You can add more, up to 60 questions per exam.
7. Visit `http://localhost:3000`; register with a different test phone number to try a candidate attempt (this will create a real attempt in your database).
8. Deploy on Vercel and add the **same four env vars** in the Vercel project settings. Avoid any `NEXT_PUBLIC_` prefix for your secret key.
9. Test registration, browser switch disqualification, submission, question management, and results access on the deployed site *before* inviting students.

## Rules and honest limitations

- **No website can reliably detect the use of AI or guarantee detection of every app switch.** The browser can report focus/visibility loss, not what another tab or phone is doing. The code does not pretend otherwise.
- In strict mode, *any browser focus loss* causes automatic zero, including some legitimate operating-system notifications or accessibility interactions. Announce this clearly, offer an appeal/review path, and ideally run the assessment in a supervised lab.
- Network or process termination can prevent the violation request from reaching the server. This is not a lockdown browser.
- Candidates can enter alternate phone numbers. There is **no SMS verification**; manually verify identities for final selection.
- Anyone with read access to this public repository can see application code, but **not question answers**, which are entered only into Supabase via the admin form.
- Phone numbers are personal data. Collect consent, never publish them with rankings, and remove data from Supabase once recruitment concludes. For a college test, follow applicable institutional privacy rules and obtain faculty approval.
- Clearing cookies may allow a different number to register. The unique phone constraint prevents a second attempt for the same normalized number.
- The CSV download is admin-only. Keep exported files private.

## Architecture
- App Router server routes: `/api/state`, `/api/start`, `/api/submit`, `/api/violation`
- Organizer routes: `/api/admin/login`, `/api/admin/overview`, `/api/admin/questions`
- Supabase service-role database queries **on the server only**, no anonymous client table access.
- Session cookies are HttpOnly, Secure in production and SameSite=Strict.
- Admin JWT is validated against Supabase Auth on every protected API request.

## Administrative checklist
- Questions: 5+ active
- Verified admin Auth user and correct ADMIN_EMAIL
- Deployed environment variables and HTTPS
- Consent notice approved
- Backup date and appeal mechanism for false-positive disqualifications
- Private results announcement plan
