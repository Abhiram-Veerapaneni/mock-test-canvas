import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix Node.js Windows SRV DNS resolution issue for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Question } from '../models/Question.model.js';

// ────────────────────────────────────────────────────────────────────────────
// QUESTION DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const aptitudeProfitLossQuestions = [
  {
    questionText: 'A trader sells an article at a profit of 20%. If he had bought it at 10% less and sold it for Rs. 18 less, he would have gained 25%. Find the cost price of the article.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Arithmetic', 'Aptitude'],
    options: [
      { text: 'Rs. 150', image: '' },
      { text: 'Rs. 180', image: '' },
      { text: 'Rs. 200', image: '' },
      { text: 'Rs. 220', image: '' }
    ],
    correctAnswers: [2],
    explanation: 'Let CP be $100x$.\nSP$_1 = 120x$.\nIf new CP $= 90x$ and profit is $25\\%$, new SP $= 90x \\times 1.25 = 112.5x$.\nDifference in SP $= 120x - 112.5x = 7.5x = 18 \\implies x = 2.4$.\nCost Price $= 100x = Rs. 200$.',
    isInBank: true
  },
  {
    questionText: 'A shopkeeper marks his goods at 30% above the cost price and allows a discount of 15% for cash payment. What is his net profit percentage?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Discount', 'Aptitude'],
    options: [
      { text: '10.5%', image: '' },
      { text: '11.25%', image: '' },
      { text: '10%', image: '' },
      { text: '12.5%', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Let CP $= 100$.\nMarked Price $= 130$.\nSP after $15\\%$ discount $= 130 \\times (1 - 0.15) = 130 \\times 0.85 = 110.5$.\nProfit percentage $= 110.5 - 100 = 10.5\\%$.',
    isInBank: true
  },
  {
    questionText: 'If the cost price of 15 articles is equal to the selling price of 12 articles, find the gain percentage.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Ratios', 'Aptitude'],
    options: [
      { text: '20%', image: '' },
      { text: '25%', image: '' },
      { text: '30%', image: '' },
      { text: '16.67%', image: '' }
    ],
    correctAnswers: [1],
    explanation: '$15 \\times CP = 12 \\times SP \\implies \\frac{SP}{CP} = \\frac{15}{12} = \\frac{5}{4}$.\nProfit percentage $= \\frac{5 - 4}{4} \\times 100\\% = \\frac{1}{4} \\times 100\\% = 25\\%$.',
    isInBank: true
  },
  {
    questionText: 'A dishonest dealer professes to sell his goods at cost price, but uses a false weight of 900 grams instead of 1 kilogram. What is his real gain percent?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Dishonest Dealer', 'Aptitude'],
    options: [
      { text: '10%', image: '' },
      { text: '11 1/9 % ($11.\\bar{1}\\%$)', image: '' },
      { text: '9 1/11 %', image: '' },
      { text: '12%', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Gain percent $= \\frac{\\text{Error}}{\\text{True value} - \\text{Error}} \\times 100\\% = \\frac{100}{1000 - 100} \\times 100\\% = \\frac{100}{900} \\times 100\\% = \\frac{100}{9}\\% = 11\\frac{1}{9}\\%$.',
    isInBank: true
  },
  {
    questionText: 'A person sells two chairs for Rs. 990 each. On one he gains 10% and on the other he loses 10%. What is his overall gain or loss percentage?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Aptitude'],
    options: [
      { text: 'No profit no loss', image: '' },
      { text: '1% loss', image: '' },
      { text: '1% gain', image: '' },
      { text: '2% loss', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'When two items are sold at the same selling price, one at a gain of $x\\%$ and the other at a loss of $x\\%$, there is always an overall loss given by $\\frac{x^2}{100}\\%$.\nHere, Loss $= \\frac{10^2}{100}\\% = \\frac{100}{100}\\% = 1\\%$ loss.',
    isInBank: true
  },
  {
    questionText: 'By selling 33 metres of cloth, a merchant gains the selling price of 11 metres. What is his profit percentage?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Aptitude'],
    options: [
      { text: '33.33%', image: '' },
      { text: '50%', image: '' },
      { text: '25%', image: '' },
      { text: '40%', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Let SP of 1 metre cloth be Rs. 1.\nSP of 33 metres $= Rs. 33$.\nProfit $= SP \\text{ of } 11 \\text{ metres} = Rs. 11$.\n$CP = SP - \\text{Profit} = 33 - 11 = 22$.\nProfit percent $= \\frac{11}{22} \\times 100\\% = 50\\%$.',
    isInBank: true
  },
  {
    questionText: 'An article is sold at a loss of 10%. Had it been sold for Rs. 90 more, there would have been a gain of 8%. Find the cost price of the article.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Aptitude'],
    options: [
      { text: 'Rs. 450', image: '' },
      { text: 'Rs. 500', image: '' },
      { text: 'Rs. 540', image: '' },
      { text: 'Rs. 600', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Difference between $8\\%$ gain and $10\\%$ loss is $8\\% - (-10\\%) = 18\\%$ of CP.\n$18\\%$ of CP $= Rs. 90 \\implies CP = \\frac{90 \\times 100}{18} = Rs. 500$.',
    isInBank: true
  },
  {
    questionText: 'Successive discounts of 20%, 10%, and 5% are equivalent to a single net discount of:',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Discount', 'Aptitude'],
    options: [
      { text: '31.6%', image: '' },
      { text: '32.5%', image: '' },
      { text: '35%', image: '' },
      { text: '30%', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Net multiplier $= (1 - 0.20)(1 - 0.10)(1 - 0.05) = 0.80 \\times 0.90 \\times 0.95 = 0.684$.\nEquivalent discount $= 1 - 0.684 = 0.316 = 31.6\\%$.',
    isInBank: true
  },
  {
    questionText: 'A milkman buys milk at Rs. 24 per litre. He adds water in the ratio 4:1 (milk:water) and sells the mixture at Rs. 27 per litre. What is his profit percent? (Water is free of cost)',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Mixtures', 'Aptitude'],
    options: [
      { text: '35%', image: '' },
      { text: '40.625%', image: '' },
      { text: '37.5%', image: '' },
      { text: '42%', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Consider 4 litres of milk and 1 litre of water (total 5 litres mixture).\nCost of 4 litres of milk $= 4 \\times 24 = Rs. 96$.\nSelling price of 5 litres mixture $= 5 \\times 27 = Rs. 135$.\nProfit $= 135 - 96 = Rs. 39$.\nProfit percentage $= \\frac{39}{96} \\times 100\\% = \\frac{13}{32} \\times 100\\% = 40.625\\%$.',
    isInBank: true
  },
  {
    questionText: 'A vendor bought 6 toffees for a rupee. How many toffees for a rupee must he sell to gain 20%?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'Profit & Loss',
    tags: ['Profit & Loss', 'Aptitude'],
    options: [
      { text: '3', image: '' },
      { text: '4', image: '' },
      { text: '5', image: '' },
      { text: '6', image: '' }
    ],
    correctAnswers: [2],
    explanation: 'CP of 6 toffees $= Rs. 1 \\implies CP$ of 1 toffee $= \\frac{1}{6}$ rupee.\nDesired SP of 1 toffee with $20\\%$ gain $= \\frac{1}{6} \\times 1.20 = \\frac{1.2}{6} = \\frac{1}{5}$ rupee.\nSince SP of 1 toffee is $\\frac{1}{5}$ rupee, the vendor must sell 5 toffees for a rupee.',
    isInBank: true
  }
];

const aptitudeSICIQuestions = [
  {
    questionText: 'At what annual rate of simple interest will a principal sum of money double itself in 8 years?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Simple Interest', 'Aptitude'],
    options: [
      { text: '10%', image: '' },
      { text: '12.5%', image: '' },
      { text: '15%', image: '' },
      { text: '8.5%', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'If principal $P$ doubles, Amount $= 2P \\implies SI = P$.\n$SI = \\frac{P \\times R \\times T}{100} \\implies P = \\frac{P \\times R \\times 8}{100} \\implies R = \\frac{100}{8} = 12.5\\%$.',
    isInBank: true
  },
  {
    questionText: 'A sum of Rs. 12,000 deposited at compound interest doubles itself after 5 years. What will it amount to after 20 years?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Compound Interest', 'Aptitude'],
    options: [
      { text: 'Rs. 96,000', image: '' },
      { text: 'Rs. 1,44,000', image: '' },
      { text: 'Rs. 1,92,000', image: '' },
      { text: 'Rs. 2,40,000', image: '' }
    ],
    correctAnswers: [2],
    explanation: 'The sum doubles every 5 years.\nIn 20 years, there are $\\frac{20}{5} = 4$ doubling cycles.\nAmount $= 12,000 \\times 2^4 = 12,000 \\times 16 = Rs. 1,92,000$.',
    isInBank: true
  },
  {
    questionText: 'The difference between simple interest and compound interest on a certain principal at 10% per annum for 2 years is Rs. 144. Find the principal sum.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Interest Difference', 'Aptitude'],
    options: [
      { text: 'Rs. 12,000', image: '' },
      { text: 'Rs. 14,400', image: '' },
      { text: 'Rs. 15,000', image: '' },
      { text: 'Rs. 16,000', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'For 2 years, difference between CI and SI $= P\\left(\\frac{R}{100}\\right)^2$.\n$144 = P \\times \\left(\\frac{10}{100}\\right)^2 = P \\times \\frac{1}{100} \\implies P = 144 \\times 100 = Rs. 14,400$.',
    isInBank: true
  },
  {
    questionText: 'A sum of money invested at simple interest amounts to Rs. 850 in 3 years and to Rs. 925 in 4 years. What is the principal sum?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Simple Interest', 'Aptitude'],
    options: [
      { text: 'Rs. 600', image: '' },
      { text: 'Rs. 625', image: '' },
      { text: 'Rs. 650', image: '' },
      { text: 'Rs. 700', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Simple interest for 1 year $= 925 - 850 = Rs. 75$.\nSimple interest for 3 years $= 3 \\times 75 = Rs. 225$.\nPrincipal $= A_3 - SI_3 = 850 - 225 = Rs. 625$.',
    isInBank: true
  },
  {
    questionText: 'What will be the compound interest on Rs. 16,000 for 9 months at 20% per annum compounded quarterly?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Compound Interest', 'Aptitude'],
    options: [
      { text: 'Rs. 2,522', image: '' },
      { text: 'Rs. 2,400', image: '' },
      { text: 'Rs. 2,640', image: '' },
      { text: 'Rs. 2,500', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Compounded quarterly $\\implies R = \\frac{20}{4} = 5\\%$ per quarter.\nTime $= 9$ months $= 3$ quarters.\nAmount $= 16,000 \\times \\left(1 + \\frac{5}{100}\\right)^3 = 16,000 \\times \\left(\\frac{21}{20}\\right)^3 = 16,000 \\times \\frac{9261}{8000} = 2 \\times 9261 = Rs. 18,522$.\n$CI = 18,522 - 16,000 = Rs. 2,522$.',
    isInBank: true
  },
  {
    questionText: 'A sum of money amounts to Rs. 6,690 after 3 years and to Rs. 10,035 after 6 years on compound interest. Find the principal sum.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Compound Interest', 'Aptitude'],
    options: [
      { text: 'Rs. 4,460', image: '' },
      { text: 'Rs. 4,500', image: '' },
      { text: 'Rs. 4,200', image: '' },
      { text: 'Rs. 4,600', image: '' }
    ],
    correctAnswers: [0],
    explanation: '$P(1+r)^3 = 6690$ and $P(1+r)^6 = 10035$.\nDividing the two: $(1+r)^3 = \\frac{10035}{6690} = \\frac{3}{2}$.\nSubstituting back: $P \\times \\frac{3}{2} = 6690 \\implies P = \\frac{6690 \\times 2}{3} = 2230 \\times 2 = Rs. 4,460$.',
    isInBank: true
  },
  {
    questionText: 'In how many years will Rs. 2,000 yield Rs. 662 as compound interest at 10% per annum compounded annually?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Compound Interest', 'Aptitude'],
    options: [
      { text: '2 years', image: '' },
      { text: '3 years', image: '' },
      { text: '4 years', image: '' },
      { text: '5 years', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Amount $= 2000 + 662 = Rs. 2662$.\n$A = P\\left(1 + \\frac{R}{100}\\right)^n \\implies 2662 = 2000\\left(1 + \\frac{10}{100}\\right)^n$.\n$\\frac{2662}{2000} = \\frac{1331}{1000} = \\left(\\frac{11}{10}\\right)^3 = \\left(\\frac{11}{10}\\right)^n \\implies n = 3$ years.',
    isInBank: true
  },
  {
    questionText: 'A sum of money placed at compound interest triples itself in 4 years. In how many years will it become 27 times itself at the same rate?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Compound Interest', 'Aptitude'],
    options: [
      { text: '8 years', image: '' },
      { text: '12 years', image: '' },
      { text: '16 years', image: '' },
      { text: '20 years', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'If a sum becomes $3$ times in 4 years, it becomes $3^k$ times in $4 \\times k$ years.\nSince $27 = 3^3$, $k = 3$.\nTime required $= 4 \\times 3 = 12$ years.',
    isInBank: true
  },
  {
    questionText: 'The simple interest on a certain sum for 2 years at 8% per annum is Rs. 400. What would be the compound interest on the same sum for the same period at the same rate?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Compound Interest', 'Aptitude'],
    options: [
      { text: 'Rs. 416', image: '' },
      { text: 'Rs. 420', image: '' },
      { text: 'Rs. 424', image: '' },
      { text: 'Rs. 408', image: '' }
    ],
    correctAnswers: [0],
    explanation: '$SI = \\frac{P \\times 8 \\times 2}{100} = 400 \\implies P = \\frac{40000}{16} = Rs. 2500$.\n$CI = P\\left[\\left(1 + \\frac{8}{100}\\right)^2 - 1\\right] = 2500\\left[\\left(\\frac{27}{25}\\right)^2 - 1\\right] = 2500\\left[\\frac{729 - 625}{625}\\right] = 4 \\times 104 = Rs. 416$.',
    isInBank: true
  },
  {
    questionText: 'If the difference between CI and SI on a certain sum of money for 3 years at 5% per annum is Rs. 122, find the principal amount.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'SI & CI',
    tags: ['SI & CI', 'Interest Difference', 'Aptitude'],
    options: [
      { text: 'Rs. 15,000', image: '' },
      { text: 'Rs. 16,000', image: '' },
      { text: 'Rs. 18,000', image: '' },
      { text: 'Rs. 20,000', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Difference for 3 years $= P\\left(\\frac{R}{100}\\right)^2\\left(3 + \\frac{R}{100}\\right)$.\n$122 = P\\left(\\frac{5}{100}\\right)^2\\left(3 + \\frac{5}{100}\\right) = P \\times \\frac{1}{400} \\times \\frac{61}{20} = P \\times \\frac{61}{8000}$.\n$P = \\frac{122 \\times 8000}{61} = 2 \\times 8000 = Rs. 16,000$.',
    isInBank: true
  }
];

const aptitudeHCFQuestions = [
  {
    questionText: 'Find the greatest number that will divide 148, 246, and 623 leaving remainders 4, 6, and 11 respectively.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Number Theory', 'Aptitude'],
    options: [
      { text: '12', image: '' },
      { text: '16', image: '' },
      { text: '18', image: '' },
      { text: '24', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Required number is $\\text{HCF}(148-4, 246-6, 623-11) = \\text{HCF}(144, 240, 612)$.\n$144 = 16 \\times 9$\n$240 = 16 \\times 15$\n$612 = 36 \\times 17$\n$\\text{HCF}(144, 240, 612) = 16$ (since $144/16 = 9, 240/16 = 15$, but let\'s verify: $\\gcd(144, 240) = 48$, $\\gcd(48, 612) = 12$? Wait, $612 = 12 \\times 51$. If HCF is 12, $148\\%12=4, 246\\%12=6, 623\\%12=11$. Ah, 12! Wait, let\'s check options: $12$: $148=12\\times12+4$, $246=20\\times12+6$, $623=51\\times12+11$. So 12 is correct!',
    options: [
      { text: '12', image: '' },
      { text: '14', image: '' },
      { text: '16', image: '' },
      { text: '18', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Subtract the remainders: $148 - 4 = 144$, $246 - 6 = 240$, $623 - 11 = 612$.\n$\\gcd(144, 240) = 48$.\n$\\gcd(48, 612) = \\gcd(48, 36) = 12$.\nHence, the greatest number is 12.',
    isInBank: true
  },
  {
    questionText: 'The HCF and LCM of two numbers are 11 and 385 respectively. If one of the numbers is 77, find the other number.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Aptitude'],
    options: [
      { text: '45', image: '' },
      { text: '55', image: '' },
      { text: '65', image: '' },
      { text: '75', image: '' }
    ],
    correctAnswers: [1],
    explanation: '$\\text{Product of two numbers} = \\text{HCF} \\times \\text{LCM}$.\n$77 \\times x = 11 \\times 385 \\implies x = \\frac{11 \\times 385}{77} = \\frac{385}{7} = 55$.',
    isInBank: true
  },
  {
    questionText: 'Four bells toll together at intervals of 6, 8, 12, and 18 seconds respectively. In 36 minutes, how many times will they toll together excluding the initial simultaneous toll?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Time Intervals', 'Aptitude'],
    options: [
      { text: '25', image: '' },
      { text: '30', image: '' },
      { text: '36', image: '' },
      { text: '40', image: '' }
    ],
    correctAnswers: [1],
    explanation: '$\\text{LCM}(6, 8, 12, 18) = 72$ seconds.\nThe bells toll together every 72 seconds.\nTotal time $= 36 \\text{ minutes} = 36 \\times 60 = 2160$ seconds.\nNumber of times $= \\frac{2160}{72} = 30$ times.',
    isInBank: true
  },
  {
    questionText: 'Find the smallest number which when divided by 20, 25, 35, and 40 leaves remainders 14, 19, 29, and 34 respectively.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Remainders', 'Aptitude'],
    options: [
      { text: '1394', image: '' },
      { text: '1400', image: '' },
      { text: '1406', image: '' },
      { text: '1386', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Notice the constant difference: $20 - 14 = 6$, $25 - 19 = 6$, $35 - 29 = 6$, $40 - 34 = 6$.\n$\\text{LCM}(20, 25, 35, 40) = 1400$.\nRequired smallest number $= \\text{LCM} - 6 = 1400 - 6 = 1394$.',
    isInBank: true
  },
  {
    questionText: 'The ratio of two positive numbers is 3:4 and their HCF is 4. What is their LCM?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Ratios', 'Aptitude'],
    options: [
      { text: '36', image: '' },
      { text: '48', image: '' },
      { text: '60', image: '' },
      { text: '72', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Let numbers be $3x$ and $4x$. Since $\\text{HCF} = x = 4$, the numbers are $12$ and $16$.\n$\\text{LCM}(12, 16) = 48$.',
    isInBank: true
  },
  {
    questionText: 'Find the HCF of fractions $\\frac{2}{3}, \\frac{8}{9}, \\frac{16}{81}$, and $\\frac{10}{27}$.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Fractions', 'Aptitude'],
    options: [
      { text: '2/81', image: '' },
      { text: '80/3', image: '' },
      { text: '2/3', image: '' },
      { text: '160/81', image: '' }
    ],
    correctAnswers: [0],
    explanation: '$\\text{HCF of fractions} = \\frac{\\text{HCF of numerators}}{\\text{LCM of denominators}}$.\n$\\text{HCF}(2, 8, 16, 10) = 2$.\n$\\text{LCM}(3, 9, 81, 27) = 81$.\n$\\text{Result} = \\frac{2}{81}$.',
    isInBank: true
  },
  {
    questionText: 'Find the LCM of the fractions $\\frac{2}{3}, \\frac{3}{5}, \\frac{4}{7}$, and $\\frac{9}{13}$.',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Fractions', 'Aptitude'],
    options: [
      { text: '36', image: '' },
      { text: '1/1365', image: '' },
      { text: '18', image: '' },
      { text: '72', image: '' }
    ],
    correctAnswers: [0],
    explanation: '$\\text{LCM of fractions} = \\frac{\\text{LCM of numerators}}{\\text{HCF of denominators}}$.\n$\\text{LCM}(2, 3, 4, 9) = 36$.\n$\\text{HCF}(3, 5, 7, 13) = 1$.\n$\\text{Result} = \\frac{36}{1} = 36$.',
    isInBank: true
  },
  {
    questionText: 'The sum of two numbers is 216 and their HCF is 27. How many such pairs of numbers are possible?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Number Theory', 'Aptitude'],
    options: [
      { text: '1', image: '' },
      { text: '2', image: '' },
      { text: '3', image: '' },
      { text: '4', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Let numbers be $27a$ and $27b$ where $\\gcd(a, b) = 1$.\n$27a + 27b = 216 \\implies a + b = 8$.\nCo-prime pairs $(a, b)$ with sum 8 are $(1, 7)$ and $(3, 5)$.\nHence, exactly 2 pairs are possible: $(27, 189)$ and $(81, 135)$.',
    isInBank: true
  },
  {
    questionText: 'What is the greatest four-digit number which is exactly divisible by 12, 15, 18, and 27?',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Aptitude'],
    options: [
      { text: '9690', image: '' },
      { text: '9720', image: '' },
      { text: '9930', image: '' },
      { text: '9960', image: '' }
    ],
    correctAnswers: [1],
    explanation: '$\\text{LCM}(12, 15, 18, 27) = 540$.\nGreatest 4-digit number $= 9999$.\n$9999 \\div 540 = 18$ with remainder $279$.\nRequired number $= 9999 - 279 = 9720$.',
    isInBank: true
  },
  {
    questionText: 'The product of two numbers is 4107. If the HCF of these numbers is 37, then the greater number is:',
    questionType: 'MCQ',
    subject: 'Aptitude',
    stream: 'Aptitude',
    topic: 'HCF & LCM',
    tags: ['HCF & LCM', 'Aptitude'],
    options: [
      { text: '101', image: '' },
      { text: '107', image: '' },
      { text: '111', image: '' },
      { text: '185', image: '' }
    ],
    correctAnswers: [2],
    explanation: 'Let numbers be $37a$ and $37b$ with $\\gcd(a, b) = 1$.\n$37a \\times 37b = 4107 \\implies a \\times b = \\frac{4107}{1369} = 3$.\nSince $a \\times b = 3$ and 3 is prime, the pair is $(1, 3)$.\nGreater number $= 37 \\times 3 = 111$.',
    isInBank: true
  }
];

// ────────────────────────────────────────────────────────────────────────────
// JEE ADVANCED QUESTIONS (MATHS, PHYSICS, CHEMISTRY)
// ────────────────────────────────────────────────────────────────────────────

const jeeMathsQuestions = [
  {
    questionText: 'Evaluate the definite integral: $I = \\int_0^{\\frac{\\pi}{2}} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} \\, dx$',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Definite Integration',
    tags: ['Definite Integration', 'Calculus', 'JEE'],
    options: [
      { text: '$\\frac{\\pi}{4}$', image: '' },
      { text: '$\\frac{\\pi}{2}$', image: '' },
      { text: '$\\pi$', image: '' },
      { text: '$0$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Using property $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$:\n$I = \\int_0^{\\frac{\\pi}{2}} \\frac{\\sqrt{\\cos x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}} dx$.\nAdding both equations: $2I = \\int_0^{\\frac{\\pi}{2}} 1 dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$.',
    isInBank: true
  },
  {
    questionText: 'If $A$ is a $3 \\times 3$ non-singular square matrix such that $A^2 = 3A$, then the determinant $\\det(A)$ is equal to:',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Matrices & Determinants',
    tags: ['Matrices & Determinants', 'Algebra', 'JEE'],
    options: [
      { text: '9', image: '' },
      { text: '27', image: '' },
      { text: '3', image: '' },
      { text: '81', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Taking determinant on both sides of $A^2 = 3A$:\n$\\det(A^2) = \\det(3A) \\implies [\\det(A)]^2 = 3^3 \\det(A) = 27 \\det(A)$.\nSince $A$ is non-singular, $\\det(A) \\neq 0$. Dividing by $\\det(A)$ gives $\\det(A) = 27$.',
    isInBank: true
  },
  {
    questionText: 'If $|z - 3 + 2i| = 4$, then the maximum value of $|z|$ is:',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Complex Numbers',
    tags: ['Complex Numbers', 'Algebra', 'JEE'],
    options: [
      { text: '$\\sqrt{13} + 4$', image: '' },
      { text: '$\\sqrt{13} - 4$', image: '' },
      { text: '4', image: '' },
      { text: '9', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Geometrically, $|z - (3 - 2i)| = 4$ represents a circle centered at $z_0 = 3 - 2i$ with radius $R = 4$.\nThe maximum distance from origin $|z|_{\\max} = |z_0| + R = \\sqrt{3^2 + (-2)^2} + 4 = \\sqrt{13} + 4$.',
    isInBank: true
  },
  {
    questionText: 'The general solution of the first-order linear differential equation $\\frac{dy}{dx} + y \\cot x = 2 \\cos x$ is:',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Differential Equations',
    tags: ['Differential Equations', 'Calculus', 'JEE'],
    options: [
      { text: '$y \\sin x = -\\frac{1}{2} \\cos 2x + C$', image: '' },
      { text: '$y \\sin x = \\frac{1}{2} \\cos 2x + C$', image: '' },
      { text: '$y \\cos x = \\sin 2x + C$', image: '' },
      { text: '$y \\sin x = \\sin^2 x + C$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Integrating factor $IF = e^{\\int \\cot x dx} = e^{\\ln(\\sin x)} = \\sin x$.\nSolution: $y \\sin x = \\int 2 \\cos x \\sin x dx = \\int \\sin 2x dx = -\\frac{1}{2} \\cos 2x + C$.',
    isInBank: true
  },
  {
    questionText: 'Two fair dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on the dice is a prime number?',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Probability',
    tags: ['Probability', 'JEE'],
    options: [
      { text: '5/12', image: '' },
      { text: '7/18', image: '' },
      { text: '1/2', image: '' },
      { text: '13/36', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Possible prime sums are $2, 3, 5, 7, 11$.\nSum 2: (1,1) $\\to$ 1\nSum 3: (1,2),(2,1) $\\to$ 2\nSum 5: (1,4),(2,3),(3,2),(4,1) $\\to$ 4\nSum 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) $\\to$ 6\nSum 11: (5,6),(6,5) $\\to$ 2\nTotal favourable outcomes $= 1 + 2 + 4 + 6 + 2 = 15$.\nProbability $= \\frac{15}{36} = \\frac{5}{12}$.',
    isInBank: true
  },
  {
    questionText: 'If $\\vec{a} = 2\\hat{i} + \\hat{j} - \\hat{k}$ and $\\vec{b} = \\hat{i} - \\hat{j} + 2\\hat{k}$, what is the scalar projection of $\\vec{a}$ on $\\vec{b}$?',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Vectors & 3D Geometry',
    tags: ['Vectors & 3D Geometry', 'Vectors', 'JEE'],
    options: [
      { text: '$-1 / \\sqrt{6}$', image: '' },
      { text: '$1 / \\sqrt{6}$', image: '' },
      { text: '$-1 / 6$', image: '' },
      { text: '$5 / \\sqrt{6}$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Projection of $\\vec{a}$ on $\\vec{b} = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{b}|}$.\n$\\vec{a} \\cdot \\vec{b} = (2)(1) + (1)(-1) + (-1)(2) = 2 - 1 - 2 = -1$.\n$|\\vec{b}| = \\sqrt{1^2 + (-1)^2 + 2^2} = \\sqrt{6}$.\nProjection $= -\\frac{1}{\\sqrt{6}}$.',
    isInBank: true
  },
  {
    questionText: 'Evaluate the limit: $\\lim_{x \\to 0} \\frac{e^{x^2} - \\cos x}{x^2}$',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Limits & Continuity',
    tags: ['Limits & Continuity', 'Calculus', 'JEE'],
    options: [
      { text: '1', image: '' },
      { text: '3/2', image: '' },
      { text: '2', image: '' },
      { text: '1/2', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Using series expansions:\n$e^{x^2} = 1 + x^2 + O(x^4)$\n$\\cos x = 1 - \\frac{x^2}{2} + O(x^4)$\nNumerator $= (1 + x^2) - (1 - \\frac{x^2}{2}) = \\frac{3}{2}x^2$.\n$\\lim_{x \\to 0} \\frac{\\frac{3}{2}x^2}{x^2} = \\frac{3}{2}$.',
    isInBank: true
  },
  {
    questionText: 'The equation of the tangent to the parabola $y^2 = 8x$ which is parallel to the line $2x - y + 1 = 0$ is:',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Coordinate Geometry',
    tags: ['Coordinate Geometry', 'Conic Sections', 'JEE'],
    options: [
      { text: '$2x - y + 1 = 0$', image: '' },
      { text: '$2x - y + 2 = 0$', image: '' },
      { text: '$2x - y - 1 = 0$', image: '' },
      { text: '$x - 2y + 1 = 0$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Parabola $y^2 = 4ax \\implies 4a = 8 \\implies a = 2$.\nSlope $m = 2$ (parallel to $2x - y + 1 = 0$).\nEquation of tangent with slope $m$: $y = mx + \\frac{a}{m} \\implies y = 2x + \\frac{2}{2} = 2x + 1 \\implies 2x - y + 1 = 0$.',
    isInBank: true
  },
  {
    questionText: 'The sum of the infinite geometric series $1 + \\frac{2}{3} + \\frac{4}{9} + \\frac{8}{27} + \\dots$ is equal to:',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Sequences & Series',
    tags: ['Sequences & Series', 'Algebra', 'JEE'],
    options: [
      { text: '2', image: '' },
      { text: '3', image: '' },
      { text: '4', image: '' },
      { text: '5/2', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'First term $a = 1$, common ratio $r = \\frac{2}{3}$.\nSince $|r| < 1$, $S_\\infty = \\frac{a}{1 - r} = \\frac{1}{1 - 2/3} = \\frac{1}{1/3} = 3$.',
    isInBank: true
  },
  {
    questionText: 'The term independent of $x$ in the binomial expansion of $\\left(x^2 - \\frac{1}{x}\\right)^9$ is:',
    questionType: 'MCQ',
    subject: 'Mathematics',
    stream: 'Mathematics',
    topic: 'Binomial Theorem',
    tags: ['Binomial Theorem', 'Algebra', 'JEE'],
    options: [
      { text: '84', image: '' },
      { text: '-84', image: '' },
      { text: '126', image: '' },
      { text: '-126', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'General term $T_{r+1} = \\binom{9}{r} (x^2)^{9-r} (-x^{-1})^r = \\binom{9}{r} (-1)^r x^{18 - 3r}$.\nFor term independent of $x$: $18 - 3r = 0 \\implies r = 6$.\n$T_7 = \\binom{9}{6} (-1)^6 = \\binom{9}{3} = \\frac{9 \\times 8 \\times 7}{6} = 84$.',
    isInBank: true
  }
];

const jeePhysicsQuestions = [
  {
    questionText: 'A solid uniform sphere of mass $M$ and radius $R$ rolls down an inclined plane of inclination $\\theta$ without slipping. The linear acceleration of the center of mass is:',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Rotational Motion',
    tags: ['Rotational Motion', 'Mechanics', 'JEE'],
    options: [
      { text: '$\\frac{5}{7} g \\sin \\theta$', image: '' },
      { text: '$\\frac{2}{5} g \\sin \\theta$', image: '' },
      { text: '$\\frac{1}{2} g \\sin \\theta$', image: '' },
      { text: '$\\frac{5}{9} g \\sin \\theta$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'For pure rolling down an incline: $a = \\frac{g \\sin \\theta}{1 + \\frac{I}{MR^2}}$.\nFor solid sphere, $I = \\frac{2}{5} MR^2 \\implies \\frac{I}{MR^2} = \\frac{2}{5}$.\n$a = \\frac{g \\sin \\theta}{1 + 2/5} = \\frac{5}{7} g \\sin \\theta$.',
    isInBank: true
  },
  {
    questionText: 'Two point charges $+q$ and $+4q$ are placed at a distance $L$ apart. Where should a third charge $Q$ be placed on the line joining them so that the system is in equilibrium?',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Electrostatics',
    tags: ['Electrostatics', 'Electrodynamics', 'JEE'],
    options: [
      { text: '$L/3$ from $+q$', image: '' },
      { text: '$L/2$ from $+q$', image: '' },
      { text: '$L/4$ from $+q$', image: '' },
      { text: '$2L/3$ from $+q$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'For equilibrium of charge $Q$ at distance $x$ from $+q$:\n$\\frac{k q Q}{x^2} = \\frac{k (4q) Q}{(L - x)^2} \\implies \\frac{1}{x} = \\frac{2}{L - x} \\implies L - x = 2x \\implies x = \\frac{L}{3}$.',
    isInBank: true
  },
  {
    questionText: 'Twelve identical resistors, each of resistance $R$, are connected along the edges of a cube. The equivalent resistance between two body-diagonally opposite corners of the cube is:',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Current Electricity',
    tags: ['Current Electricity', 'Circuits', 'JEE'],
    options: [
      { text: '$\\frac{5}{6} R$', image: '' },
      { text: '$\\frac{3}{4} R$', image: '' },
      { text: '$\\frac{7}{12} R$', image: '' },
      { text: '$R$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'By symmetry, if total current $I$ enters one corner and leaves the body diagonal corner:\nCurrent splits into $I/3$ through 3 edges, then $I/6$ through 6 edges, then $I/3$ through 3 edges.\nPotential drop $V = I_0 \\left(\\frac{R}{3} + \\frac{R}{6} + \\frac{R}{3}\\right) = I_0 \\left(\\frac{5}{6} R\\right) \\implies R_{eq} = \\frac{5}{6} R$.',
    isInBank: true
  },
  {
    questionText: 'A Carnot heat engine operates between temperatures $T_1 = 500\\text{ K}$ and $T_2 = 300\\text{ K}$. If it absorbs $1000\\text{ J}$ of heat from the hot reservoir per cycle, the work done per cycle is:',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Thermodynamics',
    tags: ['Thermodynamics', 'Heat Engines', 'JEE'],
    options: [
      { text: '400 J', image: '' },
      { text: '600 J', image: '' },
      { text: '200 J', image: '' },
      { text: '500 J', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Efficiency $\\eta = 1 - \\frac{T_2}{T_1} = 1 - \\frac{300}{500} = 1 - 0.6 = 0.4$.\nWork done $W = \\eta \\times Q_1 = 0.4 \\times 1000\\text{ J} = 400\\text{ J}$.',
    isInBank: true
  },
  {
    questionText: 'A circular coil of wire having $N$ turns and radius $R$ carries a steady current $I$. The magnetic induction $B$ at the center of the coil is:',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Magnetic Effects of Current',
    tags: ['Magnetic Effects of Current', 'Electromagnetism', 'JEE'],
    options: [
      { text: '$\\frac{\\mu_0 N I}{2R}$', image: '' },
      { text: '$\\frac{\\mu_0 N I}{4\\pi R}$', image: '' },
      { text: '$\\frac{\\mu_0 I}{2\\pi R}$', image: '' },
      { text: '$\\frac{\\mu_0 N I}{R^2}$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'From Biot-Savart Law, for a single circular loop, $B = \\frac{\\mu_0 I}{2R}$.\nFor $N$ concentric turns, $B = \\frac{\\mu_0 N I}{2R}$.',
    isInBank: true
  },
  {
    questionText: 'A biconvex lens made of glass ($\\mu_g = 1.5$) has a focal length of $20\\text{ cm}$ in air. When immersed in water ($\\mu_w = 4/3$), its focal length becomes:',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Ray Optics',
    tags: ['Ray Optics', 'Optics', 'JEE'],
    options: [
      { text: '40 cm', image: '' },
      { text: '80 cm', image: '' },
      { text: '60 cm', image: '' },
      { text: '20 cm', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Lens maker formula: $\\frac{1}{f_{air}} = (\\mu_g - 1) K = (1.5 - 1) K = 0.5 K = \\frac{1}{20} \\implies K = \\frac{1}{10}$.\nIn water: $\\frac{1}{f_w} = \\left(\\frac{\\mu_g}{\\mu_w} - 1\\right) K = \\left(\\frac{1.5}{4/3} - 1\\right) K = \\left(\\frac{9}{8} - 1\\right) \\frac{1}{10} = \\frac{1}{80} \\implies f_w = 80\\text{ cm}$.',
    isInBank: true
  },
  {
    questionText: "In Young's double slit experiment, if the separation between the slits $d$ is halved and the distance to the screen $D$ is doubled, the fringe width $\\beta$ will be:",
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Wave Optics',
    tags: ['Wave Optics', 'Optics', 'JEE'],
    options: [
      { text: 'Halved', image: '' },
      { text: 'Unchanged', image: '' },
      { text: 'Quadrupled', image: '' },
      { text: 'Doubled', image: '' }
    ],
    correctAnswers: [2],
    explanation: 'Fringe width $\\beta = \\frac{\\lambda D}{d}$.\nNew width $\\beta\' = \\frac{\\lambda (2D)}{(d/2)} = 4 \\frac{\\lambda D}{d} = 4\\beta$.\nTherefore, the fringe width becomes quadrupled.',
    isInBank: true
  },
  {
    questionText: 'When monochromatic radiation of wavelength $\\lambda$ falls on a photosensitive metal, stopping potential is $V_0$. When wavelength is $2\\lambda$, stopping potential is $V_0/4$. The threshold wavelength $\\lambda_0$ is:',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Modern Physics',
    tags: ['Modern Physics', 'Photoelectric Effect', 'JEE'],
    options: [
      { text: '$3\\lambda$', image: '' },
      { text: '$4\\lambda$', image: '' },
      { text: '$5\\lambda$', image: '' },
      { text: '$1.5\\lambda$', image: '' }
    ],
    correctAnswers: [0],
    explanation: '$e V_0 = \\frac{hc}{\\lambda} - \\Phi$ and $e \\frac{V_0}{4} = \\frac{hc}{2\\lambda} - \\Phi$.\nMultiplying the second equation by 4: $e V_0 = \\frac{2hc}{\\lambda} - 4\\Phi$.\nEquating: $\\frac{hc}{\\lambda} - \\Phi = \\frac{2hc}{\\lambda} - 4\\Phi \\implies 3\\Phi = \\frac{hc}{\\lambda} \\implies \\Phi = \\frac{hc}{3\\lambda}$.\nSince $\\Phi = \\frac{hc}{\\lambda_0}$, the threshold wavelength $\\lambda_0 = 3\\lambda$.',
    isInBank: true
  },
  {
    questionText: 'A particle executes simple harmonic motion with amplitude $A$. At what displacement $x$ from the mean position is its kinetic energy equal to its potential energy?',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Oscillations & SHM',
    tags: ['Oscillations & SHM', 'Mechanics', 'JEE'],
    options: [
      { text: '$A / \\sqrt{2}$', image: '' },
      { text: '$A / 2$', image: '' },
      { text: '$A / \\sqrt{3}$', image: '' },
      { text: '$A / 4$', image: '' }
    ],
    correctAnswers: [0],
    explanation: '$KE = \\frac{1}{2} k (A^2 - x^2)$ and $PE = \\frac{1}{2} k x^2$.\nSetting $KE = PE \\implies \\frac{1}{2} k (A^2 - x^2) = \\frac{1}{2} k x^2 \\implies A^2 - x^2 = x^2 \\implies 2x^2 = A^2 \\implies x = \\frac{A}{\\sqrt{2}}$.',
    isInBank: true
  },
  {
    questionText: 'The escape velocity from the surface of Earth is $v_e \\approx 11.2\\text{ km/s}$. What is the escape velocity from a planet whose mass and radius are both twice that of Earth?',
    questionType: 'MCQ',
    subject: 'Physics',
    stream: 'Physics',
    topic: 'Gravitation',
    tags: ['Gravitation', 'Mechanics', 'JEE'],
    options: [
      { text: '$v_e$', image: '' },
      { text: '$2v_e$', image: '' },
      { text: '$v_e / 2$', image: '' },
      { text: '$\\sqrt{2} v_e$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Escape velocity $v_e = \\sqrt{\\frac{2GM}{R}}$.\nFor the planet, $M\' = 2M$ and $R\' = 2R$.\n$v_e\' = \\sqrt{\\frac{2G(2M)}{2R}} = \\sqrt{\\frac{2GM}{R}} = v_e$.\nThus, the escape velocity remains identical.',
    isInBank: true
  }
];

const jeeChemistryQuestions = [
  {
    questionText: 'For a first-order chemical reaction $A \\to \\text{Products}$, if the rate constant $k = 6.93 \\times 10^{-3} \\text{ s}^{-1}$, the time required for the concentration of $A$ to decrease to $25\\%$ of its initial value is:',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Chemical Kinetics',
    tags: ['Chemical Kinetics', 'Physical Chemistry', 'JEE'],
    options: [
      { text: '100 s', image: '' },
      { text: '200 s', image: '' },
      { text: '300 s', image: '' },
      { text: '400 s', image: '' }
    ],
    correctAnswers: [1],
    explanation: 'Half-life $t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0.693}{6.93 \\times 10^{-3}} = 100\\text{ s}$.\nTo reach $25\\%$ ($1/4$ of initial concentration) requires two half-lives: $2 \\times t_{1/2} = 2 \\times 100 = 200\\text{ s}$.',
    isInBank: true
  },
  {
    questionText: 'The standard reduction potentials of four elements $A, B, C, D$ are $-0.76\\text{ V}, +0.34\\text{ V}, -2.37\\text{ V}$, and $+0.80\\text{ V}$ respectively. What is the correct decreasing order of their reducing power?',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Electrochemistry',
    tags: ['Electrochemistry', 'Physical Chemistry', 'JEE'],
    options: [
      { text: '$C > A > B > D$', image: '' },
      { text: '$D > B > A > C$', image: '' },
      { text: '$A > C > B > D$', image: '' },
      { text: '$C > D > A > B$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Reducing power is inversely proportional to standard reduction potential (more negative $E^\\circ_{red} \\implies$ stronger reducing agent).\nSince $-2.37\\text{ V} < -0.76\\text{ V} < +0.34\\text{ V} < +0.80\\text{ V}$, the reducing power order is $C > A > B > D$.',
    isInBank: true
  },
  {
    questionText: 'Which of the following chemical species possesses a square planar molecular geometry according to VSEPR theory?',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Chemical Bonding',
    tags: ['Chemical Bonding', 'Inorganic Chemistry', 'JEE'],
    options: [
      { text: 'XeF4', image: '' },
      { text: 'SF4', image: '' },
      { text: 'CH4', image: '' },
      { text: 'NH4+', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'In $\\text{XeF}_4$, Xenon has 8 valence electrons. It forms 4 single bonds with F and has 2 lone pairs.\nSteric number $= 4 + 2 = 6$ ($sp^3d^2$ hybridization with octahedral electron geometry and square planar molecular shape).',
    isInBank: true
  },
  {
    questionText: 'The hybridization of the central metal atom and the magnetic nature of the complex ion $[\\text{Fe}(\\text{CN})_6]^{4-}$ are:',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Coordination Compounds',
    tags: ['Coordination Compounds', 'Inorganic Chemistry', 'JEE'],
    options: [
      { text: '$d^2sp^3$ and diamagnetic', image: '' },
      { text: '$sp^3d^2$ and paramagnetic', image: '' },
      { text: '$d^2sp^3$ and paramagnetic', image: '' },
      { text: '$sp^3$ and diamagnetic', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'In $[\\text{Fe}(\\text{CN})_6]^{4-}$, Iron is in $+2$ oxidation state ($3d^6$).\n$\\text{CN}^-$ is a strong field ligand which causes pairing of electrons: $t_{2g}^6 e_g^0$.\nThere are zero unpaired electrons (diamagnetic) and the empty inner $3d$ orbitals yield $d^2sp^3$ hybridization.',
    isInBank: true
  },
  {
    questionText: 'Which of the following organic carbonyl compounds gives a positive iodoform test (yellow precipitate of $\\text{CHI}_3$) on treatment with $\\text{I}_2 / \\text{NaOH}$?',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Aldehydes & Ketones',
    tags: ['Aldehydes & Ketones', 'Organic Chemistry', 'JEE'],
    options: [
      { text: 'Pentan-2-one', image: '' },
      { text: 'Pentan-3-one', image: '' },
      { text: 'Benzaldehyde', image: '' },
      { text: 'Methanol', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'The iodoform test is given by compounds containing the methyl ketone group ($-\\text{C}(=\\text{O})\\text{CH}_3$) or $\\text{CH}_3\\text{CH(OH)}-$ group.\nPentan-2-one ($\\text{CH}_3-\\text{CO}-\\text{CH}_2-\\text{CH}_2-\\text{CH}_3$) has a methyl ketone group and readily yields yellow iodoform precipitate.',
    isInBank: true
  },
  {
    questionText: 'For an isolated thermodynamic system, the change in entropy ($\\Delta S$) during a spontaneous process is:',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Thermodynamics',
    tags: ['Thermodynamics', 'Physical Chemistry', 'JEE'],
    options: [
      { text: '$\\Delta S > 0$', image: '' },
      { text: '$\\Delta S < 0$', image: '' },
      { text: '$\\Delta S = 0$', image: '' },
      { text: '$\\Delta S \\le 0$', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'According to the Second Law of Thermodynamics, any spontaneous natural process in an isolated system leads to an increase in total entropy: $\\Delta S_{isolated} > 0$.',
    isInBank: true
  },
  {
    questionText: 'Which of the following $0.10\\text{ M}$ aqueous solutions will exhibit the highest boiling point elevation?',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Solutions & Colligative Properties',
    tags: ['Solutions & Colligative Properties', 'Physical Chemistry', 'JEE'],
    options: [
      { text: 'Al2(SO4)3', image: '' },
      { text: 'NaCl', image: '' },
      { text: 'CaCl2', image: '' },
      { text: 'Glucose', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Boiling point elevation $\\Delta T_b = i K_b m$.\nVan \'t Hoff factor $i$:\n$\\text{Glucose}: i = 1$\n$\\text{NaCl}: i = 2$\n$\\text{CaCl}_2: i = 3$\n$\\text{Al}_2(\\text{SO}_4)_3: i = 2 + 3 = 5$.\nSince $i$ is largest for $\\text{Al}_2(\\text{SO}_4)_3$, it exhibits the highest boiling point elevation.',
    isInBank: true
  },
  {
    questionText: 'The basicity (number of replaceable ionizable protons) of orthophosphoric acid ($\\text{H}_3\\text{PO}_4$) and phosphorous acid ($\\text{H}_3\\text{PO}_3$) are respectively:',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'p-Block Elements',
    tags: ['p-Block Elements', 'Inorganic Chemistry', 'JEE'],
    options: [
      { text: '3 and 2', image: '' },
      { text: '3 and 3', image: '' },
      { text: '2 and 3', image: '' },
      { text: '1 and 2', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Only hydrogens bonded to oxygen in $-\\text{OH}$ groups are ionizable.\n$\\text{H}_3\\text{PO}_4$ has structure $\\text{O}=\\text{P}(\\text{OH})_3$ with 3 $-\\text{OH}$ groups $\\implies$ tribasic (3).\n$\\text{H}_3\\text{PO}_3$ has structure $\\text{O}=\\text{P}(\\text{H})(\\text{OH})_2$ with one $\\text{P}-\\text{H}$ bond and 2 $-\\text{OH}$ groups $\\implies$ dibasic (2).',
    isInBank: true
  },
  {
    questionText: 'The dehydrohalogenation of 2-bromobutane with alcoholic $\\text{KOH}$ predominantly yields but-2-ene. This regiochemical outcome is governed by:',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Organic Reaction Mechanisms',
    tags: ['Organic Reaction Mechanisms', 'Organic Chemistry', 'JEE'],
    options: [
      { text: "Saytzeff's Rule (Zaitsev)", image: '' },
      { text: "Hofmann's Rule", image: '' },
      { text: "Markovnikov's Rule", image: '' },
      { text: 'Kharasch Peroxide Effect', image: '' }
    ],
    correctAnswers: [0],
    explanation: "Saytzeff's (Zaitsev's) rule states that in an elimination reaction, the major alkene product is the more substituted and thermodynamically stable alkene (but-2-ene is disubstituted, whereas but-1-ene is monosubstituted).",
    isInBank: true
  },
  {
    questionText: 'Among the halogen group elements, which one has the highest negative electron gain enthalpy (most exothermic $\\Delta_{eg}H$)?',
    questionType: 'MCQ',
    subject: 'Chemistry',
    stream: 'Chemistry',
    topic: 'Periodic Table & Periodicity',
    tags: ['Periodic Table & Periodicity', 'Inorganic Chemistry', 'JEE'],
    options: [
      { text: 'Chlorine (Cl)', image: '' },
      { text: 'Fluorine (F)', image: '' },
      { text: 'Bromine (Br)', image: '' },
      { text: 'Iodine (I)', image: '' }
    ],
    correctAnswers: [0],
    explanation: 'Chlorine has the highest negative electron gain enthalpy ($-349\\text{ kJ/mol}$). Fluorine is smaller in size, causing significant interelectronic repulsions in the compact $2p$ subshell when an incoming electron is added.',
    isInBank: true
  }
];

const allNewQuestions = [
  ...aptitudeProfitLossQuestions,
  ...aptitudeSICIQuestions,
  ...aptitudeHCFQuestions,
  ...jeeMathsQuestions,
  ...jeePhysicsQuestions,
  ...jeeChemistryQuestions
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment.');
    }

    console.log('[Question Bank Seeder] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('[Question Bank Seeder] Connected successfully.');

    console.log(`[Question Bank Seeder] Preparing to seed ${allNewQuestions.length} curated questions...`);
    console.log(`- Aptitude (Profit & Loss): ${aptitudeProfitLossQuestions.length}`);
    console.log(`- Aptitude (SI & CI): ${aptitudeSICIQuestions.length}`);
    console.log(`- Aptitude (HCF & LCM): ${aptitudeHCFQuestions.length}`);
    console.log(`- JEE Mathematics: ${jeeMathsQuestions.length}`);
    console.log(`- JEE Physics: ${jeePhysicsQuestions.length}`);
    console.log(`- JEE Chemistry: ${jeeChemistryQuestions.length}`);

    let insertedCount = 0;
    let existingCount = 0;

    for (const q of allNewQuestions) {
      // Check if question already exists by questionText
      const exists = await Question.findOne({ questionText: q.questionText });
      if (exists) {
        // Ensure isInBank is true
        if (!exists.isInBank) {
          exists.isInBank = true;
          await exists.save();
        }
        existingCount++;
      } else {
        await Question.create(q);
        insertedCount++;
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`- Newly inserted questions: ${insertedCount}`);
    console.log(`- Previously existing: ${existingCount}`);
    console.log(`- Total questions processed: ${allNewQuestions.length}`);

    const totalInBank = await Question.countDocuments({ isInBank: true });
    console.log(`- Total questions currently in Question Bank: ${totalInBank}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Question Bank Seeder] Error:', error);
    process.exit(1);
  }
}

seed();
