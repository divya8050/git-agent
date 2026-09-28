import { NextRequest, NextResponse } from 'next/server';
import { pushFileToGitHub, updateReadmeTracker, generateRandomHumanTimestamps } from '@/lib/github';
import { generateDailyJavaScriptPack } from '@/lib/generator';

// Prevents caching of cron requests
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretQuery = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce security
    if (expectedSecret) {
      const isBearerValid = authHeader === `Bearer ${expectedSecret}`;
      const isQueryValid = secretQuery === expectedSecret;

      if (!isBearerValid && !isQueryValid) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing CRON_SECRET.' },
          { status: 401 }
        );
      }
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const authorName = process.env.GIT_AUTHOR_NAME || 'Daily Practice Agent';
    const authorEmail = process.env.GIT_AUTHOR_EMAIL;
    const commitsCount = parseInt(process.env.COMMITS_PER_DAY || '3', 10);

    if (!token || !owner || !repo) {
      return NextResponse.json(
        {
          error:
            'Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO.',
        },
        { status: 500 }
      );
    }

    const config = {
      token,
      owner,
      repo,
      branch,
      authorName,
      authorEmail,
    };

    // 1. Generate 2 to 3 progressive JavaScript practice commits for today
    const pack = await generateDailyJavaScriptPack(commitsCount);
    const commitResults = [];
    const timestamps = generateRandomHumanTimestamps(pack.length);

    // 2. Push each commit with realistic human randomized timestamps
    for (let i = 0; i < pack.length; i++) {
      const item = pack[i];
      const commitDate = timestamps[i];

      const pushResult = await pushFileToGitHub(
        config,
        item.filePath,
        item.fileContent,
        item.commitMessage,
        commitDate
      );

      if (pushResult.success) {
        commitResults.push({
          part: item.partIndex,
          topic: item.topicTitle,
          filePath: item.filePath,
          commitSha: pushResult.commitSha,
          commitUrl: pushResult.commitUrl,
          commitDate: commitDate,
        });
      } else {
        console.error(`Failed to push part ${item.partIndex}:`, pushResult.error);
      }

      // Small natural delay between network requests
      if (i < pack.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
      }
    }

    if (commitResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to push any practice commits to GitHub repository.' },
        { status: 502 }
      );
    }

    // 3. Update README streak table
    const today = new Date().toISOString().split('T')[0];
    const mainItem = pack[0];
    await updateReadmeTracker(config, {
      date: today,
      title: mainItem.topicTitle.replace(' (Part 1: Core Concept)', '').replace(' (Part 1)', ''),
      language: 'JavaScript',
      difficulty: mainItem.difficulty,
      filePath: mainItem.filePath,
      commitUrl: commitResults[0].commitUrl,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      commitsPushed: commitResults.length,
      commits: commitResults,
      message: `Successfully pushed ${commitResults.length} JavaScript mastery commits to GitHub!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error executing daily cron push:', error);
    return NextResponse.json(
      {
        error: `Unexpected error during cron run: ${message}`,
      },
      { status: 500 }
    );
  }
}
