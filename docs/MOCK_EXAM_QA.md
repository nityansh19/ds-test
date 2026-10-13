# Phase 3 — Mock-exam quality assurance

**Do not share the candidate URL with students until this checklist passes.**
The production environment must keep `EXAM_OPEN=false`.

## Checks automated in GitHub Actions

On each pull request and push to main:
- TypeScript validation
- Scoring logic unit tests (including forged answers, wrong answers, and partial scores)
- Server deadline validation
- Next.js production build

## Manual end-to-end rehearsal (required)

For an actual candidate test, create a **protected Vercel preview** of the `qa/mock-exam-checks` branch.
Scope `EXAM_OPEN=true` **only to that branch's Preview environment** after confirming that Vercel Authentication protects that preview URL. Never toggle the Production environment to true for testing.

1. Open the protected preview in an incognito window signed into Vercel as an authorized tester.
2. With a test phone number you control, register a candidate with an unmistakable name beginning `QA TEST`. Do not use anybody else's real number.
3. Check that 20 questions load and countdown starts at approximately 35 minutes.
4. Answer several questions and submit. Confirm the page shows only `Submission received` and no mark or leaderboard.
5. Sign in to `/admin` and verify the test candidate, private phone number, score and status.
6. Register a *different* owned test number in a fresh session. Once the exam starts, switch tabs once. Confirm the page ends and the admin leaderboard records `disqualified` and score `0`.
7. Submit a duplicate registration with the same phone number from a fresh browser and confirm it is refused.
8. Open `/api/admin/overview` without admin login and confirm HTTP `401`.
9. Return `EXAM_OPEN=false` for Preview and redeploy so no new mock attempts can start.

**Clean up QA attempts** through the Supabase SQL editor *only after verifying that their names begin with the exact QA prefix*:

```sql
select id, name, phone, status, score from public.attempts
where name like 'QA TEST%';
-- After verifying the exact rows yourself:
-- delete from public.attempts where name like 'QA TEST%';
```

## Known browser limitations

- App focus events do not prove AI use and cannot detect another physical device.
- Notifications, browser controls or accessibility tools can falsely trigger a focus violation.
- A sudden network disconnect can prevent the violation event from reaching the server.
- Run the actual candidate assessment with human supervision; provide a review process for disputed zero scores.

## Important launch prerequisites

- Test all routes on desktop and mobile.
- Ensure the final student-facing domain is publicly accessible **only once intended**, while retaining app-level admin authentication.
- Review data collection and delete private phone numbers after recruitment concludes.
