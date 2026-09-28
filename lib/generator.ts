import { getRoadmapDay } from './js-roadmap';

export interface GeneratedCommitItem {
  partIndex: number;
  totalParts: number;
  filePath: string;
  fileContent: string;
  topicTitle: string;
  category: string;
  difficulty: string;
  language: string;
  commitMessage: string;
  source: 'gemini' | 'curriculum';
}

export interface GeneratedCodeResult {
  filePath: string;
  fileContent: string;
  topicTitle: string;
  category: string;
  difficulty: string;
  language: string;
  commitMessage: string;
  source: 'gemini' | 'curriculum';
}

/**
 * Calculates current day number in the 180-day curriculum.
 */
export function getCurrentRoadmapDay(): number {
  const startDateStr = process.env.STREAK_START_DATE;
  const start = startDateStr ? new Date(startDateStr) : new Date(2026, 8, 28); // Sept 28, 2026
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * Generates a pack of 2 to 3 progressive JavaScript practice commits for today.
 * Structured as:
 * - Part 1: Core Theory & Fundamentals (01-core.js)
 * - Part 2: Real-World Implementation / Polyfill (02-practical.js)
 * - Part 3: Unit Verification Tests & Edge Cases (03-tests.js)
 */
export async function generateDailyJavaScriptPack(
  commitsCount: number = 3,
  customTopic?: string
): Promise<GeneratedCommitItem[]> {
  const dayNumber = getCurrentRoadmapDay();
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${dayStr}`;

  // 1. Try Gemini 2.5 Flash for fresh, dynamic masterclass modules
  if (geminiApiKey) {
    try {
      const aiPack = await generateJavaScriptPackViaGemini({
        apiKey: geminiApiKey,
        dayNumber,
        dateStr,
        commitsCount,
        customTopic,
      });

      if (aiPack && aiPack.length > 0) {
        return aiPack;
      }
    } catch (err) {
      console.warn('Gemini pack generation failed, falling back to built-in curriculum:', err);
    }
  }

  // 2. Built-in 180-Day JavaScript Roadmap Fallback (100% reliable)
  const roadmapItem = getRoadmapDay(dayNumber);
  const folder = `javascript-mastery/${roadmapItem.stageFolder}/day-${String(dayNumber).padStart(2, '0')}-${roadmapItem.slug}`;

  const pack: GeneratedCommitItem[] = [
    {
      partIndex: 1,
      totalParts: 3,
      filePath: `${folder}/01-core.js`,
      fileContent: roadmapItem.files.core,
      topicTitle: `${roadmapItem.topic} (Part 1: Core Concept)`,
      category: roadmapItem.category,
      difficulty: roadmapItem.difficulty,
      language: 'javascript',
      commitMessage: `feat(fundamentals): Day ${dayNumber} - ${roadmapItem.topic} [Part 1/3]`,
      source: 'curriculum',
    },
    {
      partIndex: 2,
      totalParts: 3,
      filePath: `${folder}/02-practical.js`,
      fileContent: roadmapItem.files.practical,
      topicTitle: `${roadmapItem.topic} (Part 2: Real-world Implementation)`,
      category: roadmapItem.category,
      difficulty: roadmapItem.difficulty,
      language: 'javascript',
      commitMessage: `feat(implementation): Day ${dayNumber} - Practical Implementation & Polyfill [Part 2/3]`,
      source: 'curriculum',
    },
    {
      partIndex: 3,
      totalParts: 3,
      filePath: `${folder}/03-tests.js`,
      fileContent: roadmapItem.files.tests,
      topicTitle: `${roadmapItem.topic} (Part 3: Unit Tests & Edge Cases)`,
      category: roadmapItem.category,
      difficulty: roadmapItem.difficulty,
      language: 'javascript',
      commitMessage: `test(verification): Day ${dayNumber} - Assertions and Edge Cases [Part 3/3]`,
      source: 'curriculum',
    },
  ];

  return pack.slice(0, commitsCount);
}

/**
 * Backward compatible single-file generator
 */
export async function generateDailyPractice(
  preferredLang: string = 'javascript',
  customTopic?: string
): Promise<GeneratedCodeResult> {
  const pack = await generateDailyJavaScriptPack(1, customTopic);
  const item = pack[0];

  return {
    filePath: item.filePath,
    fileContent: item.fileContent,
    topicTitle: item.topicTitle,
    category: item.category,
    difficulty: item.difficulty,
    language: item.language,
    commitMessage: item.commitMessage,
    source: item.source,
  };
}

async function generateJavaScriptPackViaGemini(params: {
  apiKey: string;
  dayNumber: number;
  dateStr: string;
  commitsCount: number;
  customTopic?: string;
}): Promise<GeneratedCommitItem[] | null> {
  const { apiKey, dayNumber, dateStr, commitsCount, customTopic } = params;

  const prompt = `You are a Principal Software Engineer and author of "Mastering JavaScript from Scratch to Architecture".
The student is practicing JavaScript every single day. Today is Day ${dayNumber} of their 180-day journey from absolute basics to advanced architectural mastery.
${customTopic ? `Focus Topic: ${customTopic}` : `Design an in-depth lesson for Day ${dayNumber} of the JavaScript curriculum.`}
Target Date: ${dateStr}.

Generate a 3-part daily coding practice package in modern JavaScript (with .js extension):
- Part 1 (Core): Foundational concept, deep architectural comments, execution context, prototypes or syntax details.
- Part 2 (Practical): Production-ready polyfill, real-world utility, design pattern, or practical exercise using the concept.
- Part 3 (Tests): Self-contained unit tests using Node.js 'assert' module covering edge cases and verification.

Respond strictly with valid JSON with this format:
{
  "topicTitle": "Topic Name",
  "category": "Fundamentals" | "Async JS" | "Design Patterns" | "Data Structures" | "Algorithms" | "Advanced Architecture",
  "difficulty": "Beginner" | "Intermediate" | "Advanced" | "Expert",
  "slug": "kebab-case-slug",
  "folder": "01-fundamentals" | "02-async-mastery" | "03-patterns-and-fp" | "04-data-structures" | "05-algorithms" | "06-advanced-engineering",
  "files": [
    {
      "fileName": "01-core.js",
      "commitMessage": "feat(core): Day ${dayNumber} - ... [Part 1/3]",
      "code": "// Full JavaScript source code with detailed JSDoc comments"
    },
    {
      "fileName": "02-practical.js",
      "commitMessage": "feat(implementation): Day ${dayNumber} - ... [Part 2/3]",
      "code": "// Full JavaScript practical implementation and utility"
    },
    {
      "fileName": "03-tests.js",
      "commitMessage": "test(verification): Day ${dayNumber} - Assertions and Edge Cases [Part 3/3]",
      "code": "// Self-contained Node.js assert tests"
    }
  ]
}
Ensure the response is raw valid JSON with no markdown backticks or commentary outside the JSON.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText.trim());
  const folderPath = `javascript-mastery/${parsed.folder || '01-fundamentals'}/day-${String(dayNumber).padStart(2, '0')}-${parsed.slug || 'practice'}`;

  interface GeminiFileItem {
    fileName?: string;
    commitMessage?: string;
    code: string;
  }

  const result: GeneratedCommitItem[] = parsed.files.map((fileObj: GeminiFileItem, index: number) => ({
    partIndex: index + 1,
    totalParts: parsed.files.length,
    filePath: `${folderPath}/${fileObj.fileName || `part-${index + 1}.js`}`,
    fileContent: fileObj.code,
    topicTitle: `${parsed.topicTitle} (Part ${index + 1})`,
    category: parsed.category || 'Fundamentals',
    difficulty: parsed.difficulty || 'Intermediate',
    language: 'javascript',
    commitMessage: fileObj.commitMessage || `feat(javascript): Day ${dayNumber} - ${parsed.topicTitle} [Part ${index + 1}/${parsed.files.length}]`,
    source: 'gemini' as const,
  }));

  return result.slice(0, commitsCount);
}
