import { NextResponse } from 'next/server';
import { verifyGitHubAccess } from '@/lib/github';
import { getCurriculumForDate } from '@/lib/curriculum';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const authorEmail = process.env.GIT_AUTHOR_EMAIL;
  const cronSecret = process.env.CRON_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const preferredLang = process.env.PREFERRED_LANGUAGE || 'typescript';

  const envConfigured = {
    hasToken: Boolean(token),
    hasOwner: Boolean(owner),
    hasRepo: Boolean(repo),
    hasAuthorEmail: Boolean(authorEmail),
    hasCronSecret: Boolean(cronSecret),
    hasGeminiKey: Boolean(geminiKey),
    owner: owner || null,
    repo: repo || null,
    authorEmail: authorEmail ? `${authorEmail.slice(0, 3)}***@***` : null,
    preferredLang,
  };

  interface GitHubStatus {
    checked: boolean;
    valid: boolean;
    error?: string;
    message?: string;
    user?: {
      login: string;
      name: string;
      email?: string;
      avatar_url: string;
    };
    repo?: {
      name: string;
      full_name: string;
      default_branch: string;
      private: boolean;
    };
  }

  let connectionStatus: GitHubStatus = {
    checked: false,
    valid: false,
    message: 'GitHub credentials not fully configured in environment.',
  };

  if (token && owner && repo) {
    const check = await verifyGitHubAccess({
      token,
      owner,
      repo,
      authorEmail,
    });
    connectionStatus = {
      checked: true,
      ...check,
    };
  }

  const todayCurriculum = getCurriculumForDate(new Date());

  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: envConfigured,
    github: connectionStatus,
    todayPreview: {
      title: todayCurriculum.title,
      category: todayCurriculum.category,
      difficulty: todayCurriculum.difficulty,
    },
  });
}
