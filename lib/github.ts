export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface PushResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  filePath?: string;
  message?: string;
  error?: string;
}

/**
 * Validates connection to the GitHub repository and verifies user permissions.
 */
export async function verifyGitHubAccess(config: GitHubConfig) {
  const { token, owner, repo } = config;

  if (!token) {
    return { valid: false, error: 'GITHUB_TOKEN is missing.' };
  }
  if (!owner || !repo) {
    return { valid: false, error: 'GITHUB_OWNER or GITHUB_REPO is missing.' };
  }

  try {
    // 1. Check authenticated user
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Daily-Streak-Agent',
      },
      cache: 'no-store',
    });

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({}));
      return {
        valid: false,
        error: `GitHub Authentication failed (${userRes.status}): ${err.message || userRes.statusText}`,
      };
    }

    const userData = await userRes.json();

    // 2. Check repository access
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Daily-Streak-Agent',
      },
      cache: 'no-store',
    });

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return {
        valid: false,
        error: `Repository ${owner}/${repo} not accessible (${repoRes.status}): ${err.message || repoRes.statusText}. Make sure the repository exists and your token has repo write access.`,
      };
    }

    const repoData = await repoRes.json();

    return {
      valid: true,
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        email: userData.email,
        avatar_url: userData.avatar_url,
      },
      repo: {
        name: repoData.name,
        full_name: repoData.full_name,
        default_branch: repoData.default_branch,
        private: repoData.private,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: `Network error connecting to GitHub: ${message}`,
    };
  }
}

/**
 * Pushes a file directly to the GitHub repository using the REST API.
 * Commits with the specified author and committer email so that GitHub
 * attributes the commit to the user's account and updates their contribution graph.
 */
