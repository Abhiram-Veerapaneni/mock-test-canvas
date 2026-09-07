/**
 * seed.js — Fresh exam seeder for Mock Test Canvas
 *
 * Creates 4 exams across JEE / GATE / NEET / APTITUDE streams,
 * each with 6–8 questions covering MCQ, MSQ, and NAT types,
 * all with correct answers pre-marked.
 *
 * Usage:
 *   cd server
 *   node src/seeds/seed.js
 *
 * WARNING: Drops ALL existing exams, questions, and attempts before seeding.
 */

import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fix Node.js Windows SRV DNS resolution issue for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Exam } from '../models/Exam.model.js';
import { Question } from '../models/Question.model.js';
import { Attempt } from '../models/Attempt.model.js';

// ────────────────────────────────────────────────────────────────────────────
// EXAM DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const exams = [
  // ── 1. JEE Advanced Mock ──────────────────────────────────────────────────
  {
    meta: {
      title: 'JEE Advanced 2025 — Full Mock Paper I',
      description: 'A comprehensive mock covering Physics, Chemistry, and Mathematics as per JEE Advanced 2025 pattern. Includes MCQ, MSQ, and NAT type questions with strict negative marking.',
      category: 'JEE',
      durationMinutes: 180,
      markingScheme: { correct: 4, incorrect: -1 },
      maxAttempts: null, // unlimited
      proctorSettings: { faceCheck: true, audioCheck: true, fullScreenLock: true, liveNotifications: true, maxWarningsAllowed: 3 }
    },
    questions: [
      {
        questionText: 'A particle moves in a circle of radius $R$ with constant speed $v$. The magnitude of the centripetal acceleration is:',
        questionType: 'MCQ',
        subject: 'Physics',
        topic: 'Circular Motion',
        options: ['$vR$', '$\\frac{v^2}{R}$', '$\\frac{v}{R^2}$', '$Rv^2$'],
        correctAnswers: [1],
        explanation: 'Centripetal acceleration $a_c = \\frac{v^2}{R}$. This is directed towards the centre of the circle.'
      },
      {
        questionText: 'Which of the following statements are correct for an ideal gas undergoing an isothermal process?',
        questionType: 'MSQ',
        subject: 'Physics',
        topic: 'Thermodynamics',
        options: [
          'Internal energy remains constant',
          'Temperature remains constant',
          'Work done by gas equals heat absorbed',
          'Pressure remains constant'
        ],
        correctAnswers: [0, 1, 2],
        explanation: 'In an isothermal process, T = constant → ΔU = 0 (ideal gas) → Q = W. Pressure changes as volume changes (PV = nRT = const).'
      },
      {
        questionText: 'The de Broglie wavelength of an electron (mass $m_e$) moving with kinetic energy $K$ is:',
        questionType: 'MCQ',
        subject: 'Physics',
        topic: 'Modern Physics',
        options: ['$\\frac{h}{\\sqrt{2m_e K}}$', '$\\frac{h}{2m_e K}$', '$\\sqrt{\\frac{h}{2m_e K}}$', '$\\frac{2m_e K}{h}$'],
        correctAnswers: [0],
        explanation: 'de Broglie wavelength: $\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2m_e K}}$'
      },
      {
        questionText: 'The equilibrium constant $K_p$ for the reaction $\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3$ at 500 K is $6 \\times 10^{-2}\\text{ atm}^{-2}$. If the equilibrium partial pressure of $\\text{N}_2$ is 0.5 atm and $\\text{H}_2$ is 3 atm, what is the equilibrium partial pressure (in atm) of $\\text{NH}_3$? (Enter exact numeric value)',
        questionType: 'NAT',
        subject: 'Chemistry',
        topic: 'Chemical Equilibrium',
        options: [],
        correctAnswers: [0.9, 0.9],
        explanation: '$K_p = \\frac{p_{\\text{NH}_3}^2}{p_{\\text{N}_2} \\cdot p_{\\text{H}_2}^3} = 6 \\times 10^{-2}$ → $p_{\\text{NH}_3}^2 = 0.06 \\times 0.5 \\times 27 = 0.81$ → $p_{\\text{NH}_3} = 0.9$ atm.'
      },
      {
        questionText: 'Which of the following are aromatic compounds according to Hückel\'s rule?',
        questionType: 'MSQ',
        subject: 'Chemistry',
        topic: 'Organic Chemistry — Aromaticity',
        options: ['Benzene', 'Cyclooctatetraene', 'Pyridine', 'Cyclopentadienyl anion ($C_5H_5^-$)'],
        correctAnswers: [0, 2, 3],
        explanation: 'Aromatic compounds satisfy Hückel\'s rule (4n+2 π electrons, planar, cyclic). Benzene (6π), Pyridine (6π), and cyclopentadienyl anion (6π) are aromatic. Cyclooctatetraene (8π, non-planar tub shape) is non-aromatic.'
      },
      {
        questionText: 'If $f(x) = \\sin^{-1}\\!\\left(\\frac{2x}{1+x^2}\\right)$, then $f\'(x)$ for $|x| < 1$ is:',
        questionType: 'MCQ',
        subject: 'Mathematics',
        topic: 'Differentiation',
        options: ['$\\frac{2}{1+x^2}$', '$\\frac{1}{1+x^2}$', '$\\frac{-2}{1+x^2}$', '$\\frac{2x}{1+x^2}$'],
        correctAnswers: [0],
        explanation: 'Let $x = \\tan\\theta$. Then $f(x) = \\sin^{-1}(\\sin 2\\theta) = 2\\theta = 2\\tan^{-1}x$. Differentiating: $f\'(x) = \\frac{2}{1+x^2}$.'
      },
      {
        questionText: 'The number of inflection points on the curve $y = x^4 - 6x^2 + 5$ is:',
        questionType: 'NAT',
        subject: 'Mathematics',
        topic: 'Application of Derivatives',
        options: [],
        correctAnswers: [2, 2],
        explanation: '$y\' = 4x^3 - 12x$, $y\'\' = 12x^2 - 12 = 12(x-1)(x+1) = 0 \\implies x = 1, x = -1$. The sign of $y\'\'$ changes across both roots, giving 2 inflection points.'
      }
    ]
  },

  // ── 2. GATE CS Mock ───────────────────────────────────────────────────────
  {
    meta: {
      title: 'GATE 2025 — Computer Science & IT Mock',
      description: 'Covers Data Structures, Algorithms, Operating Systems, DBMS, Computer Networks, and Discrete Mathematics as per GATE CS 2025 syllabus.',
      category: 'GATE',
      durationMinutes: 180,
      markingScheme: { correct: 2, incorrect: -0.67 },
      maxAttempts: null,
      proctorSettings: { faceCheck: true, audioCheck: true, fullScreenLock: true, maxWarningsAllowed: 3 }
    },
    questions: [
      {
        questionText: 'The time complexity of building a binary heap from $n$ arbitrary elements using the bottom-up heapify approach is:',
        questionType: 'MCQ',
        subject: 'Data Structures',
        topic: 'Heaps',
        options: ['$O(n \\log n)$', '$O(n^2)$', '$O(n)$', '$O(\\log n)$'],
        correctAnswers: [2],
        explanation: 'Building a heap using the bottom-up heapify approach takes $O(n)$ time due to the converging sum $\\sum_{h=0}^{\\lfloor\\log n\\rfloor} \\frac{h}{2^h} = 2$.'
      },
      {
        questionText: 'In a virtual memory system with page size 4 KB, how many bits are needed for the page offset?',
        questionType: 'NAT',
        subject: 'Operating Systems',
        topic: 'Memory Management',
        options: [],
        correctAnswers: [12, 12],
        explanation: '$4\\ \\text{KB} = 4 \\times 1024\\text{ bytes} = 4096 = 2^{12}\\text{ bytes} \\implies 12\\text{ bits}$ are required for page offset.'
      },
      {
        questionText: 'Which of the following normal forms does NOT allow multi-valued dependencies (MVDs)?',
        questionType: 'MCQ',
        subject: 'DBMS',
        topic: 'Normalization',
        options: ['2NF', '3NF', 'BCNF', '4NF'],
        correctAnswers: [3],
        explanation: '4NF (Fourth Normal Form) specifically eliminates non-trivial multi-valued dependencies. BCNF only addresses functional dependencies.'
      },
      {
        questionText: 'Which of the following problems are NP-complete?',
        questionType: 'MSQ',
        subject: 'Algorithms',
        topic: 'Complexity Theory',
        options: ['0/1 Knapsack Decision Problem', 'Hamiltonian Cycle Problem', 'Shortest Path (Dijkstra)', 'Vertex Cover Problem'],
        correctAnswers: [0, 1, 3],
        explanation: '0/1 Knapsack, Hamiltonian Cycle, and Vertex Cover are all classic NP-complete problems. Single-source shortest path with Dijkstra runs in polynomial time $O(E + V \\log V)$ and is in P.'
      },
      {
        questionText: 'The number of distinct binary trees that can be formed with 3 unlabeled nodes is:',
        questionType: 'NAT',
        subject: 'Data Structures',
        topic: 'Binary Trees',
        options: [],
        correctAnswers: [5, 5],
        explanation: 'The number of distinct binary search trees or binary tree topologies with $n$ nodes is given by the $n$-th Catalan number $C_n = \\frac{1}{n+1}\\binom{2n}{n}$. For $n=3$: $C_3 = \\frac{1}{4}\\binom{6}{3} = \\frac{20}{4} = 5$.'
      },
      {
        questionText: 'Which layer of the OSI model is responsible for logical addressing (IP) and routing of packets?',
        questionType: 'MCQ',
        subject: 'Computer Networks',
        topic: 'OSI Model',
        options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Session Layer'],
        correctAnswers: [1],
        explanation: 'The Network Layer (Layer 3) handles logical IP addressing, routing protocols (BGP, OSPF), and forwarding packets across subnets.'
      }
    ]
  },

  // ── 3. NEET Biology Mock ──────────────────────────────────────────────────
  {
    meta: {
      title: 'NEET 2025 — Biology Full Mock',
      description: 'Covers Botany and Zoology as per NEET 2025 syllabus. All MCQ format with +4 / -1 marking as per official NEET pattern.',
      category: 'NEET',
      durationMinutes: 200,
      markingScheme: { correct: 4, incorrect: -1 },
      maxAttempts: 3,
      proctorSettings: { faceCheck: true, audioCheck: true, fullScreenLock: true, maxWarningsAllowed: 2 }
    },
    questions: [
      {
        questionText: 'Which of the following is the site of oxygenic photosynthesis in cyanobacteria?',
        questionType: 'MCQ',
        subject: 'Biology',
        topic: 'Photosynthesis',
        options: ['Chloroplast', 'Thylakoid membranes in cytoplasm', 'Mitochondria', 'Golgi apparatus'],
        correctAnswers: [1],
        explanation: 'Cyanobacteria are prokaryotes and lack membrane-bound chloroplasts. Photosynthesis occurs in specialized intracytoplasmic thylakoid membranes.'
      },
      {
        questionText: 'The process of formation of mature spermatozoa from a single primary spermatocyte involves:',
        questionType: 'MCQ',
        subject: 'Biology',
        topic: 'Reproduction',
        options: [
          '1 meiosis I → 2 spermatids → 2 sperms',
          '1 meiosis I + 1 meiosis II → 2 spermatids → 2 sperms',
          '1 meiosis I + 1 meiosis II → 4 spermatids → 4 sperms',
          '2 meiosis I + 1 meiosis II → 4 spermatids → 4 sperms'
        ],
        correctAnswers: [2],
        explanation: 'Spermatogenesis: 1 Primary spermatocyte (2n) undergoes Meiosis I to form 2 secondary spermatocytes (n), which undergo Meiosis II to produce 4 spermatids, differentiating into 4 spermatozoa.'
      },
      {
        questionText: 'Which enzyme is responsible for joining Okazaki fragments on the lagging strand during DNA replication?',
        questionType: 'MCQ',
        subject: 'Biology',
        topic: 'Molecular Biology',
        options: ['DNA Polymerase I', 'DNA Primase', 'DNA Ligase', 'DNA Helicase'],
        correctAnswers: [2],
        explanation: 'DNA Ligase catalyzes the formation of phosphodiester bonds to join adjacent Okazaki fragments on the lagging strand.'
      },
      {
        questionText: 'Which hormone is secreted by the adrenal medulla during acute stress (the "fight or flight" response)?',
        questionType: 'MCQ',
        subject: 'Biology',
        topic: 'Endocrine System',
        options: ['Insulin', 'Glucagon', 'Adrenaline (Epinephrine)', 'Thyroxine'],
        correctAnswers: [2],
        explanation: 'Adrenaline (Epinephrine) from the adrenal medulla elevates heart rate, blood pressure, and blood glucose during emergency responses.'
      },
      {
        questionText: 'In a diploid human cell with 2n = 46, how many chromosomes are present at Metaphase I of meiosis?',
        questionType: 'NAT',
        subject: 'Biology',
        topic: 'Cell Division',
        options: [],
        correctAnswers: [46, 46],
        explanation: 'At Metaphase I, 46 chromosomes (forming 23 homologous pairs/bivalents) are aligned along the equatorial plate. Reduction division completes after Anaphase I.'
      },
      {
        questionText: 'The Krebs (Citric Acid) cycle takes place in which cellular compartment in eukaryotes?',
        questionType: 'MCQ',
        subject: 'Biology',
        topic: 'Cellular Respiration',
        options: ['Cytoplasm', 'Outer mitochondrial membrane', 'Mitochondrial matrix', 'Thylakoid lumen'],
        correctAnswers: [2],
        explanation: 'The citric acid cycle enzymes are located in the mitochondrial matrix (except succinate dehydrogenase, which is membrane-bound).'
      }
    ]
  },

  // ── 4. Aptitude / Placement Mock ─────────────────────────────────────────
  {
    meta: {
      title: 'Campus Placement Aptitude — Full Mock',
      description: 'Quantitative Aptitude, Logical Reasoning, and Verbal Ability mock test designed for engineering campus placements (TCS, Infosys, Wipro, Accenture pattern).',
      category: 'APTITUDE',
      durationMinutes: 60,
      markingScheme: { correct: 1, incorrect: 0 },
      maxAttempts: null,
      proctorSettings: { faceCheck: false, audioCheck: false, fullScreenLock: true, maxWarningsAllowed: 5 }
    },
    questions: [
      {
        questionText: 'A train 150 m long passes a pole in 15 seconds. How long (in seconds) will it take to pass a platform 300 m long?',
        questionType: 'MCQ',
        subject: 'Quantitative Aptitude',
        topic: 'Time, Speed & Distance',
        options: ['30 seconds', '45 seconds', '20 seconds', '25 seconds'],
        correctAnswers: [1],
        explanation: 'Speed = 150 m / 15 s = 10 m/s. Total distance to cross platform = 150 + 300 = 450 m. Time = 450 m / 10 m/s = 45 seconds.'
      },
      {
        questionText: 'If $A : B = 3 : 4$ and $B : C = 5 : 6$, then what is the ratio $A : B : C$?',
        questionType: 'MCQ',
        subject: 'Quantitative Aptitude',
        topic: 'Ratios & Proportions',
        options: ['15 : 20 : 24', '3 : 4 : 6', '5 : 6 : 8', '12 : 15 : 20'],
        correctAnswers: [0],
        explanation: '$A:B = 3:4$, $B:C = 5:6$. Make $B$ common (LCM of 4 and 5 is 20): $A:B = 15:20$, $B:C = 20:24 \\implies A:B:C = 15:20:24$.'
      },
      {
        questionText: 'Find the next number in the series: 2, 6, 12, 20, 30, __',
        questionType: 'NAT',
        subject: 'Logical Reasoning',
        topic: 'Number Series',
        options: [],
        correctAnswers: [42, 42],
        explanation: 'Pattern: $1 \\times 2 = 2$, $2 \\times 3 = 6$, $3 \\times 4 = 12$, $4 \\times 5 = 20$, $5 \\times 6 = 30$, $6 \\times 7 = 42$.'
      },
      {
        questionText: 'Which of the following words is most nearly OPPOSITE in meaning to "FRUGAL"?',
        questionType: 'MCQ',
        subject: 'Verbal Ability',
        topic: 'Antonyms',
        options: ['Economical', 'Thrifty', 'Extravagant', 'Prudent'],
        correctAnswers: [2],
        explanation: '"Frugal" means prudent/sparing in the use of resources. Its opposite is "Extravagant" (wasteful/lavish).'
      },
      {
        questionText: 'A pipe can fill a tank in 4 hours. Another pipe can empty it in 6 hours. If both pipes are opened together, how many hours will it take to fill the empty tank?',
        questionType: 'NAT',
        subject: 'Quantitative Aptitude',
        topic: 'Pipes & Cisterns',
        options: [],
        correctAnswers: [12, 12],
        explanation: 'Net rate per hour = $\\frac{1}{4} - \\frac{1}{6} = \\frac{3-2}{12} = \\frac{1}{12}$. Therefore, time to fill = 12 hours.'
      },
      {
        questionText: 'What is $15\\%$ of $\\frac{2}{3}$ of 900?',
        questionType: 'MCQ',
        subject: 'Quantitative Aptitude',
        topic: 'Percentages',
        options: ['90', '80', '75', '60'],
        correctAnswers: [0],
        explanation: '$\\frac{2}{3} \\times 900 = 600$. $15\\%$ of $600 = 0.15 \\times 600 = 90$.'
      },
      {
        questionText: 'Premises: "All birds can fly. Penguins are birds." Conclusion: "Penguins can fly." In deductive logic, this argument is:',
        questionType: 'MCQ',
        subject: 'Logical Reasoning',
        topic: 'Syllogisms',
        options: [
          'Logically valid (the conclusion follows from premises)',
          'Logically invalid (the major premise is factually false)',
          'Invalid because penguins cannot fly',
          'Inconclusive'
        ],
        correctAnswers: [0],
        explanation: 'In deductive logic, validity depends strictly on logical form (All A are B, C is A ⊢ C is B), independent of the factual truth of premises.'
      },
      {
        questionText: 'The simple interest on ₹5000 at 8% per annum for 3 years is ₹ ___.',
        questionType: 'NAT',
        subject: 'Quantitative Aptitude',
        topic: 'Simple Interest',
        options: [],
        correctAnswers: [1200, 1200],
        explanation: '$SI = \\frac{P \\times R \\times T}{100} = \\frac{5000 \\times 8 \\times 3}{100} = ₹1200$.'
      }
    ]
  }
];

