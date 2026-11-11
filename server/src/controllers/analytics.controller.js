import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import Question from '../models/Question.model.js';
import Attempt from '../models/Attempt.model.js';
import Exam from '../models/Exam.model.js';
import User from '../models/User.model.js';

const ALLOWED_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

/**
 * Calculates consecutive active day streak from an array of date objects/strings
 */
const calculateStreak = (dates) => {
  if (!dates || dates.length === 0) return 0;

  const daySet = new Set(
    dates.map((d) => new Date(d).toISOString().split('T')[0])
  );

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let checkDate = new Date();
  if (!daySet.has(todayStr)) {
    if (!daySet.has(yesterdayStr)) {
      return 0;
    }
    checkDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (daySet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

/**
 * Calculates median value of an array of numbers
 */
const calculateMedian = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
  }
  return Math.round(sorted[mid] * 10) / 10;
};

/**
 * @route   GET /api/analytics/me
 * @desc    Personal candidate performance dashboard analytics
 * @access  Private
 */
export const getPersonalAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all submitted non-preview attempts for this candidate
    const attempts = await Attempt.find({
      userId,
      status: 'SUBMITTED',
      isPreview: { $ne: true }
    })
      .populate('examId', 'title category totalMarks durationMinutes markingScheme')
      .sort({ submittedAt: 1, createdAt: 1 })
      .lean();

    if (!attempts || attempts.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalExamsTaken: 0,
          officialAttempts: 0,
          practiceAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          averageAccuracy: 0,
          totalTimeInvestedSeconds: 0,
          currentStreakDays: 0
        },
        trend: [],
        streamAccuracy: [],
        tagAccuracy: [],
        activeDays: []
      });
    }

    // 1. Calculate Summary Metrics
    let totalScoreOfficial = 0;
    let officialCount = 0;
    let practiceCount = 0;
    let bestScore = -Infinity;
    let totalAccuracy = 0;
    let totalTimeInvestedSeconds = 0;
    const submissionDates = [];

    const trend = attempts.map((att) => {
      const score = Number(att.score) || 0;
      const accuracy = Number(att.accuracy) || 0;
      const isPractice = Boolean(att.isPractice);
      const examTitle = att.examId?.title || 'Assessment';
      const examCategory = att.examId?.category || 'CUSTOM';
      const totalMarks = att.examId?.totalMarks || 100;
      const date = att.submittedAt || att.createdAt;

      if (date) {
        submissionDates.push(date);
      }

      if (isPractice) {
        practiceCount++;
      } else {
        officialCount++;
        totalScoreOfficial += score;
      }

      if (score > bestScore) {
        bestScore = score;
      }

      totalAccuracy += accuracy;
      totalTimeInvestedSeconds += Number(att.timeTakenSeconds) || 0;

      const percentage =
        totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 10) / 10 : 0;

      return {
        attemptId: att._id,
        examId: att.examId?._id || att.examId,
        examTitle,
        category: examCategory,
        score,
        totalMarks,
        percentage,
        accuracy: Math.round(accuracy * 10) / 10,
        isPractice,
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      };
    });

    const averageScore =
      officialCount > 0
        ? Math.round((totalScoreOfficial / officialCount) * 10) / 10
        : practiceCount > 0
        ? Math.round(
            (attempts.reduce((acc, a) => acc + (a.score || 0), 0) /
              attempts.length) *
              10
          ) / 10
        : 0;

    const averageAccuracy =
      attempts.length > 0
        ? Math.round((totalAccuracy / attempts.length) * 10) / 10
        : 0;

    const currentStreakDays = calculateStreak(submissionDates);

    // 2. Stream-wise, Tag-wise, and Category-Subject Aggregations
    // Follows industry standards (Testbook, Allen): evaluate candidate mastery based on their latest attempt per exam
    const categorySubjectPipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'SUBMITTED',
          isPreview: { $ne: true }
        }
      },
      // Pick the latest attempt for each unique exam
      { $sort: { submittedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$examId',
          latestAttempt: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestAttempt' }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      { $unwind: '$responses' },
      {
        $lookup: {
          from: 'questions',
          localField: 'responses.questionId',
          foreignField: '_id',
          as: 'q'
        }
      },
      { $unwind: '$q' },
      {
        $project: {
          category: { $ifNull: ['$exam.category', 'CUSTOM'] },
          subject: { $ifNull: ['$q.subject', { $ifNull: ['$q.stream', 'General'] }] },
          selectedAnswers: '$responses.selectedAnswers',
          correctAnswers: '$q.correctAnswers',
          isAnswered: {
            $gt: [{ $size: { $ifNull: ['$responses.selectedAnswers', []] } }, 0]
          }
        }
      },
      {
        $addFields: {
          isCorrect: {
            $and: [
              '$isAnswered',
              {
                $eq: [
                  { $setEquals: ['$selectedAnswers', '$correctAnswers'] },
                  true
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            subject: '$subject'
          },
          totalQuestions: { $sum: 1 },
          totalAnswered: { $sum: { $cond: ['$isAnswered', 1, 0] } },
          totalCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          totalIncorrect: {
            $sum: {
              $cond: [
                { $and: ['$isAnswered', { $not: '$isCorrect' }] },
                1,
                0
              ]
            }
          },
          totalUnanswered: {
            $sum: { $cond: [{ $not: '$isAnswered' }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          subject: '$_id.subject',
          totalQuestions: 1,
          totalAnswered: 1,
          totalCorrect: 1,
          totalIncorrect: 1,
          totalUnanswered: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAnswered', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalCorrect', '$totalAnswered'] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalAnswered: -1 } }
    ];

    const streamAccuracyPipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'SUBMITTED',
          isPreview: { $ne: true }
        }
      },
      { $unwind: '$responses' },
      {
        $lookup: {
          from: 'questions',
          localField: 'responses.questionId',
          foreignField: '_id',
          as: 'q'
        }
      },
      { $unwind: '$q' },
      {
        $project: {
          stream: { $ifNull: ['$q.stream', { $ifNull: ['$q.subject', 'General'] }] },
          tags: { $ifNull: ['$q.tags', []] },
          selectedAnswers: '$responses.selectedAnswers',
          correctAnswers: '$q.correctAnswers',
          isAnswered: {
            $gt: [{ $size: { $ifNull: ['$responses.selectedAnswers', []] } }, 0]
          }
        }
      },
      {
        $addFields: {
          isCorrect: {
            $and: [
              '$isAnswered',
              {
                $eq: [
                  { $setEquals: ['$selectedAnswers', '$correctAnswers'] },
                  true
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$stream',
          totalAnswered: { $sum: { $cond: ['$isAnswered', 1, 0] } },
          totalCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          totalQuestions: { $sum: 1 }
        }
      },
      {
        $project: {
          stream: '$_id',
          totalAnswered: 1,
          totalCorrect: 1,
          totalQuestions: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAnswered', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalCorrect', '$totalAnswered'] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalAnswered: -1 } }
    ];

    const tagAccuracyPipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'SUBMITTED',
          isPreview: { $ne: true }
        }
      },
      { $unwind: '$responses' },
      {
        $lookup: {
          from: 'questions',
          localField: 'responses.questionId',
          foreignField: '_id',
          as: 'q'
        }
      },
      { $unwind: '$q' },
      { $unwind: '$q.tags' },
      {
        $project: {
          tag: '$q.tags',
          stream: { $ifNull: ['$q.stream', { $ifNull: ['$q.subject', 'General'] }] },
          selectedAnswers: '$responses.selectedAnswers',
          correctAnswers: '$q.correctAnswers',
          isAnswered: {
            $gt: [{ $size: { $ifNull: ['$responses.selectedAnswers', []] } }, 0]
          }
        }
      },
      {
        $addFields: {
          isCorrect: {
            $and: [
              '$isAnswered',
              {
                $eq: [
                  { $setEquals: ['$selectedAnswers', '$correctAnswers'] },
                  true
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: { tag: '$tag', stream: '$stream' },
          totalAnswered: { $sum: { $cond: ['$isAnswered', 1, 0] } },
          totalCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          tag: '$_id.tag',
          stream: '$_id.stream',
          totalAnswered: 1,
          totalCorrect: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAnswered', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalCorrect', '$totalAnswered'] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalAnswered: -1 } },
      { $limit: 20 }
    ];

    const [categorySubjectResults, streamAccuracy, tagAccuracy] = await Promise.all([
      Attempt.aggregate(categorySubjectPipeline),
      Attempt.aggregate(streamAccuracyPipeline),
      Attempt.aggregate(tagAccuracyPipeline)
    ]);

    // Build Category-wise Subject Performance mapping
    const categoryMap = new Map();
    const examSetByCategory = new Map();

    attempts.forEach((att) => {
      const cat = att.examId?.category || 'CUSTOM';
      const examIdStr = att.examId?._id?.toString() || att.examId?.toString();
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          totalExams: 0,
          totalAttempts: 0,
          totalQuestions: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalUnanswered: 0,
          accuracy: 0,
          subjects: []
        });
        examSetByCategory.set(cat, new Set());
      }
      categoryMap.get(cat).totalAttempts += 1;
      if (examIdStr) {
        examSetByCategory.get(cat).add(examIdStr);
      }
    });

    for (const [cat, set] of examSetByCategory.entries()) {
      if (categoryMap.has(cat)) {
        categoryMap.get(cat).totalExams = set.size;
      }
    }

    categorySubjectResults.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, {
          category: item.category,
          totalExams: 0,
          totalAttempts: 0,
          totalQuestions: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalUnanswered: 0,
          accuracy: 0,
          subjects: []
        });
      }
      const entry = categoryMap.get(item.category);
      entry.totalQuestions += item.totalQuestions || 0;
      entry.totalAnswered += item.totalAnswered || 0;
      entry.totalCorrect += item.totalCorrect || 0;
      entry.totalIncorrect += item.totalIncorrect || 0;
      entry.totalUnanswered += item.totalUnanswered || 0;
      entry.subjects.push({
        subject: item.subject,
        totalQuestions: item.totalQuestions,
        totalAnswered: item.totalAnswered,
        totalCorrect: item.totalCorrect,
        totalIncorrect: item.totalIncorrect,
        totalUnanswered: item.totalUnanswered,
        accuracy: item.accuracy
      });
    });

    const categoryPerformance = Array.from(categoryMap.values()).map((c) => {
      c.accuracy =
        c.totalAnswered > 0
          ? Math.round((c.totalCorrect / c.totalAnswered) * 100 * 10) / 10
          : 0;
      c.subjects.sort((a, b) => b.totalAnswered - a.totalAnswered);
      return c;
    });

    // Format unique active days for mini-calendar / activity tracker
    const activeDays = Array.from(
      new Set(
        submissionDates.map((d) => new Date(d).toISOString().split('T')[0])
      )
    ).sort();

    return res.status(200).json({
      success: true,
      summary: {
        totalExamsTaken: attempts.length,
        officialAttempts: officialCount,
        practiceAttempts: practiceCount,
        averageScore,
        bestScore: bestScore === -Infinity ? 0 : bestScore,
        averageAccuracy,
        totalTimeInvestedSeconds,
        currentStreakDays
      },
      categoryPerformance,
      trend,
      streamAccuracy,
      tagAccuracy,
      activeDays
    });
  } catch (error) {
    console.error('[getPersonalAnalytics] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve personal performance analytics.'
    });
  }
};

