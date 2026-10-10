import { NextRequest, NextResponse } from 'next/server';
import { pushFileToGitHub, updateReadmeTracker, generateRandomHumanTimestamps, GitHubConfig } from '@/lib/github';
import { generateDailyJavaScriptPack, getRandomDailyCommitCounts } from '@/lib/generator';
import { generateDailyHtmlCssPack } from '@/lib/html-css-generator';
import { generateDailySanketPack } from '@/lib/sanket-generator';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────

interface CommitResult {
  repo: string;
  part: number;
  topic: string;
  filePath: string;
  commitSha?: string;
  commitUrl?: string;
  commitDate: string;
}

interface JobResult {
  account: string;
  success: boolean;
  commits: CommitResult[];
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

// ─── Auth helper ──────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const urlObj = request.nextUrl || new URL(request.url, 'http://localhost');
  const secretQuery = urlObj.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) return true; // no secret configured — open (not recommended)

  return (
    authHeader === `Bearer ${expectedSecret}` ||
    secretQuery === expectedSecret
  );
}

// ─── Divya's daily job ────────────────────────────────────────

async function runDivyaJob(today: string): Promise<JobResult> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const htmlCssRepo = process.env.HTML_CSS_REPO || 'html-css';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const authorName = process.env.GIT_AUTHOR_NAME || 'divya adsare';
  const authorEmail = process.env.GIT_AUTHOR_EMAIL;
  const minCommits = parseInt(process.env.MIN_COMMITS_PER_DAY || '2', 10);
  const maxCommits = parseInt(process.env.MAX_COMMITS_PER_DAY || '8', 10);

  if (!token || !owner || !repo) {
    return {
      account: 'divya',
      success: false,
      commits: [],
      error: 'Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO.',
    };
  }

  const { jsCount, htmlCount } = getRandomDailyCommitCounts(minCommits, maxCommits);
  const jsConfig: GitHubConfig = { token, owner, repo, branch, authorName, authorEmail };

  const allCommits: CommitResult[] = [];

  try {
    // Track 1: JavaScript
    const jsPack = await generateDailyJavaScriptPack(jsCount);
    const jsTimestamps = generateRandomHumanTimestamps(jsPack.length, new Date(), 'day');

    for (let i = 0; i < jsPack.length; i++) {
      const item = jsPack[i];
      const commitDate = jsTimestamps[i];
      const pushResult = await pushFileToGitHub(jsConfig, item.filePath, item.fileContent, item.commitMessage, commitDate);

      if (pushResult.success) {
        allCommits.push({
          repo,
          part: item.partIndex,
          topic: item.topicTitle,
          filePath: item.filePath,
          commitSha: pushResult.commitSha,
          commitUrl: pushResult.commitUrl,
          commitDate,
        });
      }

      if (i < jsPack.length - 1) {
        await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      }
    }

    if (allCommits.length > 0) {
      const mainItem = jsPack[0];
      await updateReadmeTracker(jsConfig, {
        date: today,
        title: mainItem.topicTitle.replace(' (Part 1: Core Concept)', '').replace(' (Part 1)', ''),
        language: 'JavaScript',
        difficulty: mainItem.difficulty,
        filePath: mainItem.filePath,
        commitUrl: allCommits[0].commitUrl,
      });
    }

    // Track 2: HTML & CSS
    if (htmlCssRepo) {
      const htmlConfig: GitHubConfig = { token, owner, repo: htmlCssRepo, branch, authorName, authorEmail };
      const htmlPack = await generateDailyHtmlCssPack(htmlCount);
      const htmlTimestamps = generateRandomHumanTimestamps(htmlPack.length, new Date(), 'evening');

      for (let i = 0; i < htmlPack.length; i++) {
        const item = htmlPack[i];
        const commitDate = htmlTimestamps[i];
        const pushResult = await pushFileToGitHub(htmlConfig, item.filePath, item.fileContent, item.commitMessage, commitDate);

        if (pushResult.success) {
          allCommits.push({
            repo: htmlCssRepo,
            part: item.partIndex,
            topic: item.topicTitle,
            filePath: item.filePath,
            commitSha: pushResult.commitSha,
            commitUrl: pushResult.commitUrl,
            commitDate,
          });
        }

        if (i < htmlPack.length - 1) {
          await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
        }
      }

      if (allCommits.filter(c => c.repo === htmlCssRepo).length > 0) {
        const mainHtmlItem = htmlPack[0];
        await updateReadmeTracker(htmlConfig, {
          date: today,
          title: mainHtmlItem.topicTitle.replace(' (HTML)', ''),
          language: 'HTML & CSS',
          difficulty: 'Beginner',
          filePath: mainHtmlItem.filePath,
          commitUrl: allCommits.find(c => c.repo === htmlCssRepo)?.commitUrl,
        });
      }
    }

    return { account: 'divya', success: true, commits: allCommits };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      account: 'divya',
      success: false,
      commits: allCommits,
      error: `Divya job error: ${message}`,
    };
  }
}

// ─── Sanket's daily job ───────────────────────────────────────

