import { NextResponse } from 'next/server';
import {
  verifyGitHubAccess,
  fetchContributionCalendar,
  fetchUserRepositoriesAndCommits,
  ContributionCalendar,
  RepositorySummary,
  CommitSummary,
} from '@/lib/github';
import { getCurrentRoadmapDay } from '@/lib/generator';
import { getRoadmapDay } from '@/lib/js-roadmap';
import { getHtmlCssRoadmapDay } from '@/lib/html-css-roadmap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const htmlCssRepo = process.env.HTML_CSS_REPO || 'html-css';
  const authorEmail = process.env.GIT_AUTHOR_EMAIL;
  const cronSecret = process.env.CRON_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const minCommits = parseInt(process.env.MIN_COMMITS_PER_DAY || '2', 10);
  const maxCommits = parseInt(process.env.MAX_COMMITS_PER_DAY || '8', 10);

  const envConfigured = {
    hasToken: Boolean(token),
    hasOwner: Boolean(owner),
    hasRepo: Boolean(repo),
    hasAuthorEmail: Boolean(authorEmail),
    hasCronSecret: Boolean(cronSecret),
    hasGeminiKey: Boolean(geminiKey),
    owner: owner || null,
    repo: repo || null,
    htmlCssRepo,
    authorEmail: authorEmail ? `${authorEmail.slice(0, 3)}***@***` : null,
    minCommits,
    maxCommits,
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

  let calendarData: ContributionCalendar | null = null;
  let allRepos: RepositorySummary[] = [];
  let recentCommits: CommitSummary[] = [];

  if (token && owner) {
    const [check, calData, reposCommits] = await Promise.all([
      repo
        ? verifyGitHubAccess({ token, owner, repo, authorEmail })
        : Promise.resolve({ valid: false, error: 'No repo configured' }),
      fetchContributionCalendar(token, owner),
      fetchUserRepositoriesAndCommits(token, owner),
    ]);

    connectionStatus = {
      checked: true,
      ...check,
    };
    calendarData = calData;
    allRepos = reposCommits.repos;
    recentCommits = reposCommits.commits;
  }

  const dayNumber = getCurrentRoadmapDay();
  const jsDay = getRoadmapDay(dayNumber);
  const htmlCssDay = getHtmlCssRoadmapDay(dayNumber);

  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: envConfigured,
    github: connectionStatus,
    dayNumber,
    contributions: calendarData,
    repositories: allRepos,
    recentCommits: recentCommits,
    tracks: {
      javascript: {
        repo: repo || 'javascript',
        stage: jsDay.stage,
        topic: jsDay.topic,
        category: jsDay.category,
        difficulty: jsDay.difficulty,
        files: {
          '01-core.js': jsDay.files.core,
          '02-practical.js': jsDay.files.practical,
          '03-tests.js': jsDay.files.tests,
        },
      },
      htmlCss: {
        repo: htmlCssRepo,
        stage: htmlCssDay.stage,
        topic: htmlCssDay.topic,
        files: {
          'index.html': htmlCssDay.files.html,
          'styles.css': htmlCssDay.files.css,
        },
      },
    },
    // Backwards compatibility for any legacy callers
    todayPreview: {
      title: jsDay.topic,
      category: jsDay.category,
      difficulty: jsDay.difficulty,
    },
  });
}