/**
 * @route   GET /api/analytics/exam/:examId
 * @desc    Per-exam insights: score histogram, average, median, topic breakdowns
 * @access  Private
 */
export const getExamInsights = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Exam ID.'
      });
    }

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.'
      });
    }

    const isCreator = Boolean(
      (exam.creatorId && exam.creatorId.toString() === userId.toString()) ||
        req.user.role === 'admin'
    );

    // If creator/admin -> aggregate all candidates. Otherwise -> only candidate's attempts.
    const matchCriteria = {
      examId: new mongoose.Types.ObjectId(examId),
      status: 'SUBMITTED',
      isPreview: { $ne: true }
    };

    if (!isCreator) {
      matchCriteria.userId = new mongoose.Types.ObjectId(userId);
    }

    const attempts = await Attempt.find(matchCriteria)
      .select('score accuracy correct incorrect unanswered timeTakenSeconds submittedAt userId')
      .lean();

    if (!attempts || attempts.length === 0) {
      return res.status(200).json({
        success: true,
        exam: {
          _id: exam._id,
          title: exam.title,
          category: exam.category,
          totalMarks: exam.totalMarks,
          isCreator
        },
        stats: {
          totalAttempts: 0,
          uniqueCandidates: 0,
          averageScore: 0,
          medianScore: 0,
          highestScore: 0,
          lowestScore: 0,
          averageAccuracy: 0
        },
        scoreDistribution: [],
        streamBreakdown: []
      });
    }

    const totalMarks = exam.totalMarks || 100;
    const scores = attempts.map((a) => Number(a.score) || 0);
    const accuracies = attempts.map((a) => Number(a.accuracy) || 0);
    const uniqueUserSet = new Set(attempts.map((a) => a.userId.toString()));

    const sumScore = scores.reduce((acc, s) => acc + s, 0);
    const averageScore = Math.round((sumScore / scores.length) * 10) / 10;
    const medianScore = calculateMedian(scores);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageAccuracy =
      Math.round(
        (accuracies.reduce((acc, a) => acc + a, 0) / accuracies.length) * 10
      ) / 10;

    // Decile Histogram Buckets (0-10%, 11-20%, ..., 91-100%)
    const buckets = [
      { bucket: '0–10%', count: 0 },
      { bucket: '11–20%', count: 0 },
      { bucket: '21–30%', count: 0 },
      { bucket: '31–40%', count: 0 },
      { bucket: '41–50%', count: 0 },
      { bucket: '51–60%', count: 0 },
      { bucket: '61–70%', count: 0 },
      { bucket: '71–80%', count: 0 },
      { bucket: '81–90%', count: 0 },
      { bucket: '91–100%', count: 0 }
    ];

    scores.forEach((s) => {
      const pct = totalMarks > 0 ? (s / totalMarks) * 100 : 0;
      let bIdx = Math.floor(pct / 10);
      if (bIdx >= 10) bIdx = 9;
      if (bIdx < 0) bIdx = 0;
      buckets[bIdx].count++;
    });

    // Stream-wise breakdown for this exam
    const streamPipeline = [
      { $match: matchCriteria },
      { $unwind: '$responses' },
      {
        $lookup: {
          from: 'questions',
          localField: 'responses.questionId',
          foreignField: '_id',
          as: 'q'
        }
      },
      { $unwind: '$q' },
      {
        $project: {
          stream: { $ifNull: ['$q.stream', { $ifNull: ['$q.subject', 'General'] }] },
          selectedAnswers: '$responses.selectedAnswers',
          correctAnswers: '$q.correctAnswers',
          isAnswered: {
            $gt: [{ $size: { $ifNull: ['$responses.selectedAnswers', []] } }, 0]
          }
        }
      },
      {
        $addFields: {
          isCorrect: {
            $and: [
              '$isAnswered',
              {
                $eq: [
                  { $setEquals: ['$selectedAnswers', '$correctAnswers'] },
                  true
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$stream',
          correctCount: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          incorrectCount: {
            $sum: {
              $cond: [{ $and: ['$isAnswered', { $not: '$isCorrect' }] }, 1, 0]
            }
          },
          unansweredCount: { $sum: { $cond: ['$isAnswered', 0, 1] } }
        }
      },
      {
        $project: {
          stream: '$_id',
          correctCount: 1,
          incorrectCount: 1,
          unansweredCount: 1,
          total: {
            $add: ['$correctCount', '$incorrectCount', '$unansweredCount']
          },
          accuracy: {
            $cond: [
              { $gt: [{ $add: ['$correctCount', '$incorrectCount'] }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$correctCount',
                          { $add: ['$correctCount', '$incorrectCount'] }
                        ]
                      },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ];

    const streamBreakdown = await Attempt.aggregate(streamPipeline);

    return res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        category: exam.category,
        totalMarks,
        isCreator
      },
      stats: {
        totalAttempts: attempts.length,
        uniqueCandidates: uniqueUserSet.size,
        averageScore,
        medianScore,
        highestScore,
        lowestScore,
        averageAccuracy
      },
      scoreDistribution: buckets,
      streamBreakdown
    });
  } catch (error) {
    console.error('[getExamInsights] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exam insights.'
    });
  }
};

/**
 * @route   GET /api/analytics/leaderboard
 * @desc    Global official leaderboard: aggregates official attempts, ranks users
 * @access  Public / OptionalAuth
 */
export const getLeaderboard = async (req, res) => {
  try {
    const requestingUserId = req.user?._id ? req.user._id.toString() : null;

    // Aggregate official submitted attempts across all candidates
    const leaderboardPipeline = [
      {
        $match: {
          isPractice: false,
          isPreview: { $ne: true },
          status: 'SUBMITTED'
        }
      },
      {
        $group: {
          _id: '$userId',
          attemptsCount: { $sum: 1 },
          avgScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
          avgAccuracy: { $avg: '$accuracy' },
          lastAttemptDate: { $max: '$submittedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          avatar: '$user.avatar',
          email: '$user.email',
          attemptsCount: 1,
          avgScore: { $round: ['$avgScore', 1] },
          bestScore: { $round: ['$bestScore', 1] },
          avgAccuracy: { $round: ['$avgAccuracy', 1] },
          lastAttemptDate: 1
        }
      },
      {
        $sort: {
          avgScore: -1,
          bestScore: -1,
          attemptsCount: -1
        }
      }
    ];

    const allRanked = await Attempt.aggregate(leaderboardPipeline);

    let userRankEntry = null;

    const rankedWithPositions = allRanked.map((entry, index) => {
      const position = index + 1;
      const formattedEntry = {
        rank: position,
        userId: entry.userId,
        name: entry.name || 'Anonymous Student',
        avatar: entry.avatar || '',
        attemptsCount: entry.attemptsCount,
        avgScore: entry.avgScore,
        bestScore: entry.bestScore,
        avgAccuracy: entry.avgAccuracy,
        lastAttemptDate: entry.lastAttemptDate
      };

      if (
        requestingUserId &&
        entry.userId &&
        entry.userId.toString() === requestingUserId
      ) {
        userRankEntry = formattedEntry;
      }

      return formattedEntry;
    });

    const top50 = rankedWithPositions.slice(0, 50);

    return res.status(200).json({
      success: true,
      leaderboard: top50,
      userRank: userRankEntry,
      totalRankedCandidates: rankedWithPositions.length
    });
  } catch (error) {
    console.error('[getLeaderboard] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve global leaderboard.'
    });
  }
};

/**
 * BYOK Gemini AI Explanation Controller
 * Generates an on-demand pedagogical explanation for a question using a candidate-supplied Gemini API key.
 *
 * SECURITY:
 * - The API key is read from the X-Gemini-Key header.
 * - It is never stored in the database, cookies, or files.
 * - It is never written to server logs.
 * - The GoogleGenAI instance is instantiated per-request and discarded upon scope exit.
 */
export const aiExplain = async (req, res) => {
  let geminiKey = req.headers['x-gemini-key'];
  if (!geminiKey || typeof geminiKey !== 'string' || !geminiKey.trim()) {
    return res.status(400).json({
      success: false,
      message: 'A Gemini API key is required. Please provide your key in the X-Gemini-Key header.'
    });
  }

  geminiKey = geminiKey.trim();

  const { questionId, userAnswer, correctAnswer, model } = req.body;
  const requestedModel =
    model || req.headers['x-gemini-model'] || 'gemini-3.5-flash-lite';

  const selectedModel = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'gemini-3.5-flash-lite';

  if (!questionId) {
    return res.status(400).json({
      success: false,
      message: 'Question ID is required.'
    });
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    // Format options for prompt
    const formattedOptions = (question.options || [])
      .map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const text =
          typeof opt === 'object' && opt !== null
            ? opt.text || ''
            : String(opt || '');
        return `(${letter}) ${text}`;
      })
      .join('\n');

    // Format student's answer
    let studentAnswerText = 'Not answered / Skipped';
    if (userAnswer !== undefined && userAnswer !== null) {
      if (Array.isArray(userAnswer)) {
        studentAnswerText =
          userAnswer.length > 0
            ? userAnswer
                .map((idx) =>
                  typeof idx === 'number'
                    ? `Option (${String.fromCharCode(65 + idx)})`
                    : String(idx)
                )
                .join(', ')
            : 'Not answered / Skipped';
      } else if (typeof userAnswer === 'number') {
        studentAnswerText = `Option (${String.fromCharCode(65 + userAnswer)})`;
      } else {
        studentAnswerText = String(userAnswer);
      }
    }

    // Format correct answers
    const correctAnswers = question.correctAnswers || [];
    const correctAnswerText =
      correctAnswers.length > 0
        ? correctAnswers
            .map((idx) => `Option (${String.fromCharCode(65 + idx)})`)
            .join(', ')
        : correctAnswer
        ? String(correctAnswer)
        : 'Consult question key';

    const prompt = `You are a world-class academic tutor helping a student understand their result on an assessment.

Subject/Stream: ${question.stream || question.subject || 'General'}
Topic: ${question.topic || 'General'}${question.tags?.length ? ` (Tags: ${question.tags.join(', ')})` : ''}

Question:
${question.questionText || '[Image-based question]'}

Options:
${formattedOptions || 'No options provided'}

Student's Submitted Answer: ${studentAnswerText}
Verified Correct Answer: ${correctAnswerText}
Existing Solution Hint: ${question.explanation || 'None provided'}

Provide a comprehensive, pedagogical explanation in standard Markdown.
IMPORTANT: Use standard LaTeX formatting for ALL mathematical variables, symbols, formulas, and derivations:
- Use single dollar signs ($...$) for inline math expressions, e.g., $E = mc^2$.
- Use double dollar signs ($$...$$) on their own lines for standalone equations or multi-step derivations.

Structure your response clearly with these 4 sections:
### 1. Conceptual Breakdown
Explain clearly and concisely why the correct answer is right.

### 2. Step-by-Step Solution
Walk through the mathematical derivation, logic, or calculation step-by-step.

### 3. Key Concept & Formula
Summarize the foundational rule, theorem, or equation the student should revise.

### 4. Common Pitfall & Mistake Analysis
Analyze what mistake, miscalculation, or distractor option likely led to the wrong answer, and how to avoid it in future tests.`;

    // Set up SSE streaming headers immediately to establish low-latency connection (<5ms)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy/CDN response buffering
    if (res.flushHeaders) res.flushHeaders();

    // Send immediate initial ping
    res.write(`data: ${JSON.stringify({ status: 'connected', model: selectedModel })}\n\n`);

    // Instantiate ephemeral client
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Fallback cascade: start with requested model, fallback to modern flash models if restricted/busy
    const candidateModels = [
      selectedModel,
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite'
    ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

    let streamStarted = false;
    let actualModelUsed = selectedModel;
    let lastError = null;

    for (const modelToTry of candidateModels) {
      try {
        console.log(`[BYOK AI Explain] Streaming with model: ${modelToTry}`);

        // Only pass thinkingConfig to models that support it (Gemini 3.8).
        // Models like gemini-3.5-flash-lite reject thinkingConfig with 400 INVALID_ARGUMENT.
        const streamConfig = {};
        if (modelToTry.includes('3.8')) {
          streamConfig.thinkingConfig = {
            thinkingLevel: 'minimal' // Minimal thinking: bypasses deep reasoning for instant streaming
          };
        }

        const stream = await ai.models.generateContentStream({
          model: modelToTry,
          contents: prompt,
          config: Object.keys(streamConfig).length > 0 ? streamConfig : undefined
        });

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            streamStarted = true;
            actualModelUsed = modelToTry;
            res.write(`data: ${JSON.stringify({ chunk: text, model: modelToTry })}\n\n`);
            if (res.flush) res.flush();
          }
        }

        if (streamStarted) {
          break; // Successfully finished streaming
        }
      } catch (err) {
        if (streamStarted) {
          console.error(`[BYOK AI Explain] Stream interrupted mid-generation:`, err.message);
          break;
        }

        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[BYOK AI Explain] Model "${modelToTry}" failed: ${errMsg.slice(0, 160)}`);

        // If explicitly an invalid API key, stop immediately without attempting fallbacks
        if (
          errMsg.includes('API_KEY_INVALID') ||
          errMsg.includes('API key not valid')
        ) {
          res.write(
            `data: ${JSON.stringify({
              error: 'Invalid Gemini API key. Please verify your key at Google AI Studio (aistudio.google.com).'
            })}\n\n`
          );
          return res.end();
        }

        // If permission denied / blocked project
        if (errMsg.includes('PERMISSION_DENIED') || err?.status === 403) {
          res.write(
            `data: ${JSON.stringify({
              error: 'Permission denied. Please ensure your Gemini API key has Generative Language API access enabled.'
            })}\n\n`
          );
          return res.end();
        }

        // Try next fallback model
        continue;
      }
    }

    if (!streamStarted) {
      const finalErr = lastError?.message || '';
      let userFriendlyErr =
        'Failed to generate explanation. All attempted models were unavailable or busy. Please check your Google AI Studio quota.';
      if (finalErr.includes('RESOURCE_EXHAUSTED') || finalErr.includes('quota')) {
        userFriendlyErr =
          'Gemini API quota exceeded for this key. Please check your Google AI Studio quota.';
      }
      res.write(`data: ${JSON.stringify({ error: userFriendlyErr })}\n\n`);
      return res.end();
    }

    res.write(`data: ${JSON.stringify({ done: true, model: actualModelUsed })}\n\n`);
    res.end();
  } catch (error) {
    const errorMsg = error?.message || '';
    console.error('[AI Explain] Fatal Error:', errorMsg);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate AI explanation stream.'
      });
    }

    res.write(
      `data: ${JSON.stringify({
        error: 'Connection interrupted while generating explanation.'
      })}\n\n`
    );
    res.end();
  } finally {
    // Force garbage collection reference release
    geminiKey = null;
  }
};