async function runSanketJob(today: string): Promise<JobResult> {
  const token = process.env.SANKET_GITHUB_TOKEN;
  const owner = process.env.SANKET_GITHUB_OWNER;
  const repo = process.env.SANKET_GITHUB_REPO;
  const branch = process.env.SANKET_GITHUB_BRANCH || 'main';
  const authorName = process.env.SANKET_GIT_AUTHOR_NAME || 'Sanket Adsare';
  const authorEmail = process.env.SANKET_GIT_AUTHOR_EMAIL;
  const minCommits = parseInt(process.env.SANKET_MIN_COMMITS_PER_DAY || '2', 10);
  const maxCommits = parseInt(process.env.SANKET_MAX_COMMITS_PER_DAY || '8', 10);

  // Explicit misconfiguration guard — never silently fall back to Divya's token
  if (!token) {
    return {
      account: 'sanket',
      success: false,
      commits: [],
      skipped: true,
      skipReason: 'SANKET_GITHUB_TOKEN is not configured — Sanket job skipped.',
    };
  }
  if (!owner || !repo) {
    return {
      account: 'sanket',
      success: false,
      commits: [],
      skipped: true,
      skipReason: 'SANKET_GITHUB_OWNER or SANKET_GITHUB_REPO is not configured — Sanket job skipped.',
    };
  }

  const total = Math.floor(Math.random() * (maxCommits - minCommits + 1)) + minCommits;
  const commitsCount = Math.max(2, Math.min(8, total));

  const config: GitHubConfig = { token, owner, repo, branch, authorName, authorEmail };
  const allCommits: CommitResult[] = [];

  try {
    const pack = await generateDailySanketPack(commitsCount);
    const timestamps = generateRandomHumanTimestamps(pack.length, new Date(), 'day');

    for (let i = 0; i < pack.length; i++) {
      const item = pack[i];
      const commitDate = timestamps[i];
      const pushResult = await pushFileToGitHub(config, item.filePath, item.fileContent, item.commitMessage, commitDate);

      if (pushResult.success) {
        allCommits.push({
          repo,
          part: item.partIndex,
          topic: item.topicTitle,
          filePath: item.filePath,
          commitSha: pushResult.commitSha,
          commitUrl: pushResult.commitUrl,
          commitDate,
        });
      }

      if (i < pack.length - 1) {
        await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      }
    }

    // Update Sanket's README tracker (uses Sanket's config — not Divya's)
    if (allCommits.length > 0) {
      const mainItem = pack[0];
      await updateReadmeTracker(config, {
        date: today,
        title: mainItem.topicTitle.replace(' — Notes', '').replace(' (Part 1)', ''),
        language: 'TypeScript',
        difficulty: mainItem.difficulty,
        filePath: mainItem.filePath,
        commitUrl: allCommits[0].commitUrl,
      });
    }

    return { account: 'sanket', success: true, commits: allCommits };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      account: 'sanket',
      success: false,
      commits: allCommits,
      error: `Sanket job error: ${message}`,
    };
  }
}

// ─── Main handler ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing CRON_SECRET.' },
      { status: 401 }
    );
  }

  // Use the same ISO date for both jobs — prevents timezone split-brain
  const today = new Date().toISOString().split('T')[0];

  // Run both accounts concurrently; errors are isolated by Promise.allSettled
  const [divyaSettled, sanketSettled] = await Promise.allSettled([
    runDivyaJob(today),
    runSanketJob(today),
  ]);

  const divyaResult: JobResult =
    divyaSettled.status === 'fulfilled'
      ? divyaSettled.value
      : { account: 'divya', success: false, commits: [], error: String(divyaSettled.reason) };

  const sanketResult: JobResult =
    sanketSettled.status === 'fulfilled'
      ? sanketSettled.value
      : { account: 'sanket', success: false, commits: [], error: String(sanketSettled.reason) };

  const totalCommits = divyaResult.commits.length + sanketResult.commits.length;
  const allSucceeded = divyaResult.success && (sanketResult.success || sanketResult.skipped);

  return NextResponse.json({
    success: allSucceeded,
    timestamp: new Date().toISOString(),
    date: today,
    totalCommitsPushed: totalCommits,
    accounts: {
      divya: {
        success: divyaResult.success,
        commitCount: divyaResult.commits.length,
        commits: divyaResult.commits,
        error: divyaResult.error,
      },
      sanket: {
        success: sanketResult.success,
        skipped: sanketResult.skipped || false,
        skipReason: sanketResult.skipReason,
        commitCount: sanketResult.commits.length,
        commits: sanketResult.commits,
        error: sanketResult.error,
      },
    },
    message: `Pushed ${totalCommits} total commits (Divya: ${divyaResult.commits.length}, Sanket: ${sanketResult.commits.length})`,
    // Backward-compatible top-level fields (existing callers)
    javascriptCommits: divyaResult.commits.filter(c => c.repo === process.env.GITHUB_REPO).length,
    htmlCssCommits: divyaResult.commits.filter(c => c.repo !== process.env.GITHUB_REPO).length,
    commits: [...divyaResult.commits, ...sanketResult.commits],
  });
}
