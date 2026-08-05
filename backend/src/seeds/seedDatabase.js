import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Question } from '../models/Question.js';
import { Exam } from '../models/Exam.js';
import { JeeAdvancedPaper } from '../models/JeeAdvancedPaper.js';

// Fix Node.js Windows SRV DNS resolution issue for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(mongoUri);

    // Read paper questions JSON
    const questionsPath = path.join(__dirname, 'jee_adv_2024_paper1.json');
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

    const paperTitle = 'JEE Advanced 2024 - Paper 1 (Slot 1)';
    console.log(`\n--- Seeding ${paperTitle} ---`);
    console.log(`(Preserving all existing papers and questions; NO deletions will occur)`);

    // 1. Insert questions into Question Bank (Question collection)
    console.log(`Inserting ${questionsData.length} questions into Question collection...`);
    const insertedQuestions = await Question.insertMany(questionsData);
    console.log(`✅ Successfully added ${insertedQuestions.length} questions to Question collection.`);

    // 2. Organize questions by subject
    const mathQuestions = questionsData.filter(q => q.subject === 'Mathematics');
    const physicsQuestions = questionsData.filter(q => q.subject === 'Physics');
    const chemistryQuestions = questionsData.filter(q => q.subject === 'Chemistry');

    const totalMarks = questionsData.reduce((acc, q) => acc + q.positiveMarks, 0);

    // 3. Save as a single complete paper document in 'jee_advanced_previous_year_papers' collection
    const paperDocumentData = {
      title: paperTitle,
      year: 2024,
      paperNumber: 'Paper 1 (Slot 1)',
      examType: 'JEE_ADVANCED',
      description: 'JEE Advanced 2024 Official Paper 1 (Slot 1) Question Bank Document',
      durationMinutes: 180,
      totalMarks,
      totalQuestions: questionsData.length,
      sections: [
        {
          name: 'Mathematics',
          subject: 'Mathematics',
          questionCount: mathQuestions.length,
          questions: mathQuestions
        },
        {
          name: 'Physics',
          subject: 'Physics',
          questionCount: physicsQuestions.length,
          questions: physicsQuestions
        },
        {
          name: 'Chemistry',
          subject: 'Chemistry',
          questionCount: chemistryQuestions.length,
          questions: chemistryQuestions
        }
      ],
      proctoringConfig: {
        enabledByDefault: true,
        maxStrikes: 3,
        faceCheckIntervalSec: 3,
        allowFullscreenExit: false
      }
    };

    const savedPaperDoc = await JeeAdvancedPaper.findOneAndUpdate(
      { title: paperTitle },
      paperDocumentData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`\n🎉 Saved complete Paper document in collection 'jee_advanced_previous_year_papers':`);
    console.log(`   Document ID: ${savedPaperDoc._id}`);
    console.log(`   Paper Title: ${savedPaperDoc.title}`);
    console.log(`   Total Questions: ${savedPaperDoc.totalQuestions}`);
    console.log(`   Total Marks: ${savedPaperDoc.totalMarks}`);

    // 4. Also upsert into Exam collection for compatibility with mock test engine
    const mathIds = insertedQuestions.filter(q => q.subject === 'Mathematics').map(q => q._id);
    const physicsIds = insertedQuestions.filter(q => q.subject === 'Physics').map(q => q._id);
    const chemistryIds = insertedQuestions.filter(q => q.subject === 'Chemistry').map(q => q._id);

    await Exam.findOneAndUpdate(
      { title: paperTitle },
      {
        title: paperTitle,
        examType: 'JEE_ADVANCED',
        description: 'JEE Advanced 2024 Paper 1 (Slot 1)',
        durationMinutes: 180,
        totalMarks,
        sections: [
          { name: 'Mathematics', subject: 'Mathematics', questionIds: mathIds },
          { name: 'Physics', subject: 'Physics', questionIds: physicsIds },
          { name: 'Chemistry', subject: 'Chemistry', questionIds: chemistryIds }
        ]
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Exam collection updated.`);
    console.log(`\nDone! All papers and questions are preserved in your database.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
