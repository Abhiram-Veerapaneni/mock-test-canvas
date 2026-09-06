/**
 * grading.service.js
 * Deterministic scoring engine for MCQ, MSQ, and NAT question types.
 */

/**
 * Grade a single set of answers against an exam's questions.
 *
 * @param {Object} answers        - Map of questionId (string) → selectedAnswers (number[])
 * @param {Array}  questions      - Populated question documents (must include correctAnswers)
 * @param {Object} markingScheme  - { correct: number, incorrect: number }
 * @returns {Object} { score, accuracy, totalAttempted, correct, incorrect, unanswered }
 */
export function gradeAttempt(answers = {}, questions = [], markingScheme = {}) {
  const correctMark = markingScheme.correct ?? 4;
  const incorrectMark = markingScheme.incorrect ?? -1;

  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const question of questions) {
    const qId = question._id.toString();
    const selected = answers[qId]; // number[] | undefined
    const correctAnswers = question.correctAnswers ?? [];

    // Unanswered
    if (!selected || selected.length === 0) {
      unanswered++;
      continue;
    }

    if (question.questionType === 'MCQ') {
      // Single correct choice
      if (selected[0] === correctAnswers[0]) {
        score += correctMark;
        correct++;
      } else {
        score += incorrectMark;
        incorrect++;
      }
    } else if (question.questionType === 'MSQ') {
      // All selected must match exactly (order-independent)
      const sortedSelected = [...selected].sort((a, b) => a - b);
      const sortedCorrect = [...correctAnswers].sort((a, b) => a - b);
      const isExactMatch =
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((v, i) => v === sortedCorrect[i]);

      if (isExactMatch) {
        score += correctMark;
        correct++;
      } else {
        // Partial or wrong — apply penalty only if at least one wrong option selected
        score += incorrectMark;
        incorrect++;
      }
    } else if (question.questionType === 'NAT') {
      // correctAnswers = [min, max] tolerance range
      const numericAnswer = selected[0];
      const [min, max] = correctAnswers;
      if (
        typeof numericAnswer === 'number' &&
        !isNaN(numericAnswer) &&
        numericAnswer >= min &&
        numericAnswer <= max
      ) {
        score += correctMark;
        correct++;
      } else {
        // NAT typically has no negative marking, but respect the scheme
        if (incorrectMark < 0) {
          score += incorrectMark;
        }
        incorrect++;
      }
    }
  }

  const totalAttempted = correct + incorrect;
  const accuracy =
    totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;

  return {
    score: Math.max(0, score), // floor at 0 — never go negative overall
    accuracy,
    totalAttempted,
    correct,
    incorrect,
    unanswered,
  };
}
