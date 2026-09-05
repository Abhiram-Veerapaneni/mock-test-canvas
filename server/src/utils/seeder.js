import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { User } from '../models/User.model.js';
import { Question } from '../models/Question.model.js';
import { Exam } from '../models/Exam.model.js';

dotenv.config();

const sampleQuestions = [
  // 1. Mathematics - Integral Calculus (MCQ)
  {
    questionText: 'Evaluate the definite integral: $$\\int_{0}^{\\pi/2} \\frac{\\sin^3(x)}{\\sin^3(x) + \\cos^3(x)} \\, dx$$',
    questionType: 'MCQ',
    options: [
      '$\\frac{\\pi}{4}$',
      '$\\frac{\\pi}{2}$',
      '$\\pi$',
      '$\\frac{\\pi}{8}$'
    ],
    correctAnswers: [0],
    explanation: 'Using King\'s property of definite integrals: $I = \\int_{0}^{a} f(x) dx = \\int_{0}^{a} f(a-x) dx$. Adding both expressions yields $2I = \\int_{0}^{\\pi/2} 1 \\, dx = \\frac{\\pi}{2}$, hence $I = \\frac{\\pi}{4}$.',
    subject: 'Mathematics',
    topic: 'Definite Integration'
  },
  // 2. Physics - Electrodynamics & Vectors (MCQ)
  {
    questionText: 'A particle with charge $q = 2 \\times 10^{-6} \\text{ C}$ moves with velocity $\\vec{v} = 3\\hat{i} + 4\\hat{j} \\text{ m/s}$ in a magnetic field $\\vec{B} = 2\\hat{k} \\text{ T}$. Determine the magnitude of the Lorentz magnetic force $\\vec{F} = q(\\vec{v} \\times \\vec{B})$.',
    questionType: 'MCQ',
    options: [
      '$1.0 \\times 10^{-5} \\text{ N}$',
      '$2.0 \\times 10^{-5} \\text{ N}$',
      '$1.4 \\times 10^{-5} \\text{ N}$',
      '$2.8 \\times 10^{-5} \\text{ N}$'
    ],
    correctAnswers: [0],
    explanation: '$\\vec{v} \\times \\vec{B} = (3\\hat{i} + 4\\hat{j}) \\times 2\\hat{k} = -6\\hat{j} + 8\\hat{i}$. The magnitude is $\\sqrt{8^2 + (-6)^2} = 10 \\text{ m/s}\\cdot\\text{T}$. Thus $F = q |\\vec{v} \\times \\vec{B}| = 2\\times 10^{-6} \\times 10 = 2.0 \\times 10^{-5} \\text{ N}$. Wait, option B is $2.0 \\times 10^{-5} \\text{ N}$. Let\'s select index 1.',
    correctAnswers: [1],
    subject: 'Physics',
    topic: 'Magnetism & Lorentz Force'
  },
  // 3. Chemistry - Chemical Kinetics (MSQ)
  {
    questionText: 'For an elementary reaction $A + 2B \\rightarrow C$, which of the following statements are correct? (Select all that apply)',
    questionType: 'MSQ',
    options: [
      'The rate law expression is given by $r = k[A][B]^2$.',
      'The overall reaction order is $3$.',
      'The units of rate constant $k$ are $\\text{L}^2\\cdot\\text{mol}^{-2}\\cdot\\text{s}^{-1}$.',
      'Doubling the concentration of $[B]$ while keeping $[A]$ constant quadruples the initial reaction rate.'
    ],
    correctAnswers: [0, 1, 2, 3],
    explanation: 'Since the reaction is elementary, the molecularity equals the reaction order. Rate $r = k[A]^1[B]^2$, overall order $n = 1 + 2 = 3$. Units for order 3 are $(\\text{mol/L})^{1-3} \\text{s}^{-1} = \\text{L}^2\\text{mol}^{-2}\\text{s}^{-1}$.',
    subject: 'Chemistry',
    topic: 'Chemical Kinetics'
  },
  // 4. Mathematics - Matrix Algebra & Eigenvalues (MSQ)
  {
    questionText: 'Consider the symmetric matrix $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. Which of the following properties are true?',
    questionType: 'MSQ',
    options: [
      'The eigenvalues of $M$ are $\\lambda_1 = 3$ and $\\lambda_2 = 1$.',
      'The determinant of $M$ is $\\det(M) = 3$.',
      'The trace of $M$ is $\\text{Tr}(M) = 4$.',
      'The eigenvectors corresponding to distinct eigenvalues are mutually orthogonal.'
    ],
    correctAnswers: [0, 1, 2, 3],
    explanation: 'Characteristic polynomial $\\det(M - \\lambda I) = (2-\\lambda)^2 - 1 = \\lambda^2 - 4\\lambda + 3 = 0 \\implies (\\lambda-3)(\\lambda-1) = 0$. Trace $= 2 + 2 = 4$, Determinant $= 4 - 1 = 3$. Symmetric matrices have orthogonal eigenvectors.',
    subject: 'Mathematics',
    topic: 'Linear Algebra'
  },
  // 5. Physics - Quantum Mechanics & De Broglie Wavelength (NAT)
  {
    questionText: 'An electron is accelerated from rest through an electric potential difference of $V = 150 \\text{ Volts}$. Calculate its de Broglie wavelength in Angstroms ($\\text{\\AA}$). Given: $\\lambda \\approx \\sqrt{\\frac{150}{V}} \\text{\\AA}$.',
    questionType: 'NAT',
    options: [],
    correctAnswers: [1.0, 1.0], // boundary [min, max]
    explanation: '$\\lambda = \\sqrt{\\frac{150}{V}} = \\sqrt{\\frac{150}{150}} = 1.00 \\text{\\AA}$.',
    subject: 'Physics',
    topic: 'Modern Physics'
  },
  // 6. Chemistry - Thermodynamics & Free Energy (MCQ)
  {
    questionText: 'For a chemical process at constant temperature $T = 300 \\text{ K}$, $\\Delta H = -30.0 \\text{ kJ/mol}$ and $\\Delta S = -100 \\text{ J/(mol}\\cdot\\text{K)}$. What is the Gibbs free energy change $\\Delta G$?',
    questionType: 'MCQ',
    options: [
      '$\\Delta G = 0 \\text{ kJ/mol}$ (At Equilibrium)',
      '$\\Delta G = -60 \\text{ kJ/mol}$ (Spontaneous)',
      '$\\Delta G = +30 \\text{ kJ/mol}$ (Non-spontaneous)',
      '$\\Delta G = -15 \\text{ kJ/mol}$ (Spontaneous)'
    ],
    correctAnswers: [0],
    explanation: '$\\Delta G = \\Delta H - T\\Delta S = -30,000 \\text{ J/mol} - (300 \\text{ K})(-100 \\text{ J/mol}\\cdot\\text{K}) = -30,000 + 30,000 = 0 \\text{ kJ/mol}$.',
    subject: 'Chemistry',
    topic: 'Thermodynamics'
  },
  // 7. Mathematics - Limits & Series (MCQ)
  {
    questionText: 'Find the limit: $$\\lim_{x \\to 0} \\frac{e^{x^2} - \\cos(x)}{x^2}$$',
    questionType: 'MCQ',
    options: [
      '$\\frac{3}{2}$',
      '$\\frac{1}{2}$',
      '$1$',
      '$2$'
    ],
    correctAnswers: [0],
    explanation: 'Taylor expansion: $e^{x^2} = 1 + x^2 + O(x^4)$ and $\\cos(x) = 1 - \\frac{x^2}{2} + O(x^4)$. Thus $\\frac{1 + x^2 - (1 - x^2/2)}{x^2} = \\frac{3/2 x^2}{x^2} = \\frac{3}{2}$.',
    subject: 'Mathematics',
    topic: 'Calculus'
  },
  // 8. Physics - Rotational Dynamics (MCQ)
  {
    questionText: 'A solid uniform sphere of mass $M$ and radius $R$ rolls without slipping down an inclined plane of height $h$. What is the linear velocity of its center of mass at the bottom?',
    questionType: 'MCQ',
    options: [
      '$v = \\sqrt{\\frac{10}{7}gh}$',
      '$v = \\sqrt{2gh}$',
      '$v = \\sqrt{\\frac{4}{3}gh}$',
      '$v = \\sqrt{\\frac{5}{7}gh}$'
    ],
    correctAnswers: [0],
    explanation: 'Conservation of energy: $Mgh = \\frac{1}{2}Mv^2 + \\frac{1}{2}I\\omega^2$. With $I = \\frac{2}{5}MR^2$ and $\\omega = v/R$: $Mgh = \\frac{1}{2}Mv^2 + \\frac{1}{5}Mv^2 = \\frac{7}{10}Mv^2 \\implies v = \\sqrt{\\frac{10}{7}gh}$.',
    subject: 'Physics',
    topic: 'Rotational Motion'
  },
  // 9. Chemistry - Coordination Compounds & Ligands (MSQ)
  {
    questionText: 'Regarding the complex ion $[\\text{Co}(\\text{NH}_3)_6]^{3+}$, which statements are correct? (Atomic number of $\\text{Co} = 27$)',
    questionType: 'MSQ',
    options: [
      'The oxidation state of Cobalt is $+3$.',
      'It has a $d^6$ electronic configuration with zero unpaired electrons (diamagnetic).',
      'It involves $d^2sp^3$ hybridization (inner orbital complex).',
      'The complex geometry is regular octahedral.'
    ],
    correctAnswers: [0, 1, 2, 3],
    explanation: '$\\text{Co}^{3+}$ has $3d^6$. $\\text{NH}_3$ acts as a strong field ligand causing pairing of electrons in $t_{2g}^6 e_g^0$. Hybridization is $d^2sp^3$, octahedral geometry, diamagnetic.',
    subject: 'Chemistry',
    topic: 'Coordination Chemistry'
  },
  // 10. Mathematics - Numerical Value Answer (NAT)
  {
    questionText: 'Let $f(x) = x^3 - 3x^2 + 2x$. Find the number of distinct real roots of the derivative equation $f\'(x) = 0$.',
    questionType: 'NAT',
    options: [],
    correctAnswers: [2, 2], // exactly 2 roots
    explanation: '$f\'(x) = 3x^2 - 6x + 2$. The discriminant $\\Delta = (-6)^2 - 4(3)(2) = 36 - 24 = 12 > 0$. Hence there are exactly 2 distinct real roots.',
    subject: 'Mathematics',
    topic: 'Differential Calculus'
  }
];

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] MongoDB connected.');

    // 1. Create default admin/test user if doesn't exist
    let user = await User.findOne({ email: 'candidate@mockcanvas.com' });
    if (!user) {
      user = await User.create({
        name: 'Arjun Sharma',
        email: 'candidate@mockcanvas.com',
        password: 'Password123!'
      });
      console.log('[Seeder] Created default test candidate: candidate@mockcanvas.com / Password123!');
    }

    let admin = await User.findOne({ email: 'admin@mockcanvas.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Professor Rao',
        email: 'admin@mockcanvas.com',
        password: 'AdminPassword123!'
      });
      console.log('[Seeder] Created default admin: admin@mockcanvas.com / AdminPassword123!');
    }

    // 2. Clear existing sample questions and exams with this title to allow re-seeding
    await Question.deleteMany({ subject: { $in: ['Mathematics', 'Physics', 'Chemistry'] } });
    await Exam.deleteMany({ title: 'JEE Advanced Full Benchmark Mock - STEM Canvas' });

    // 3. Bulk insert questions
    const createdQuestions = await Question.insertMany(sampleQuestions);
    console.log(`[Seeder] Inserted ${createdQuestions.length} STEM questions with LaTeX notation.`);

    // 4. Create Master Benchmark Exam
    const exam = await Exam.create({
      title: 'JEE Advanced Full Benchmark Mock - STEM Canvas',
      description: 'Comprehensive 10-question STEM benchmark test featuring Physics, Chemistry, and Mathematics with MCQ, MSQ, and NAT problems.',
      category: 'JEE',
      creatorId: admin._id,
      durationMinutes: 60,
      totalMarks: 40,
      markingScheme: {
        correct: 4,
        incorrect: -1
      },
      questions: createdQuestions.map((q) => q._id),
      proctorSettings: {
        faceCheck: true,
        audioCheck: true,
        fullScreenLock: true,
        maxWarningsAllowed: 3
      }
    });

    // Also register under admin's createdTests
    await User.findByIdAndUpdate(admin._id, {
      $addToSet: { createdTests: exam._id }
    });

    console.log(`[Seeder] Created Exam "${exam.title}" (ID: ${exam._id}).`);
    console.log('[Seeder] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
