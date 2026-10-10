import { NextResponse } from 'next/server';
import {
  verifyGitHubAccess,
  fetchContributionCalendar,
  fetchUserRepositoriesAndCommits,
  RepositorySummary,
  CommitSummary,
} from '@/lib/github';
import { getSanketRoadmapDay } from '@/lib/sanket-generator';
import { getSanketTopicForDay } from '@/lib/sanket-curriculum';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status-sanket
 *
 * Returns Sanket's account configuration status, GitHub connection health,
 * contribution calendar, and today's planned topic — without exposing secrets.
 */
export async function GET() {
  const token = process.env.SANKET_GITHUB_TOKEN;
  const owner = process.env.SANKET_GITHUB_OWNER;
  const repo = process.env.SANKET_GITHUB_REPO;
  const authorEmail = process.env.SANKET_GIT_AUTHOR_EMAIL;
  const authorName = process.env.SANKET_GIT_AUTHOR_NAME;
  const minCommits = parseInt(process.env.SANKET_MIN_COMMITS_PER_DAY || '2', 10);
  const maxCommits = parseInt(process.env.SANKET_MAX_COMMITS_PER_DAY || '8', 10);
  const startDate = process.env.SANKET_STREAK_START_DATE || '2026-10-10';
  const hasSanketGeminiKey = Boolean(process.env.SANKET_GEMINI_API_KEY);

  const envConfigured = {
    hasToken: Boolean(token),
    hasOwner: Boolean(owner),
    hasRepo: Boolean(repo),
    hasAuthorEmail: Boolean(authorEmail),
    hasAuthorName: Boolean(authorName),
    hasSanketGeminiKey,
    // Partial masking — no secrets exposed
    owner: owner || null,
    repo: repo || null,
    authorName: authorName || null,
    authorEmail: authorEmail ? `${authorEmail.slice(0, 3)}***@***` : null,
    minCommits,
    maxCommits,
    streakStartDate: startDate,
    configured: Boolean(token && owner && repo),
  };

  if (!envConfigured.configured) {
    return NextResponse.json({
      status: 'unconfigured',
      timestamp: new Date().toISOString(),
      account: 'sanket',
      environment: envConfigured,
      github: {
        checked: false,
        valid: false,
        message: 'Sanket account is not yet configured. Add SANKET_GITHUB_TOKEN, SANKET_GITHUB_OWNER, and SANKET_GITHUB_REPO to Vercel environment variables.',
      },
    });
  }

  interface GitHubStatus {
    checked: boolean;
    valid: boolean;
    error?: string;
    message?: string;
    user?: { login: string; name: string; avatar_url: string };
    repo?: { name: string; full_name: string; default_branch: string; private: boolean };
  }

  let connectionStatus: GitHubStatus = {
    checked: false,
    valid: false,
    message: 'Not checked yet.',
  };

  let calendarData = null;
  let allRepos: RepositorySummary[] = [];
  let recentCommits: CommitSummary[] = [];

  try {
    const [check, calData, reposCommits] = await Promise.all([
      verifyGitHubAccess({ token: token!, owner: owner!, repo: repo!, authorEmail }),
      fetchContributionCalendar(token!, owner!),
      fetchUserRepositoriesAndCommits(token!, owner!),
    ]);

    connectionStatus = { checked: true, ...check };
    calendarData = calData;
    allRepos = reposCommits.repos;
    recentCommits = reposCommits.commits;
  } catch (err) {
    connectionStatus = {
      checked: true,
      valid: false,
      error: `Failed to check GitHub status: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const dayNumber = getSanketRoadmapDay();
  const todayTopic = getSanketTopicForDay(dayNumber);

  return NextResponse.json({
    status: 'online',
    account: 'sanket',
    timestamp: new Date().toISOString(),
    environment: envConfigured,
    github: connectionStatus,
    dayNumber,
    contributions: calendarData,
    repositories: allRepos,
    recentCommits,
    todayTopic: {
      title: todayTopic.title,
      category: todayTopic.category,
      difficulty: todayTopic.difficulty,
      folder: todayTopic.folder,
      slug: todayTopic.slug,
      commitMessages: todayTopic.commitMessages,
    },
  });
}
