import { JeeAdvancedPaper } from '../models/JeeAdvancedPaper.js';
import { Exam } from '../models/Exam.js';
import { Attempt } from '../models/Attempt.js';

/**
 * Get all available Exams / Previous Year Papers
 */
export const getAllExams = async (req, res) => {
  try {
    const papers = await JeeAdvancedPaper.find({}).select('-sections.questions');
    const exams = await Exam.find({});
    
    // Normalize into a single unified list for the catalog
    const catalog = [
      ...papers.map((p) => ({
        _id: p._id,
        title: p.title,
        examType: p.examType || 'JEE_ADVANCED',
        year: p.year || 2024,
        paperNumber: p.paperNumber || 'Paper 1',
        description: p.description || 'JEE Advanced Previous Year Paper',
        durationMinutes: p.durationMinutes || 180,
        totalMarks: p.totalMarks || 120,
        totalQuestions: p.totalQuestions || 35,
        isPreviousYearPaper: true
      })),
      ...exams.map((e) => ({
        _id: e._id,
        title: e.title,
        examType: e.examType || 'JEE_ADVANCED',
        year: 2024,
        paperNumber: 'Mock Test',
        description: e.description || 'Proctored Mock Test',
        durationMinutes: e.durationMinutes || 180,
        totalMarks: e.totalMarks || 120,
        totalQuestions: e.sections ? e.sections.reduce((acc, s) => acc + (s.questionIds?.length || 0), 0) : 35,
        isPreviousYearPaper: false
      }))
    ];

    res.json({
      success: true,
      catalog,
      papers,
      exams
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: 'Server error fetching exams' });
  }
};

/**
 * Get single Exam or Paper details by ID or Title
 */
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    let paper = await JeeAdvancedPaper.findById(id).catch(() => null);
    if (!paper) {
      paper = await JeeAdvancedPaper.findOne({ title: id });
    }

    if (paper) {
      return res.json({
        success: true,
        exam: paper
      });
    }

    const examDoc = await Exam.findById(id).populate('sections.questionIds').catch(() => null);
    if (examDoc) {
      const formattedSections = examDoc.sections.map((sec) => ({
        name: sec.name,
        subject: sec.subject,
        questionCount: sec.questionIds.length,
        questions: sec.questionIds
      }));

      return res.json({
        success: true,
        exam: {
          _id: examDoc._id,
          title: examDoc.title,
          examType: examDoc.examType,
          description: examDoc.description,
          durationMinutes: examDoc.durationMinutes,
          totalMarks: examDoc.totalMarks,
          totalQuestions: formattedSections.reduce((a, s) => a + s.questionCount, 0),
          sections: formattedSections,
          proctoringConfig: examDoc.proctoringConfig
        }
      });
    }

    return res.status(404).json({ success: false, message: 'Exam paper not found' });
  } catch (error) {
    console.error('Error fetching exam paper:', error);
    res.status(500).json({ success: false, message: 'Server error fetching exam paper' });
  }
};

/**
 * Submit Exam Attempt & Calculate Score
 */
export const submitExamAttempt = async (req, res) => {
  try {
    const { examId, userResponses = {}, timeSpentSeconds = 0 } = req.body;
    const userId = req.user?._id; // If authenticated

    let paper = await JeeAdvancedPaper.findById(examId).catch(() => null);
    let examTitle = '';
    let examType = 'JEE_ADVANCED';
    let allQuestions = [];
    let subjectSections = [];

    if (paper) {
      examTitle = paper.title;
      examType = paper.examType;
      subjectSections = paper.sections;
      paper.sections.forEach((sec) => {
        sec.questions.forEach((q) => {
          allQuestions.push({ ...q.toObject(), subject: sec.subject || sec.name });
        });
      });
    } else {
      const examDoc = await Exam.findById(examId).populate('sections.questionIds').catch(() => null);
      if (examDoc) {
        examTitle = examDoc.title;
        examType = examDoc.examType;
        examDoc.sections.forEach((sec) => {
          const secQuestions = sec.questionIds.map((q) => ({ ...q.toObject(), subject: sec.subject }));
          subjectSections.push({ name: sec.name, subject: sec.subject, questions: secQuestions });
          secQuestions.forEach((q) => allQuestions.push(q));
        });
      }
    }

    if (allQuestions.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam questions not found' });
    }

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const subjectBreakdownMap = {};

    // Process each question for evaluation
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

      const resp = userResponses[qId];
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
        const userArr = Array.isArray(val) ? val.map((v) => String(v).trim().toUpperCase()).sort() : [String(val).trim().toUpperCase()];
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

    const subjectBreakdown = Object.values(subjectBreakdownMap);

    const scoreResult = {
      examTitle,
      examType,
      totalScore,
      maxScore,
      overallPercentage,
      totalQuestions: allQuestions.length,
      attemptedCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracyPercentage,
      timeSpentSeconds,
      subjectBreakdown
    };

    // Save Attempt to database if user is logged in
    let attemptId = null;
    if (userId) {
      const attemptDoc = await Attempt.create({
        examId,
        examTitle,
        examType,
        userId,
        status: 'SUBMITTED',
        summaryStats: {
          totalScore,
          maxScore,
          totalQuestions: allQuestions.length,
          attemptedCount,
          correctCount,
          incorrectCount,
          unansweredCount,
          accuracyPercentage,
          totalTimeSpentSec: timeSpentSeconds
        },
        submittedAt: new Date()
      }).catch((e) => console.error('Attempt save log:', e));

      if (attemptDoc) attemptId = attemptDoc._id;
    }

    res.json({
      success: true,
      attemptId,
      scoreResult
    });
  } catch (error) {
    console.error('Error calculating score attempt:', error);
    res.status(500).json({ success: false, message: 'Server error processing exam submission' });
  }
};