// ────────────────────────────────────────────────────────────────────────────
// SEED RUNNER
// ────────────────────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.\n');

    // Drop existing data
    console.log('🗑  Clearing existing Exams, Questions, and Attempts...');
    await Promise.all([
      Exam.deleteMany({}),
      Question.deleteMany({}),
      Attempt.deleteMany({})
    ]);
    console.log('✅ Cleared.\n');

    for (const examDef of exams) {
      const { meta, questions } = examDef;

      // 1. Bulk insert questions (with correctAnswers stored)
      const insertedQs = await Question.insertMany(
        questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          subject: q.subject,
          topic: q.topic
        }))
      );

      const questionIds = insertedQs.map((q) => q._id);
      const totalMarks = questionIds.length * meta.markingScheme.correct;

      // 2. Create Exam document
      const exam = await Exam.create({
        ...meta,
        questions: questionIds,
        totalMarks
      });

      console.log(`📝 Created: "${exam.title}"`);
      console.log(`   Category    : ${exam.category}`);
      console.log(`   Questions   : ${questionIds.length}`);
      console.log(`   Total Marks : ${totalMarks}`);
      console.log(`   Marking     : +${meta.markingScheme.correct} / ${meta.markingScheme.incorrect}`);
      console.log(`   Max Attempts: ${meta.maxAttempts === null ? '∞ (unlimited)' : meta.maxAttempts}`);
      console.log(`   Duration    : ${meta.durationMinutes} mins`);
      console.log();
    }

    console.log(`🎉 Seeding complete! ${exams.length} exams created.\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seed();
