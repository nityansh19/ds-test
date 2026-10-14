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

6. Visit `http://localhost:3000/admin`; log in and review the **20 private MCQs / 100 marks already added to the dedicated Supabase project**. You can add or archive questions, up to 60 active questions per exam.
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

## Launch control

Recruitment is **closed by default**. Set `EXAM_OPEN=true` in your Vercel Production (and, if desired, Preview) environment only after you have tested the admin login, database, question bank and candidate flow. Redeploy after changing this variable. Set it back to `false` and redeploy to stop **new** registrations. Existing attempts can still finish; do not use this flag as a kill switch for active exams.

## Final exam operation
- The current **live** question bank is a beginner-friendly 20-question, 100-mark set kept in the dedicated Supabase database, not in this public repository.
- Candidate-facing pages collect explicit consent for personal data use and notify candidates about disqualification reviews.
- At the end of the 35-minute countdown, the frontend submits automatically. The backend accepts a **10-second network grace** to receive this request, after which unsubmitted attempts time out with zero. This is a transport grace, not advertised additional writing time.
- Supabase has archived the previous hard question bank without deleting the existing attempt, so older results can still be reviewed.
- To invite students, the public production domain must be accessible without Vercel Authentication, while **Preview** should remain protected. Keep the app's `/admin` login enabled.
- Before public launch, verify the anonymous `/api/admin/overview` response is `401`; open `/api/state` returns `ready` only after setting `EXAM_OPEN=true` and deploying with that setting.
- Candidate answers and personal information are not published. Decide your organizer contact and retention deadline before inviting students.

## Admin participant answer review
- In `/admin` → Rankings & Results, use **VIEW ANSWERS** to inspect one student's full test.
- The private `/api/admin/attempt/{id}` endpoint verifies the admin session before returning saved choices and answer keys; all responses are `private, no-store`.
- Each reviewed item displays the student's selected choice, the correct choice, whether it was correct / incorrect / unanswered, and the points available.
- Answers autosave while the exam is active, and the focus-violation beacon also sends a final best-effort snapshot. Submission remains authoritative for the official score.
- Existing submissions are supported, including questions archived from older test versions. Previously disqualified attempts may have no stored selections because the old application discarded them.
- If a candidate is disqualified or times out, the official score remains **zero** regardless of saved choices.
- Keep this information private; do not publish individual responses or contact details.
