import { getSanketTopicForDay, getSanketRoadmapDay, SanketTopic } from './sanket-curriculum';
import { generateRandomHumanTimestamps } from './github';

export interface SanketCommitItem {
  partIndex: number;
  totalParts: 2;
  filePath: string;
  fileContent: string;
  topicTitle: string;
  category: string;
  difficulty: string;
  language: 'typescript' | 'markdown';
  commitMessage: string;
  source: 'gemini' | 'curriculum';
}

/**
 * Generates a pack of 2 commit items for Sanket's daily practice.
 * Attempts Gemini first; falls back to the built-in curriculum.
 */
export async function generateDailySanketPack(
  commitsCount: number = 2,
  customTopic?: string
): Promise<SanketCommitItem[]> {
  const dayNumber = getSanketRoadmapDay();
  const geminiApiKey = process.env.SANKET_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 1. Try Gemini AI for fresh, dynamic content
  if (geminiApiKey) {
    try {
      const aiPack = await generateSanketPackViaGemini({
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
      console.warn('[Sanket] Gemini generation failed, using curriculum fallback:', err);
    }
  }

  // 2. Built-in curriculum fallback
  const topic = getSanketTopicForDay(dayNumber);
  return buildCurriculumPack(topic, commitsCount);
}

function buildCurriculumPack(topic: SanketTopic, commitsCount: number): SanketCommitItem[] {
  const isMainMarkdown = topic.files.main.trimStart().startsWith('#');
  const isSecondaryMarkdown =
    topic.files.secondary.trimStart().startsWith('#') ||
    topic.files.secondary.trimStart().startsWith('//') === false &&
    !topic.files.secondary.trimStart().startsWith('import') &&
    !topic.files.secondary.trimStart().startsWith('export') &&
    !topic.files.secondary.trimStart().startsWith('const') &&
    !topic.files.secondary.trimStart().startsWith('class') &&
    !topic.files.secondary.trimStart().startsWith('async');

  const pack: SanketCommitItem[] = [
    {
      partIndex: 1,
      totalParts: 2,
      filePath: `${topic.folder}/${topic.slug}/${isMainMarkdown ? 'notes.md' : 'notes.ts'}`,
      fileContent: topic.files.main,
      topicTitle: `${topic.title} — Notes`,
      category: topic.category,
      difficulty: topic.difficulty,
      language: isMainMarkdown ? 'markdown' : 'typescript',
      commitMessage: topic.commitMessages[0],
      source: 'curriculum',
    },
    {
      partIndex: 2,
      totalParts: 2,
      filePath: `${topic.folder}/${topic.slug}/${isSecondaryMarkdown ? 'guide.md' : 'implementation.ts'}`,
      fileContent: topic.files.secondary,
      topicTitle: `${topic.title} — Implementation`,
      category: topic.category,
      difficulty: topic.difficulty,
      language: isSecondaryMarkdown ? 'markdown' : 'typescript',
      commitMessage: topic.commitMessages[1],
      source: 'curriculum',
    },
  ];

  return pack.slice(0, commitsCount);
}

async function generateSanketPackViaGemini(params: {
  apiKey: string;
  dayNumber: number;
  dateStr: string;
  commitsCount: number;
  customTopic?: string;
}): Promise<SanketCommitItem[] | null> {
  const { apiKey, dayNumber, dateStr, commitsCount, customTopic } = params;

  const prompt = `You are Sanket Adsare, an experienced full-stack software engineer with 5+ years of experience.
You maintain a personal GitHub repository called "system-design" where you document your daily deep dives into:
- System design (scalability, caching, distributed systems, databases, message queues)
- Full-stack engineering (TypeScript, React, Next.js, Node.js, REST APIs, auth)
- Testing strategies (unit, integration, E2E, mocking)
- DevOps (Docker, CI/CD, deployment, monitoring)

Today is Day ${dayNumber} of your learning journal.
${customTopic ? `Today's focus: ${customTopic}` : `Advance naturally through your curriculum — intermediate to advanced topics.`}
Date: ${dateStr}.

STYLE GUIDELINES:
- Write as a practising engineer, not a textbook author.
- Notes files should be concise, opinionated technical markdown with examples.
- Implementation files should be clean, idiomatic TypeScript or markdown.
- Avoid academic preamble. Get straight to the point.
- Use real-world naming conventions (not foo/bar).
- Code must be correct and runnable.

Choose ONE of these topic areas for today:
  system-design | full-stack | testing | devops

Generate exactly 2 files:
1. A notes/explanation file (markdown or TypeScript with inline comments)
2. An implementation, simulation, or practical example file

Respond ONLY with this raw JSON (no markdown fences):
{
  "topicTitle": "Short, clear title",
  "category": "System Design" | "Full-Stack" | "TypeScript" | "Testing" | "DevOps" | "Databases" | "Security" | "Performance",
  "difficulty": "Intermediate" | "Advanced" | "Expert",
  "folder": "system-design" | "full-stack" | "testing" | "devops",
  "slug": "kebab-case-topic-slug",
  "files": [
    {
      "fileName": "notes.md" or "notes.ts",
      "commitMessage": "natural lowercase commit message 3-6 words",
      "content": "file content here"
    },
    {
      "fileName": "implementation.ts" or "implementation.md",
      "commitMessage": "natural lowercase commit message 3-6 words",
      "content": "file content here"
    }
  ]
}`;

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
        const sanitized = stripped.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\');
        return JSON.parse(sanitized);
      }
    }
  };

  const parsed = safeParseJSON(rawText);
  if (!parsed?.files || !Array.isArray(parsed.files) || parsed.files.length < 2) return null;

  interface GeminiFile {
    fileName?: string;
    commitMessage?: string;
    content: string;
  }

  const result: SanketCommitItem[] = parsed.files.slice(0, commitsCount).map(
    (fileObj: GeminiFile, index: number) => {
      const fileName: string = fileObj.fileName || (index === 0 ? 'notes.md' : 'implementation.ts');
      const ext = fileName.endsWith('.md') ? 'markdown' : 'typescript';

      return {
        partIndex: index + 1,
        totalParts: 2 as const,
        filePath: `${parsed.folder || 'system-design'}/${parsed.slug || 'topic'}/${fileName}`,
        fileContent: fileObj.content || '',
        topicTitle: `${parsed.topicTitle || 'Engineering Practice'} (Part ${index + 1})`,
        category: parsed.category || 'System Design',
        difficulty: parsed.difficulty || 'Advanced',
        language: ext,
        commitMessage: fileObj.commitMessage || `add ${parsed.slug || 'practice'} notes`,
        source: 'gemini' as const,
      };
    }
  );

  return result;
}

// Re-export for use in cron/push routes
export { getSanketRoadmapDay, generateRandomHumanTimestamps };
