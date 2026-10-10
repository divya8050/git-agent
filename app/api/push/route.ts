import { NextRequest, NextResponse } from 'next/server';
import { pushFileToGitHub, updateReadmeTracker, generateRandomHumanTimestamps } from '@/lib/github';
import { generateDailyJavaScriptPack } from '@/lib/generator';
import { generateDailyHtmlCssPack } from '@/lib/html-css-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      track = 'both', // 'js', 'html', or 'both'
      customTopic,
      clientToken,
      clientOwner,
      clientRepo,
      clientEmail,
      count,
      // account selector — defaults to 'divya' to preserve existing behaviour
      account = 'divya',
    } = body;

    // Redirect Sanket requests to the dedicated endpoint — keeps concerns isolated
    if (account === 'sanket') {
      return NextResponse.json(
        {
          error:
            'To trigger Sanket\'s job, POST to /api/push-sanket instead. ' +
            'The /api/push endpoint is reserved for Divya\'s account (backward compatible).',
          redirectTo: '/api/push-sanket',
        },
        { status: 400 }
      );
    }

    const token = clientToken || process.env.GITHUB_TOKEN;
    const owner = clientOwner || process.env.GITHUB_OWNER;
    const repo = clientRepo || process.env.GITHUB_REPO;
    const htmlCssRepo = process.env.HTML_CSS_REPO || 'html-css';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const authorName = process.env.GIT_AUTHOR_NAME || 'divya adsare';
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

    const today = new Date().toISOString().split('T')[0];
    const allResults = [];

    // 1. JavaScript Track
    if (track === 'js' || track === 'both') {
      const jsConfig = { token, owner, repo, branch, authorName, authorEmail };
      const jsPack = await generateDailyJavaScriptPack(commitsCount, customTopic);
      const jsTimestamps = generateRandomHumanTimestamps(jsPack.length, new Date(), 'day');

      for (let i = 0; i < jsPack.length; i++) {
        const item = jsPack[i];
        const commitDate = jsTimestamps[i];

        const pushResult = await pushFileToGitHub(
          jsConfig,
          item.filePath,
          item.fileContent,
          item.commitMessage,
          commitDate
        );

        if (pushResult.success) {
          allResults.push({
            track: 'javascript',
            repo: repo,
            part: item.partIndex,
            topic: item.topicTitle,
            filePath: item.filePath,
            commitSha: pushResult.commitSha,
            commitUrl: pushResult.commitUrl,
            commitDate: commitDate,
          });
        }

        if (i < jsPack.length - 1) {
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
        }
      }

      if (allResults.length > 0) {
        const mainItem = jsPack[0];
        await updateReadmeTracker(jsConfig, {
          date: today,
          title: mainItem.topicTitle.replace(' (Part 1: Core Concept)', '').replace(' (Part 1)', ''),
          language: 'JavaScript',
          difficulty: mainItem.difficulty,
          filePath: mainItem.filePath,
          commitUrl: allResults[0].commitUrl,
        });
      }
    }

    // 2. HTML & CSS Track
    if ((track === 'html' || track === 'both') && htmlCssRepo) {
      const htmlConfig = { token, owner, repo: htmlCssRepo, branch, authorName, authorEmail };
      const htmlPack = await generateDailyHtmlCssPack(customTopic);
      const htmlTimestamps = generateRandomHumanTimestamps(htmlPack.length, new Date(), 'evening');

      for (let i = 0; i < htmlPack.length; i++) {
        const item = htmlPack[i];
        const commitDate = htmlTimestamps[i];

        const pushResult = await pushFileToGitHub(
          htmlConfig,
          item.filePath,
          item.fileContent,
          item.commitMessage,
          commitDate
        );

        if (pushResult.success) {
          allResults.push({
            track: 'html-css',
            repo: htmlCssRepo,
            part: item.partIndex,
            topic: item.topicTitle,
            filePath: item.filePath,
            commitSha: pushResult.commitSha,
            commitUrl: pushResult.commitUrl,
            commitDate: commitDate,
          });
        }

        if (i < htmlPack.length - 1) {
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
        }
      }

      if (htmlPack.length > 0) {
        const mainItem = htmlPack[0];
        await updateReadmeTracker(htmlConfig, {
          date: today,
          title: mainItem.topicTitle.replace(' (HTML)', ''),
          language: 'HTML & CSS',
          difficulty: 'Beginner',
          filePath: mainItem.filePath,
          commitUrl: allResults[allResults.length - 1]?.commitUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalCommitsPushed: allResults.length,
      commits: allResults,
      message: `Pushed ${allResults.length} commits across learning tracks!`,
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
