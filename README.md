# 🚀 GitStreak: Daily Code Practice Tracker

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-brightgreen?logo=vercel)
![GitHub](https://img.shields.io/badge/Daily_Practice-Active-emerald?logo=github)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)

**GitStreak** is a full-stack personal developer companion designed to keep your software engineering and frontend fundamentals sharp. Deployed serverless on **Vercel**, it organizes daily study modules across algorithms, design patterns, modern JavaScript, and HTML/CSS, committing solutions directly to your GitHub practice repositories.

---

## ✨ Features

- 💻 **Hands-On Daily Exercises**: Progressively builds concepts from fundamentals to advanced patterns with clean code and tests.
- ⚡ **100% Serverless on Vercel**: Runs on Vercel's free tier with automated daily scheduling via `vercel.json`.
- 🧠 **Dual Practice Curriculum**:
  - **Dynamic Practice**: Integrates Gemini API for fresh interview challenges and scenario questions.
  - **180-Day Built-in Roadmap**: Curated real-world topics (closures, event loop, promises, prototypes, DOM, flexbox/grid, responsive layouts, etc.) in **JavaScript** and **HTML/CSS**.
- 📊 **Interactive Dashboard**: Preview daily topics, push practice modules, inspect status, and monitor your personal learning progress.
- 📝 **Structured Practice Log**: Automatically maintains a clean markdown history table in your practice repositories.

---

## 🛠️ Quick Setup

### Step 1: Create Practice Repositories on GitHub
1. Create your practice repository (e.g. `javascript` and `html-css`).
2. Initialize them with a `README.md` and default branch `main`.

### Step 2: Generate a GitHub Personal Access Token (PAT)
1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens).
2. Click **Generate new token (classic)**.
3. Name it `GitStreak-Practice-Sync`.
4. Select the **`repo`** scope.
5. Copy the generated token (`ghp_...`).

### Step 3: Configure Commit Author
Make sure `GIT_AUTHOR_EMAIL` matches your verified GitHub email address so your practice contributions are linked to your profile.

---

## 🚀 Deploying to Vercel

1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import this repository.
4. Under **Environment Variables**, add the variables listed below.
5. Click **Deploy**!

---

## 🔑 Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `GITHUB_TOKEN` | **Yes** | GitHub PAT with repo write permission | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | **Yes** | Your GitHub username | `divya8050` |
| `GITHUB_REPO` | **Yes** | Target JavaScript repository | `javascript` |
| `HTML_CSS_REPO` | Optional | Target HTML/CSS repository | `html-css` |
| `GIT_AUTHOR_NAME` | **Yes** | Author name on commits | `divya adsare` |
| `GIT_AUTHOR_EMAIL` | **Yes** | Your verified GitHub account email | `divyaadsare@gmail.com` |
| `CRON_SECRET` | Recommended | Secret token to secure `/api/cron` | `my_secret_token_123` |
| `MIN_COMMITS_PER_DAY`| Optional | Minimum practice commits per day | `2` |
| `MAX_COMMITS_PER_DAY`| Optional | Maximum practice commits per day | `8` |
| `GEMINI_API_KEY` | Optional | Google AI Studio key for dynamic problems | `AIzaSy...` |

---

## 💻 Local Development

```bash
# Clone the repository
git clone <repo-url>
cd git-agent

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 🛡️ License

MIT License &copy; 2026 GitStreak. Built for continuous software engineering practice.
