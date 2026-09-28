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
 * Strips robotic tags, prefixes, and brackets to make commit messages
 * look 100% naturally typed by a software engineer in their terminal.
 */
export function formatHumanCommitMessage(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/^(\w+)(\([^)]+\))?:\s*/i, '') // remove conventional commit prefix (feat(core): etc)
    .replace(/\[Part\s*\d+\/\d+\]/gi, '') // remove [Part 1/3]
    .replace(/\(Part\s*\d+\)/gi, '') // remove (Part 1)
    .replace(/Day\s*\d+\s*[-:]\s*/gi, '') // remove Day 1 -
    .replace(/Part\s*\d+\s*[-:]\s*/gi, '') // remove Part 1 -
    .replace(/[\[\]\(\)]/g, '') // remove rogue brackets
    .trim();

  if (!cleaned) return fallback;
  // Natural lowercase start, authentic terminal style
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

/**
 * Calculates current day number in the 180-day curriculum.
 */
export function getCurrentRoadmapDay(): number {
  const startDateStr = process.env.STREAK_START_DATE;
  const start = startDateStr ? new Date(startDateStr) : new Date(2026, 8, 28);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * Generates a pack of 2 to 3 progressive JavaScript practice commits for today.
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
  const cleanSlugName = roadmapItem.slug.replace(/^\d+-/, '').replace(/-/g, ' ');

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
      commitMessage: `practice ${cleanSlugName}`,
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
      commitMessage: `add ${cleanSlugName} practical example`,
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
      commitMessage: `write tests for ${cleanSlugName}`,
      source: 'curriculum',
    },
  ];

  return pack.slice(0, commitsCount);
}

/**
 * Backward compatible single-file generator
 */
export async function generateDailyPractice(
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

  const prompt = `You are a software developer writing your daily personal JavaScript practice files.
Today is Day ${dayNumber} of your journey learning JavaScript from scratch to mastery.
${customTopic ? `Focus Topic: ${customTopic}` : `Topic: Day ${dayNumber} of JavaScript mastery.`}
Date: ${dateStr}.

STRICT CODING STYLE GUIDELINES:
- Write realistic, natural code just like an authentic developer practicing in their personal repo.
- DO NOT use fancy JSDoc blocks (no /** ... */) or academic docstrings.
- DO NOT write robotic textbook banners (NO "Problem: ...", NO "Approach: ...", NO "Time Complexity: ...").
- Keep comments strictly limited and minimal: only brief 1-line comments (// ...) where really needed to clarify a step.
- The code must NEVER look AI-generated or copy-pasted from an online tutorial.
- Clean, readable, idiomatic JavaScript with natural variable and function names.

COMMIT MESSAGE GUIDELINES (VERY IMPORTANT):
- Each commit message MUST look 100% manually typed by a human in their terminal.
- Write natural, casual, concise phrases (all lowercase or simple sentence style, 3 to 6 words).
- Examples of good commit messages:
  - "practice variables and basic types"
  - "add user profile helper function"
  - "test profile formatting with assert"
- NEVER use prefixes or tags like "feat:", "test:", "chore:", "[Part 1/3]", or "Day 1 -".

Generate 3 files:
1. 01-core.js: Core concept implementation.
2. 02-practical.js: A real-world utility or pattern using the concept.
3. 03-tests.js: Self-contained verification tests using Node assert or simple test cases.

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
      "commitMessage": "practice ... (casual human typed message)",
      "code": "// clean natural JS code with limited 1-line comments"
    },
    {
      "fileName": "02-practical.js",
      "commitMessage": "add ... (casual human typed message)",
      "code": "// practical utility with limited 1-line comments"
    },
    {
      "fileName": "03-tests.js",
      "commitMessage": "write tests for ... (casual human typed message)",
      "code": "// tests and assertions"
    }
  ]
}
Ensure the response is raw valid JSON with no markdown backticks or extra text outside JSON.`;

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

  const safeParseJSON = (str: string) => {
    try {
      return JSON.parse(str.trim());
    } catch {
      const stripped = str.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      try {
        return JSON.parse(stripped);
      } catch {
        // Fix common unescaped backslashes in code blocks
        const sanitized = stripped.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\');
        return JSON.parse(sanitized);
      }
    }
  };

  const parsed = safeParseJSON(rawText);
  const folderPath = `javascript-mastery/${parsed.folder || '01-fundamentals'}/day-${String(dayNumber).padStart(2, '0')}-${parsed.slug || 'practice'}`;

  interface GeminiFileItem {
    fileName?: string;
    commitMessage?: string;
    code: string;
  }

  const defaultMessages = [
    `practice ${parsed.slug?.replace(/-/g, ' ') || 'core concept'}`,
    `add ${parsed.slug?.replace(/-/g, ' ') || 'practical'} helper`,
    `write tests for ${parsed.slug?.replace(/-/g, ' ') || 'practice'}`,
  ];

  const result: GeneratedCommitItem[] = parsed.files.map((fileObj: GeminiFileItem, index: number) => {
    const rawMsg = fileObj.commitMessage;
    const humanMsg = formatHumanCommitMessage(rawMsg, defaultMessages[index] || `practice part ${index + 1}`);

    return {
      partIndex: index + 1,
      totalParts: parsed.files.length,
      filePath: `${folderPath}/${fileObj.fileName || `part-${index + 1}.js`}`,
      fileContent: fileObj.code,
      topicTitle: `${parsed.topicTitle} (Part ${index + 1})`,
      category: parsed.category || 'Fundamentals',
      difficulty: parsed.difficulty || 'Intermediate',
      language: 'javascript',
      commitMessage: humanMsg,
      source: 'gemini' as const,
    };
  });

  return result.slice(0, commitsCount);
}
