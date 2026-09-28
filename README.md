# 🚀 GitStreak: Automated GitHub Daily Practice & Green Streak Agent

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Vercel Cron](https://img.shields.io/badge/Vercel_Cron-Active-brightgreen?logo=vercel)
![GitHub Streak](https://img.shields.io/badge/Daily_Streak-Automated-emerald?logo=github)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)
![Python](https://img.shields.io/badge/Python-Supported-yellow?logo=python)

**GitStreak** is an automated, serverless agent designed to be deployed to **Vercel** with zero running costs. Every single day, it generates a clean software engineering problem solution, algorithm, design pattern, or utility snippet and commits it directly to your target GitHub repository.

---

## ✨ Features

- 🟢 **Guaranteed Green Contribution Squares**: Uses GitHub's REST Git Database API with your verified commit author email, ensuring every commit registers on your GitHub contribution graph.
- ⚡ **100% Serverless on Vercel**: Runs on Vercel's free tier with automated daily cron execution (`vercel.json`).
- 🧠 **Dual Generation Engine**:
  - **AI Mode**: Uses Google Gemini API to generate fresh daily coding challenges and solutions.
  - **Built-in Offline Curriculum**: 365+ curated algorithms (Two Pointers, Sliding Window, LRU Cache, Tries, Pub/Sub, Rate Limiters, etc.) in both **TypeScript** and **Python**. It never fails even without an AI key!
- 📊 **Live Dark Dashboard**: Preview today's code, trigger an immediate manual commit, test GitHub connection credentials, and track deployment status.
- 📝 **Automated README Streak Log**: Updates a markdown table in your practice repository with the date, topic name, language, difficulty, and direct commit link.

---

## 🛠️ Quick Setup (5 Minutes)

### Step 1: Create a Practice Repository on GitHub
1. Go to [GitHub New Repository](https://github.com/new).
2. Name it something like `daily-code-practice` (can be **Public** or **Private**).
3. Initialize it with a `README.md` and default branch `main`.

### Step 2: Generate a GitHub Personal Access Token (PAT)
1. Go to [GitHub Personal Access Tokens (Classic)](https://github.com/settings/tokens).
2. Click **Generate new token (classic)**.
3. Name it `GitStreak-Vercel-Agent`.
4. Select the **`repo`** scope (Full control of private repositories).
5. Copy the generated token (`ghp_...`).

> *Note: If using Fine-Grained Personal Access Tokens, grant **Repository permissions > Contents: Read and write**.*

### Step 3: Find your Verified GitHub Email (CRITICAL FOR GREEN STREAK!)
> ⚠️ **IMPORTANT**: GitHub only awards green contribution squares if the commit's `GIT_AUTHOR_EMAIL` matches an email linked to your GitHub account!
1. Go to [GitHub Email Settings](https://github.com/settings/emails).
2. Note your primary email, or your GitHub noreply email (e.g. `12345678+username@users.noreply.github.com`).

---

## 🚀 Deploying to Vercel

### Method A: One-Click / GitHub Import (Recommended)
1. Push this repository to your own GitHub account.
2. Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import this repository.
4. Under **Environment Variables**, add the variables listed below.
5. Click **Deploy**!

### Method B: Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🔑 Environment Variables Reference

Configure these in your **Vercel Project Settings > Environment Variables** (or locally in `.env.local`):

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `GITHUB_TOKEN` | **Yes** | GitHub PAT with repo write permission | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | **Yes** | Your GitHub username or organization | `yourusername` |
| `GITHUB_REPO` | **Yes** | Repository where daily code is pushed | `daily-code-practice` |
| `GIT_AUTHOR_NAME` | **Yes** | Author name displayed on commits | `Jane Doe` |
| `GIT_AUTHOR_EMAIL` | **Yes (Crucial!)** | Your verified GitHub account email | `jane@example.com` |
| `CRON_SECRET` | Recommended | Secret token to secure `/api/cron` | `my_secret_cron_token_123` |
| `GITHUB_BRANCH` | Optional | Branch to commit to (default `main`) | `main` |
| `PREFERRED_LANGUAGE`| Optional | `typescript` or `python` (default `typescript`) | `python` |
| `GEMINI_API_KEY` | Optional | Google AI Studio key for dynamic AI code generation | `AIzaSy...` |

---

## ⏰ How the Daily Cron Automation Works

The automated daily schedule is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 10 * * *"
    }
  ]
}
```

- Every day at **10:00 AM UTC**, Vercel triggers `GET /api/cron`.
- Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header.
- The agent generates today's solution, commits it to `daily-practice/YYYY/MM/...`, updates the repository's `README.md`, and returns a detailed execution status.

### Manual / Immediate Trigger
You can trigger a commit at any time:
1. Open your deployed Vercel URL (e.g. `https://your-agent.vercel.app`).
2. Click **"Push Code to GitHub Now"**.
3. Or send a request:
```bash
curl -X POST https://your-agent.vercel.app/api/push \
  -H "Content-Type: application/json" \
  -d '{"language": "typescript"}'
```

---

## 💻 Local Development & Testing

```bash
# Clone the repository
git clone <repo-url>
cd git-agent

# Install dependencies
npm install

# Copy environment template and fill in your credentials
cp .env.example .env.local

# Run the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

---

## 🛡️ License

MIT License &copy; 2026 GitStreak Agent. Built for developers to foster daily consistency.
