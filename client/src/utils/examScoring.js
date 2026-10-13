/**
 * Compute candidate exam scores locally when backend grading endpoint is unreachable.
 */
export const computeOfflineScore = (examDoc, responses, timeSpentSecs) => {
  let allQuestions = [];
  const subjectBreakdownMap = {};
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  (examDoc?.sections || []).forEach((sec) => {
    (sec.questions || []).forEach((q) => {
      allQuestions.push({ ...q, subject: sec.subject || sec.name });
    });
  });

  allQuestions.forEach((q, idx) => {
    const qId = q._id ? String(q._id) : String(idx);
    const posMarks = q.positiveMarks || 4;
    const negMarks = q.negativeMarks || 1;
    maxScore += posMarks;

    const subject = q.subject || 'General';
    if (!subjectBreakdownMap[subject]) {
      subjectBreakdownMap[subject] = {
        subject,
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        scoreEarned: 0,
        maxScore: 0
      };
    }
    subjectBreakdownMap[subject].totalQuestions += 1;
    subjectBreakdownMap[subject].maxScore += posMarks;

    const resp = responses?.[qId];
    const val = resp?.value;

    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
      unansweredCount++;
      subjectBreakdownMap[subject].unanswered++;
      return;
    }

    subjectBreakdownMap[subject].attempted++;
    let isCorrect = false;

    if (q.questionType === 'MCQ') {
      isCorrect = String(val).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
    } else if (q.questionType === 'MSQ') {
      const userArr = Array.isArray(val)
        ? val.map((v) => String(v).trim().toUpperCase()).sort()
        : [String(val).trim().toUpperCase()];
      const correctArr = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map((v) => String(v).trim().toUpperCase()).sort()
        : [String(q.correctAnswer).trim().toUpperCase()];
      isCorrect = userArr.length === correctArr.length && userArr.every((v, i) => v === correctArr[i]);
    } else if (q.questionType === 'NUMERICAL' || q.questionType === 'NAT') {
      const userNum = parseFloat(val);
      const correctNum = parseFloat(q.correctAnswer);
      const tolerance = q.numericalTolerance || 0.01;
      if (!isNaN(userNum) && !isNaN(correctNum)) {
        isCorrect = Math.abs(userNum - correctNum) <= tolerance;
      }
    }

    if (isCorrect) {
      totalScore += posMarks;
      correctCount++;
      subjectBreakdownMap[subject].correct++;
      subjectBreakdownMap[subject].scoreEarned += posMarks;
    } else {
      totalScore -= negMarks;
      incorrectCount++;
      subjectBreakdownMap[subject].incorrect++;
      subjectBreakdownMap[subject].scoreEarned -= negMarks;
    }
  });

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    examTitle: examDoc?.title,
    examType: examDoc?.examType || 'JEE_ADVANCED',
    totalScore,
    maxScore,
    overallPercentage,
    totalQuestions: allQuestions.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    accuracyPercentage,
    timeSpentSeconds: timeSpentSecs,
    subjectBreakdown: Object.values(subjectBreakdownMap)
  };
};
