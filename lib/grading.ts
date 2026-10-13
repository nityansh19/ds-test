export type ScoringQuestion = {
  id: string;
  answer_index: number;
  points: number;
};

/**
 * Grade only question IDs that were assigned when the candidate started.
 * Reject forged question IDs, string answers, fractions, and invalid options.
 * The function is pure so it can be tested without a database.
 */
export function gradeSubmission(
  assignedIds: readonly string[],
  questions: readonly ScoringQuestion[],
  providedAnswers: unknown
): { score: number; clean: Record<string, number> } {
  const allowed = new Set(assignedIds);
  const answers =
    providedAnswers !== null &&
    typeof providedAnswers === "object" &&
    !Array.isArray(providedAnswers)
      ? providedAnswers as Record<string, unknown>
      : {};
  const clean: Record<string, number> = Object.create(null);

  for (const [id, value] of Object.entries(answers)) {
    if (allowed.has(id) && Number.isInteger(value) && (value as number) >= 0 &&
      (value as number) <= 3) {
      clean[id] = value as number;
    }
  }

  const score = questions.reduce((total, question) => {
    if (!allowed.has(question.id)) return total;
    return total + (clean[question.id] === question.answer_index ? question.points : 0);
  }, 0);
  return {score,clean};
}

/** A malformed expiration is treated as already expired (fail closed). */
export function hasExamExpired(endsAt: string, now = Date.now()): boolean {
  const time = Date.parse(endsAt);
  return !Number.isFinite(time) || time <= now;
}