export async function pushFileToGitHub(
  config: GitHubConfig,
  filePath: string,
  fileContent: string,
  commitMessage: string,
  commitDate?: string
): Promise<PushResult> {
  const {
    token,
    owner,
    repo,
    branch = 'main',
    authorName = 'Daily Practice Agent',
    authorEmail,
  } = config;

  if (!token || !owner || !repo) {
    return {
      success: false,
      error: 'Missing required GitHub credentials (token, owner, or repo).',
    };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const baseHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Daily-Streak-Agent',
  };

  try {
    // Check if the file already exists to get its SHA (required for updating)
    let fileSha: string | undefined = undefined;
    const existingFileRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: baseHeaders,
      cache: 'no-store',
    });

    if (existingFileRes.ok) {
      const existingData = await existingFileRes.json();
      fileSha = existingData.sha;
    }

    // Convert file content to base64 (UTF-8 safe)
    const base64Content = Buffer.from(fileContent, 'utf-8').toString('base64');

    const payload: Record<string, unknown> = {
      message: commitMessage,
      content: base64Content,
      branch: branch,
    };

    if (fileSha) {
      payload.sha = fileSha;
    }

    // IMPORTANT: Providing author and committer with verified GitHub email ensures
    // the green streak square is credited on the user's profile!
    if (authorEmail) {
      const committerObj: Record<string, string> = {
        name: authorName,
        email: authorEmail,
      };
      const authorObj: Record<string, string> = {
        name: authorName,
        email: authorEmail,
      };

      // Set humanized randomized timestamp if provided
      if (commitDate) {
        committerObj.date = commitDate;
        authorObj.date = commitDate;
      }

      payload.committer = committerObj;
      payload.author = authorObj;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const errorData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: `GitHub API error (${putRes.status}): ${errorData.message || putRes.statusText}`,
      };
    }

    const resultData = await putRes.json();

    return {
      success: true,
      commitSha: resultData.commit?.sha,
      commitUrl: resultData.commit?.html_url,
      filePath: filePath,
      message: commitMessage,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to commit to GitHub: ${message}`,
    };
  }
}

/**
 * Updates or creates the README.md in the practice repository with an updated
 * streak tracker table and status badge.
 */
export async function updateReadmeTracker(
  config: GitHubConfig,
  todayItem: {
    date: string;
    title: string;
    language: string;
    difficulty: string;
    filePath: string;
    commitUrl?: string;
  }
) {
  const { token, owner, repo, branch = 'main' } = config;
  const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/contents/README.md`;
  const baseHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Daily-Streak-Agent',
  };

  try {
    let currentContent = '';

    const res = await fetch(`${readmeUrl}?ref=${branch}`, {
      headers: baseHeaders,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      currentContent = Buffer.from(data.content, 'base64').toString('utf-8');
    }

    const tableRow = `| ${todayItem.date} | [${todayItem.title}](${todayItem.filePath}) | \`${todayItem.language}\` | \`${todayItem.difficulty}\` | ${todayItem.commitUrl ? `[Commit](${todayItem.commitUrl})` : 'Done'} |`;

    let updatedContent = '';
    if (!currentContent || !currentContent.includes('## 📅 Practice History')) {
      // Create new initial README
      updatedContent = `# 🚀 Daily Practice & Streak Repository

![Daily Streak](https://img.shields.io/badge/Daily_Streak-Active-brightgreen?style=for-the-badge&logo=github)
![Practices](https://img.shields.io/badge/Practice_Agent-Automated-blue?style=for-the-badge&logo=vercel)

Automated daily coding problem solutions, algorithm implementations, and software engineering notes pushed daily by the **Vercel Daily Push Agent**.

## 📅 Practice History

| Date | Topic / Problem | Language | Difficulty | Link |
| :--- | :--- | :--- | :--- | :--- |
${tableRow}

---
*Maintained and auto-committed daily by [GitHub Daily Streak Agent](https://github.com/${owner}/${repo}).*
`;
    } else {
      // Append row to existing table if not already added today
      if (!currentContent.includes(todayItem.date)) {
        updatedContent = currentContent.replace(
          '| :--- | :--- | :--- | :--- | :--- |',
          `| :--- | :--- | :--- | :--- | :--- |\n${tableRow}`
        );
      } else {
        updatedContent = currentContent;
      }
    }

    if (updatedContent !== currentContent) {
      await pushFileToGitHub(
        config,
        'README.md',
        updatedContent,
        `update notes and log for ${todayItem.date}`
      );
    }
  } catch (err) {
    // Non-blocking error for README update
    console.warn('Could not update README.md tracker:', err);
  }
}

/**
 * Generates realistic, human-looking randomized timestamps for daily coding sessions.
 * Randomizes the start time during the day and spaces each commit by 15-40 minutes,
 * breaking any automated bot detection patterns on GitHub.
 */
export function generateRandomHumanTimestamps(
  count: number,
  baseDate: Date = new Date(),
  session: 'day' | 'evening' = 'day'
): string[] {
  const timestamps: string[] = [];
  
  // Day session (e.g. JavaScript): 10:00 to 14:00 (10 AM to 2 PM)
  // Evening session (e.g. HTML/CSS): 16:00 to 21:00 (4 PM to 9 PM)
  const [minH, maxH] = session === 'evening' ? [16, 21] : [10, 14];
  const randomHour = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
  const randomMinute = Math.floor(Math.random() * 50);
  const randomSecond = Math.floor(Math.random() * 59);

  let current = new Date(baseDate);
  current.setHours(randomHour, randomMinute, randomSecond, 0);

  // If the randomized time is ahead of current real time today, shift back
  if (current.getTime() > Date.now()) {
    const hoursBack = Math.floor(Math.random() * 3) + 2;
    current = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
  }

  for (let i = 0; i < count; i++) {
    timestamps.push(current.toISOString());
    // Space next commit by 15 to 38 minutes + random seconds
    const minutesDelta = Math.floor(Math.random() * 24) + 15;
    const secondsDelta = Math.floor(Math.random() * 55) + 5;
    current = new Date(current.getTime() + (minutesDelta * 60 * 1000) + (secondsDelta * 1000));
  }

  return timestamps;
}
