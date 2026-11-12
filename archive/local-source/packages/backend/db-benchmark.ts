import 'reflect-metadata';
import { DataSource, In } from 'typeorm';
import { User, UserRole } from './src/user/entities/user.entity';
import { Document, DocumentType } from './src/document/entities/document.entity';
import { Portfolio } from './src/document/entities/portfolio.entity';
import { CoverLetter } from './src/document/entities/cover-letter.entity';
import { CoverLetterQuestionAnswer } from './src/document/entities/cover-letter-question-answer.entity';
import dataSource from './src/typeorm-datasource';

async function runBenchmark() {
  console.log("Initializing database connection...");
  await dataSource.initialize();
  // Disable logging for benchmark execution to prevent log pollution
  (dataSource as any).setOptions({ logging: false });
  console.log("Connection initialized. Logging disabled for benchmark.");

  // Check/Create a benchmark user
  const userRepo = dataSource.getRepository(User);
  let user = await userRepo.findOne({ where: { userEmail: 'benchmark@example.com' } });
  if (!user) {
    user = new User();
    user.userEmail = 'benchmark@example.com';
    user.sub = 'benchmark_sub_123';
    user.role = UserRole.USER;
    user = await userRepo.save(user);
    console.log("Benchmark user created.");
  } else {
    console.log("Benchmark user exists.");
  }

  const documentRepo = dataSource.getRepository(Document);
  const portfolioRepo = dataSource.getRepository(Portfolio);
  const coverLetterRepo = dataSource.getRepository(CoverLetter);
  const qaRepo = dataSource.getRepository(CoverLetterQuestionAnswer);

  const numDocuments = 100;

  console.log(`\n==================================================`);
  console.log(`Starting DB Deletion Performance Benchmark`);
  console.log(`Creating ${numDocuments} documents per method (Total 200 documents, 200 portfolios, 200 cover letters, 1000 Q&As)...`);
  console.log(`==================================================\n`);

  async function createBatch() {
    const docs: Document[] = [];
    for (let i = 0; i < numDocuments; i++) {
      const doc = new Document();
      doc.title = `Benchmark Document ${i}`;
      doc.type = i % 2 === 0 ? DocumentType.PORTFOLIO : DocumentType.COVER;
      doc.user = user!;
      
      if (doc.type === DocumentType.PORTFOLIO) {
        const port = new Portfolio();
        port.content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(20);
        port.document = doc;
        doc.portfolio = port;
      } else {
        const cl = new CoverLetter();
        cl.document = doc;
        cl.questionAnswers = Array.from({ length: 5 }).map((_, idx) => {
          const qa = new CoverLetterQuestionAnswer();
          qa.question = `Question ${idx}`;
          qa.answer = `Answer ${idx} `.repeat(15);
          qa.coverLetter = cl;
          return qa;
        });
        doc.coverLetter = cl;
      }
      docs.push(doc);
    }
    // Save documents (inserts documents, portfolios, cover letters, and QAs via cascades)
    await dataSource.transaction(async (manager) => {
      for (const doc of docs) {
        await manager.save(Document, doc);
        if (doc.coverLetter) {
          await manager.save(CoverLetter, doc.coverLetter);
          await manager.save(CoverLetterQuestionAnswer, doc.coverLetter.questionAnswers);
        }
      }
    });
    return docs;
  }

  // Measure TypeORM remove()
  console.log("Creating documents for remove() benchmark...");
  const docsForRemove = await createBatch();
  console.log("Documents created. Starting remove() benchmark...");

  // We need to fetch full relations because remove() requires them
  const docsWithRelations = await documentRepo.find({
    where: { documentId: In(docsForRemove.map(d => d.documentId)) },
    relations: ['portfolio', 'coverLetter', 'coverLetter.questionAnswers']
  });

  const startRemove = performance.now();
  await documentRepo.remove(docsWithRelations);
  const endRemove = performance.now();
  const timeRemove = endRemove - startRemove;
  console.log(`TypeORM remove() took: ${timeRemove.toFixed(2)} ms`);

  // Measure TypeORM delete() + DB CASCADE
  console.log("\nCreating documents for delete() benchmark...");
  const docsForDelete = await createBatch();
  console.log("Documents created. Starting delete() benchmark...");

  const deleteIds = docsForDelete.map(d => d.documentId);
  const startDelete = performance.now();
  await documentRepo.delete({ documentId: In(deleteIds) });
  const endDelete = performance.now();
  const timeDelete = endDelete - startDelete;
  console.log(`TypeORM delete() + DB CASCADE took: ${timeDelete.toFixed(2)} ms`);

  const speedup = timeRemove / timeDelete;
  console.log(`\n==================================================`);
  console.log(`Result Summary (for ${numDocuments} documents):`);
  console.log(`- TypeORM remove() (Entity load + hooks + individual delete): ${timeRemove.toFixed(2)} ms`);
  console.log(`- TypeORM delete() (Direct bulk SQL + DB CASCADE): ${timeDelete.toFixed(2)} ms`);
  console.log(`- Speedup: ${speedup.toFixed(2)}x faster`);
  console.log(`==================================================\n`);

  // Clean up user
  await userRepo.remove(user!);
  console.log("Cleaned up benchmark user.");

  await dataSource.destroy();
}

runBenchmark().catch(err => {
  console.error("Error running benchmark:", err);
  process.exit(1);
});
