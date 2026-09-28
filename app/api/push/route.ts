import { NextRequest, NextResponse } from 'next/server';
import { pushFileToGitHub, updateReadmeTracker, generateRandomHumanTimestamps } from '@/lib/github';
import { generateDailyJavaScriptPack } from '@/lib/generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customTopic, clientToken, clientOwner, clientRepo, clientEmail, count } = body;

    const token = clientToken || process.env.GITHUB_TOKEN;
    const owner = clientOwner || process.env.GITHUB_OWNER;
    const repo = clientRepo || process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const authorName = process.env.GIT_AUTHOR_NAME || 'Daily Practice Agent';
    const authorEmail = clientEmail || process.env.GIT_AUTHOR_EMAIL;
    const commitsCount = count ? parseInt(count, 10) : parseInt(process.env.COMMITS_PER_DAY || '3', 10);

    if (!token || !owner || !repo) {
      return NextResponse.json(
        {
          error:
            'Missing GitHub credentials. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in environment variables.',
        },
        { status: 400 }
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

    // 1. Generate multi-commit pack
    const pack = await generateDailyJavaScriptPack(commitsCount, customTopic);
    const commitResults = [];
    const timestamps = generateRandomHumanTimestamps(pack.length);

    // 2. Push each commit with natural randomized timestamps
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
          previewCode: item.fileContent,
        });
      }

      if (i < pack.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
      }
    }

    if (commitResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to push commits to GitHub.' },
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
      topic: mainItem.topicTitle,
      commitUrl: commitResults[0].commitUrl,
      filePath: commitResults[0].filePath,
      difficulty: mainItem.difficulty,
      message: `Successfully pushed ${commitResults.length} JavaScript mastery commits!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error during manual push:', error);
    return NextResponse.json(
      { error: `Manual push failed: ${message}` },
      { status: 500 }
    );
  }
}
