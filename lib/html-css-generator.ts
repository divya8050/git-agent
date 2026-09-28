import { getHtmlCssRoadmapDay } from './html-css-roadmap';
import { formatHumanCommitMessage, getCurrentRoadmapDay } from './generator';

export interface GeneratedHtmlCssItem {
  partIndex: number;
  totalParts: number;
  filePath: string;
  fileContent: string;
  topicTitle: string;
  language: 'html' | 'css';
  commitMessage: string;
  source: 'gemini' | 'curriculum';
}

/**
 * Generates daily HTML and CSS practice files.
 */
export async function generateDailyHtmlCssPack(
  customTopic?: string
): Promise<GeneratedHtmlCssItem[]> {
  const dayNumber = getCurrentRoadmapDay();
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${dayStr}`;

  // 1. Try Gemini AI
  if (geminiApiKey) {
    try {
      const aiResult = await generateHtmlCssViaGemini({
        apiKey: geminiApiKey,
        dayNumber,
        dateStr,
        customTopic,
      });

      if (aiResult && aiResult.length > 0) {
        return aiResult;
      }
    } catch (err) {
      console.warn('Gemini HTML/CSS generation failed, falling back to curriculum:', err);
    }
  }

  // 2. Built-in Roadmap Fallback
  const item = getHtmlCssRoadmapDay(dayNumber);
  const folder = `html-css-mastery/${item.stageFolder}/day-${String(dayNumber).padStart(2, '0')}-${item.slug}`;
  const cleanName = item.slug.replace(/^\d+-/, '').replace(/-/g, ' ');

  return [
    {
      partIndex: 1,
      totalParts: 2,
      filePath: `${folder}/index.html`,
      fileContent: item.files.html,
      topicTitle: `${item.topic} (HTML Markup)`,
      language: 'html',
      commitMessage: `create html markup for ${cleanName}`,
      source: 'curriculum',
    },
    {
      partIndex: 2,
      totalParts: 2,
      filePath: `${folder}/styles.css`,
      fileContent: item.files.css,
      topicTitle: `${item.topic} (CSS Styling)`,
      language: 'css',
      commitMessage: `add css styling for ${cleanName}`,
      source: 'curriculum',
    },
  ];
}

async function generateHtmlCssViaGemini(params: {
  apiKey: string;
  dayNumber: number;
  dateStr: string;
  customTopic?: string;
}): Promise<GeneratedHtmlCssItem[] | null> {
  const { apiKey, dayNumber, dateStr, customTopic } = params;

  const prompt = `You are a web developer practicing modern HTML5 and CSS3 everyday.
Today is Day ${dayNumber} of your 180-day journey from scratch to master frontend designer.
${customTopic ? `Focus Topic: ${customTopic}` : `Topic: Day ${dayNumber} of HTML5 and CSS3 learning.`}
Date: ${dateStr}.

STRICT CODING STYLE GUIDELINES:
- Write clean, modern, semantic HTML5 and clean CSS3 (Flexbox/Grid/Variables).
- DO NOT use bloated AI descriptions or textbook preambles.
- Keep comments strictly limited to natural 1-line notes (<!-- ... --> in HTML, /* ... */ in CSS).
- Clean class names (BEM or natural lowercase kebab-case).

COMMIT MESSAGE GUIDELINES (MUST LOOK MANUALLY TYPED):
- Casual, natural, lowercase terminal commit messages (3 to 6 words).
- e.g. "create markup for contact form", "add flexbox styles for header and form", "style responsive navigation bar"
- NEVER use prefixes like "feat:", "test:", "[Part 1/2]", "Day 1 -".

Return strictly raw valid JSON with this format:
{
  "topicTitle": "Topic Name",
  "folder": "01-html5-semantics" | "02-flexbox-grid" | "03-responsive-design" | "04-ui-components" | "05-visual-effects" | "06-production-projects",
  "slug": "kebab-case-slug",
  "html": {
    "fileName": "index.html",
    "commitMessage": "casual human typed message",
    "code": "<!DOCTYPE html>..."
  },
  "css": {
    "fileName": "styles.css",
    "commitMessage": "casual human typed message",
    "code": "/* clean modern CSS */..."
  }
}
Respond only with raw valid JSON, no markdown backticks outside.`;

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
  const folder = `html-css-mastery/${parsed.folder || '01-html5-semantics'}/day-${String(dayNumber).padStart(2, '0')}-${parsed.slug || 'practice'}`;
  const cleanSlug = parsed.slug?.replace(/-/g, ' ') || 'practice layout';

  const htmlMsg = formatHumanCommitMessage(parsed.html?.commitMessage, `create markup for ${cleanSlug}`);
  const cssMsg = formatHumanCommitMessage(parsed.css?.commitMessage, `style ${cleanSlug} with modern css`);

  return [
    {
      partIndex: 1,
      totalParts: 2,
      filePath: `${folder}/index.html`,
      fileContent: parsed.html?.code || '<!-- empty -->',
      topicTitle: `${parsed.topicTitle} (HTML)`,
      language: 'html',
      commitMessage: htmlMsg,
      source: 'gemini',
    },
    {
      partIndex: 2,
      totalParts: 2,
      filePath: `${folder}/styles.css`,
      fileContent: parsed.css?.code || '/* empty */',
      topicTitle: `${parsed.topicTitle} (CSS)`,
      language: 'css',
      commitMessage: cssMsg,
      source: 'gemini',
    },
  ];
}
