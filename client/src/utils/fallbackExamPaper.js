export const FALLBACK_EXAM_PAPER = {
  _id: 'jee-adv-2024-p1',
  title: 'JEE Advanced 2024 - Paper 1 (Slot 1)',
  examType: 'JEE_ADVANCED',
  durationMinutes: 180,
  totalMarks: 180,
  sections: [
    {
      name: 'Mathematics',
      subject: 'Mathematics',
      questionCount: 3,
      questions: [
        {
          _id: 'm1',
          questionNumber: 1,
          questionType: 'MCQ',
          subject: 'Mathematics',
          questionText: 'Let f: R -> R be a differentiable function such that f(0) = 0, f(1) = 1 and f\'(x) > 0 for all x in [0, 1]. Find the value of integral from 0 to 1 of f(x) dx + integral from 0 to 1 of f^-1(y) dy.',
          options: ['0.5', '1.0', '1.5', '2.0'],
          correctAnswer: '1.0',
          positiveMarks: 4,
          negativeMarks: 1,
          explanation: 'By Young inequality or geometric area decomposition of inverse functions, int f(x)dx + int f^-1(y)dy = 1 * 1 - 0 * 0 = 1.'
        },
        {
          _id: 'm2',
          questionNumber: 2,
          questionType: 'NUMERICAL',
          subject: 'Mathematics',
          questionText: 'If the matrix A = [[1, 2], [0, 1]], compute the determinant of A^2024.',
          correctAnswer: '1',
          numericalTolerance: 0.01,
          positiveMarks: 4,
          negativeMarks: 0,
          explanation: 'det(A) = 1*1 - 2*0 = 1. Therefore det(A^2024) = (det A)^2024 = 1^2024 = 1.'
        },
        {
          _id: 'm3',
          questionNumber: 3,
          questionType: 'MSQ',
          subject: 'Mathematics',
          questionText: 'Which of the following functions are continuous at x = 0?',
          options: ['f(x) = x * sin(1/x) for x != 0, f(0) = 0', 'g(x) = cos(x)', 'h(x) = |x|', 'k(x) = 1/x for x != 0'],
          correctAnswer: ['f(x) = x * sin(1/x) for x != 0, f(0) = 0', 'g(x) = cos(x)', 'h(x) = |x|'],
          positiveMarks: 4,
          negativeMarks: 2,
          explanation: 'Functions f, g, and h are continuous at x=0. k(x) is discontinuous at x=0.'
        }
      ]
    },
    {
      name: 'Physics',
      subject: 'Physics',
      questionCount: 2,
      questions: [
        {
          _id: 'p1',
          questionNumber: 4,
          questionType: 'MCQ',
          subject: 'Physics',
          questionText: 'A particle of mass m moves under a central force field with potential V(r) = -k/r. What is the orbit eccentricity when the total energy E = 0?',
          options: ['0 (Circle)', '1 (Parabola)', 'Hyperbola', 'Ellipse'],
          correctAnswer: '1 (Parabola)',
          positiveMarks: 4,
          negativeMarks: 1,
          explanation: 'For total mechanical energy E = 0 in a Kepler central potential, the trajectory is parabolic with eccentricity e = 1.'
        },
        {
          _id: 'p2',
          questionNumber: 5,
          questionType: 'NUMERICAL',
          subject: 'Physics',
          questionText: 'A photon of wavelength 400 nm strikes a metal surface with work function 2.0 eV. Calculate the maximum kinetic energy of emitted photoelectrons in eV. (Take hc = 1240 eV.nm)',
          correctAnswer: '1.1',
          numericalTolerance: 0.05,
          positiveMarks: 4,
          negativeMarks: 0,
          explanation: 'Photon energy E = 1240 / 400 = 3.1 eV. Max KE = E - Work Function = 3.1 - 2.0 = 1.1 eV.'
        }
      ]
    },
    {
      name: 'Chemistry',
      subject: 'Chemistry',
      questionCount: 2,
      questions: [
        {
          _id: 'c1',
          questionNumber: 6,
          questionType: 'MCQ',
          subject: 'Chemistry',
          questionText: 'Which of the following coordination complex ions exhibits optical isomerism?',
          options: ['[Co(NH3)6]3+', 'trans-[Co(en)2Cl2]+', 'cis-[Co(en)2Cl2]+', '[PtCl4]2-'],
          correctAnswer: 'cis-[Co(en)2Cl2]+',
          positiveMarks: 4,
          negativeMarks: 1,
          explanation: 'cis-[Co(en)2Cl2]+ lacks a plane or center of symmetry, thus making it chiral and optically active.'
        },
        {
          _id: 'c2',
          questionNumber: 7,
          questionType: 'NUMERICAL',
          subject: 'Chemistry',
          questionText: 'Calculate the pH of a 0.01 M HCl aqueous solution at 25 deg C.',
          correctAnswer: '2',
          numericalTolerance: 0.01,
          positiveMarks: 4,
          negativeMarks: 0,
          explanation: 'pH = -log10[H+] = -log10(10^-2) = 2.'
        }
      ]
    }
  ]
};
