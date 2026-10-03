import { NextRequest, NextResponse } from 'next/server';
import { pushFileToGitHub, updateReadmeTracker, generateRandomHumanTimestamps } from '@/lib/github';
import { generateDailyJavaScriptPack, getRandomDailyCommitCounts } from '@/lib/generator';
import { generateDailyHtmlCssPack } from '@/lib/html-css-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const urlObj = request.nextUrl || new URL(request.url, 'http://localhost');
    const secretQuery = urlObj.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

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
    const htmlCssRepo = process.env.HTML_CSS_REPO || 'html-css';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const authorName = process.env.GIT_AUTHOR_NAME || 'divya adsare';
    const authorEmail = process.env.GIT_AUTHOR_EMAIL;
    const minCommits = parseInt(process.env.MIN_COMMITS_PER_DAY || '2', 10);
    const maxCommits = parseInt(process.env.MAX_COMMITS_PER_DAY || '8', 10);

    const { jsCount, htmlCount } = getRandomDailyCommitCounts(minCommits, maxCommits);

    if (!token || !owner || !repo) {
      return NextResponse.json(
        {
          error:
            'Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO.',
        },
        { status: 500 }
      );
    }

    const jsConfig = {
      token,
      owner,
      repo,
      branch,
      authorName,
      authorEmail,
    };

    const today = new Date().toISOString().split('T')[0];

    // =========================================================================
    // 1. TRACK 1: JAVASCRIPT MASTERY (Day Session Timestamps)
    // =========================================================================
    const jsPack = await generateDailyJavaScriptPack(jsCount);
    const jsCommitResults = [];
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
        jsCommitResults.push({
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
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
      }
    }

    if (jsCommitResults.length > 0) {
      const mainItem = jsPack[0];
      await updateReadmeTracker(jsConfig, {
        date: today,
        title: mainItem.topicTitle.replace(' (Part 1: Core Concept)', '').replace(' (Part 1)', ''),
        language: 'JavaScript',
        difficulty: mainItem.difficulty,
        filePath: mainItem.filePath,
        commitUrl: jsCommitResults[0].commitUrl,
      });
    }

    // =========================================================================
    // 2. TRACK 2: HTML & CSS MASTERY (Evening Session Timestamps)
    // =========================================================================
    const htmlCommitResults = [];
    if (htmlCssRepo) {
      const htmlConfig = {
        token,
        owner,
        repo: htmlCssRepo,
        branch,
        authorName,
        authorEmail,
      };

      const htmlPack = await generateDailyHtmlCssPack(htmlCount);
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
          htmlCommitResults.push({
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
          await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
        }
      }

      if (htmlCommitResults.length > 0) {
        const mainHtmlItem = htmlPack[0];
        await updateReadmeTracker(htmlConfig, {
          date: today,
          title: mainHtmlItem.topicTitle.replace(' (HTML)', ''),
          language: 'HTML & CSS',
          difficulty: 'Beginner',
          filePath: mainHtmlItem.filePath,
          commitUrl: htmlCommitResults[0].commitUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      javascriptCommits: jsCommitResults.length,
      htmlCssCommits: htmlCommitResults.length,
      totalCommitsPushed: jsCommitResults.length + htmlCommitResults.length,
      commits: [...jsCommitResults, ...htmlCommitResults],
      message: `Pushed ${jsCommitResults.length} JS commits and ${htmlCommitResults.length} HTML/CSS commits successfully!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error executing daily cron push:', error);
    return NextResponse.json(
      { error: `Unexpected error during cron run: ${message}` },
      { status: 500 }
    );
  }
}
