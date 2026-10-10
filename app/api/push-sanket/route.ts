import { NextRequest, NextResponse } from 'next/server';
import { pushFileToGitHub, updateReadmeTracker, generateRandomHumanTimestamps } from '@/lib/github';
import { generateDailySanketPack } from '@/lib/sanket-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push-sanket
 *
 * Manual push for Sanket's account only — called from the dashboard UI.
 * No auth required (dashboard-facing endpoint; cron auth lives in /api/cron).
 *
 * Body (optional JSON):
 *   { "count": 2, "customTopic": "consistent hashing" }
 */
export async function POST(request: NextRequest) {

  // ── Config ────────────────────────────────────────────────
  const token = process.env.SANKET_GITHUB_TOKEN;
  const owner = process.env.SANKET_GITHUB_OWNER;
  const repo = process.env.SANKET_GITHUB_REPO;
  const branch = process.env.SANKET_GITHUB_BRANCH || 'main';
  const authorName = process.env.SANKET_GIT_AUTHOR_NAME || 'Sanket Adsare';
  const authorEmail = process.env.SANKET_GIT_AUTHOR_EMAIL;

  if (!token) {
    return NextResponse.json(
      { error: 'SANKET_GITHUB_TOKEN is not configured. This account is not active.' },
      { status: 503 }
    );
  }
  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'SANKET_GITHUB_OWNER or SANKET_GITHUB_REPO is not configured.' },
      { status: 503 }
    );
  }

  // ── Request body ──────────────────────────────────────────
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine
  }
  const customTopic = typeof body.customTopic === 'string' ? body.customTopic.trim() || undefined : undefined;
  const commitsCount = body.count ? Math.min(8, Math.max(1, parseInt(String(body.count), 10))) : 2;

  const config = { token, owner, repo, branch, authorName, authorEmail };
  const today = new Date().toISOString().split('T')[0];
  const allResults = [];

  try {
    const pack = await generateDailySanketPack(commitsCount, customTopic);
    const timestamps = generateRandomHumanTimestamps(pack.length, new Date(), 'day');

    for (let i = 0; i < pack.length; i++) {
      const item = pack[i];
      const commitDate = timestamps[i];
      const pushResult = await pushFileToGitHub(config, item.filePath, item.fileContent, item.commitMessage, commitDate);

      if (pushResult.success) {
        allResults.push({
          account: 'sanket',
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
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
      }
    }

    if (allResults.length > 0) {
      const mainItem = pack[0];
      await updateReadmeTracker(config, {
        date: today,
        title: mainItem.topicTitle.replace(' — Notes', '').replace(' (Part 1)', ''),
        language: 'TypeScript',
        difficulty: mainItem.difficulty,
        filePath: mainItem.filePath,
        commitUrl: allResults[0].commitUrl,
      });
    }

    return NextResponse.json({
      success: true,
      account: 'sanket',
      timestamp: new Date().toISOString(),
      totalCommitsPushed: allResults.length,
      commits: allResults,
      message: `Pushed ${allResults.length} commits to sanket8050/${repo}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Sanket manual push failed: ${message}` }, { status: 500 });
  }
}
