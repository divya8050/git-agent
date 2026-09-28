'use client';

import { useState, useEffect } from 'react';
import {
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Flame,
  BookOpen,
} from 'lucide-react';

interface PushResponse {
  success: boolean;
  topic?: string;
  filePath?: string;
  commitSha?: string;
  commitUrl?: string;
  difficulty?: string;
  error?: string;
}

interface SystemStatus {
  status: string;
  timestamp: string;
  environment: {
    hasToken: boolean;
    hasOwner: boolean;
    hasRepo: boolean;
    hasAuthorEmail: boolean;
    hasCronSecret: boolean;
    hasGeminiKey: boolean;
    owner: string | null;
    repo: string | null;
    authorEmail: string | null;
    preferredLang: string;
  };
  github: {
    checked: boolean;
    valid: boolean;
    error?: string;
    user?: {
      login: string;
      name: string;
      avatar_url: string;
    };
    repo?: {
      name: string;
      full_name: string;
      default_branch: string;
      private: boolean;
    };
  };
  todayPreview: {
    title: string;
    category: string;
    difficulty: string;
  };
}

export default function Dashboard() {
  const [statusData, setStatusData] = useState<SystemStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<PushResponse | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Trigger options
  const [selectedLang, setSelectedLang] = useState<'typescript' | 'python'>('typescript');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'preview'>('dashboard');

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleManualPush = async () => {
    setPushing(true);
    setPushResult(null);
    setPushError(null);

    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          customTopic: customTopic.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPushError(data.error || 'Failed to push code.');
      } else {
        setPushResult(data);
        fetchStatus();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPushError(msg || 'Network error executing push.');
    } finally {
      setPushing(false);
    }
  };

  const copyEnvSnippet = () => {
    const text = `GITHUB_TOKEN=ghp_yourTokenHere
GITHUB_OWNER=your-github-username
GITHUB_REPO=daily-code-practice
GIT_AUTHOR_NAME="Your Name"
GIT_AUTHOR_EMAIL="your-verified-github-email@example.com"
CRON_SECRET=super_secret_cron_key_99
PREFERRED_LANGUAGE=typescript`;
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GitCommit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white">GitStreak</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  Agent v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated Daily GitHub Push & Practice Bot</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Today&apos;s Code
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'setup'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Setup Guide
            </button>
            <button
              onClick={fetchStatus}
              title="Refresh connection status"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Streak Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0d1527] to-[#0a1320] p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <Flame className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>Never Break Your Daily Streak Again</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Daily GitHub Practice & Streak Automation
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl">
                Deployed serverless on Vercel. Pushes a clean software engineering problem solution,
                algorithm, or system design implementation every day to your GitHub repository with
                proper commit attribution.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm self-start md:self-auto">
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Schedule
                </span>
                <div className="text-emerald-400 font-bold text-lg flex items-center justify-center space-x-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  <span>10:00 UTC</span>
                </div>
                <span className="text-[11px] text-slate-500">Every 24 Hours</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Streak Mode
                </span>
                <div className="text-emerald-400 font-bold text-lg flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  <span>Active</span>
                </div>
                <span className="text-[11px] text-slate-500">Attributed to Author</span>
              </div>
            </div>
          </div>

          {/* Simulated 52-Week GitHub Contribution Matrix */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">GitHub Streak Matrix Visualization</span>
              <div className="flex items-center space-x-1 text-[11px]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-800 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 inline-block"></span>
                <span>More</span>
              </div>
            </div>
            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                {Array.from({ length: 364 }).map((_, i) => {
                  // Simulate an active green streak towards recent days
                  const isRecent = i > 250;
                  const intensity = isRecent
                    ? (i % 3 === 0 ? 'bg-emerald-400' : i % 2 === 0 ? 'bg-emerald-500' : 'bg-emerald-600')
                    : i % 4 === 0
                    ? 'bg-emerald-800'
                    : i % 7 === 0
                    ? 'bg-emerald-900'
                    : 'bg-slate-800/80';
                  return (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-[2px] ${intensity} transition-transform hover:scale-125 hover:ring-1 hover:ring-white/50 cursor-pointer`}
                      title={`Day ${i + 1}: Practice Commit Registered`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Main Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Manual Push & Today's Topic */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trigger Card */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-base">Trigger Daily Practice Push</h2>
                      <p className="text-xs text-slate-400">
                        Pushes immediately or test your credentials right now.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                    Endpoint: /api/push
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Programming Language
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLang('typescript')}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                          selectedLang === 'typescript'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        TypeScript (.ts)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLang('python')}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                          selectedLang === 'python'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        Python (.py)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Custom Topic (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Red-Black Tree, LRU Cache, Sliding Window"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleManualPush}
                    disabled={pushing}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {pushing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Pushing to GitHub...</span>
                      </>
                    ) : (
                      <>
                        <GitCommit className="w-4 h-4" />
                        <span>Push Code to GitHub Now</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Will commit to:{' '}
                    <code className="text-emerald-400">
                      {statusData?.environment.owner || 'owner'}/
                      {statusData?.environment.repo || 'repo'}
                    </code>
                  </span>
                </div>

                {/* Error Banner */}
                {pushError && (
                  <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                    <div>
                      <span className="font-semibold block mb-0.5">Commit Failed</span>
                      <p>{pushError}</p>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {pushResult && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold text-white">
                          Pushed Successfully to GitHub!
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 rounded">
                        {pushResult.difficulty}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                      <p>
                        <span className="text-slate-500">Topic:</span>{' '}
                        <span className="text-slate-200">{pushResult.topic}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">File:</span>{' '}
                        <span className="text-emerald-400">{pushResult.filePath}</span>
                      </p>
                      {pushResult.commitSha && (
                        <p>
                          <span className="text-slate-500">Commit SHA:</span>{' '}
                          <span className="text-slate-300">{pushResult.commitSha.slice(0, 7)}</span>
                        </p>
                      )}
                    </div>

                    {pushResult.commitUrl && (
                      <a
                        href={pushResult.commitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
                      >
                        <span>View Commit on GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Today's Curriculum Snapshot */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white text-sm">Today&apos;s Scheduled Problem</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Day #{Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))} of {new Date().getFullYear()}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">
                      {statusData?.todayPreview.title || 'Two Sum with Optimal Hash Map'}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {statusData?.todayPreview.difficulty || 'Easy'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Category:{' '}
                    <span className="text-slate-300">
                      {statusData?.todayPreview.category || 'Algorithms'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    The agent commits self-contained code with comprehensive type hints, edge case
                    handling, complexity analysis, and verification tests.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: System Diagnostics & Credentials */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white text-sm">Deployment & Env Status</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Vercel Serverless</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* GITHUB_TOKEN */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-300 font-mono">GITHUB_TOKEN</span>
                    {statusData?.environment.hasToken ? (
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Configured</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Missing</span>
                      </span>
                    )}
                  </div>

                  {/* GITHUB_OWNER & REPO */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-300 font-mono">TARGET_REPO</span>
                    {statusData?.environment.hasOwner && statusData?.environment.hasRepo ? (
                      <span className="text-slate-300 font-mono">
                        {statusData.environment.owner}/{statusData.environment.repo}
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Not Set</span>
                      </span>
                    )}
                  </div>

                  {/* GIT_AUTHOR_EMAIL (Streak Critical) */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono">GIT_AUTHOR_EMAIL</span>
                      {statusData?.environment.hasAuthorEmail ? (
                        <span className="flex items-center space-x-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Important</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Must match your verified GitHub email for commits to count towards your green streak.
                    </p>
                  </div>

                  {/* CRON_SECRET */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-300 font-mono">CRON_SECRET</span>
                    {statusData?.environment.hasCronSecret ? (
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Secured</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Optional</span>
                    )}
                  </div>

                  {/* GEMINI_API_KEY */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300 font-mono">AI Generator</span>
                    </div>
                    {statusData?.environment.hasGeminiKey ? (
                      <span className="text-emerald-400">Gemini 1.5</span>
                    ) : (
                      <span className="text-slate-400">Curriculum (Built-in)</span>
                    )}
                  </div>
                </div>

                {/* Connection verification info */}
                {statusData?.github.checked && (
                  <div className="pt-2 border-t border-slate-800">
                    {statusData.github.valid ? (
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Connected to @{statusData.github.user?.login}&apos;s repository!</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span>{statusData.github.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vercel Cron Card */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">Vercel Cron Automation</h3>
                </div>
                <p className="text-xs text-slate-400">
                  When deployed on Vercel, the cron runs daily according to{' '}
                  <code className="text-emerald-400">vercel.json</code>.
                </p>
                <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-300 border border-slate-800">
                  Schedule: &quot;0 10 * * *&quot; (10:00 AM UTC)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Code Preview */}
        {activeTab === 'preview' && (
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>Curriculum Code Preview</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real algorithmic solutions and system designs queued for your daily streak.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedLang('typescript')}
                  className={`px-3 py-1 text-xs rounded font-medium ${
                    selectedLang === 'typescript'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setSelectedLang('python')}
                  className={`px-3 py-1 text-xs rounded font-medium ${
                    selectedLang === 'python'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed">
              <div className="text-emerald-400 text-xs mb-2">
                {"// Sample Daily Practice File (Saved to daily-practice/YYYY/MM/...)"}
              </div>
              {selectedLang === 'typescript' ? (
                <code>{`/**
 * Problem: Two Sum with Optimal Hash Map
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

export function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }

  return null;
}

// Verification Tests
const result = twoSum([2, 7, 11, 15], 9);
console.assert(result && result[0] === 0 && result[1] === 1, 'Test passed!');`}</code>
              ) : (
                <code>{`"""
Problem: Two Sum with Optimal Hash Map
Time Complexity: O(n)
Space Complexity: O(n)
"""

from typing import List, Optional, Tuple

def two_sum(nums: List[int], target: int) -> Optional[Tuple[int, int]]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return (seen[complement], i)
        seen[num] = i
    return None

if __name__ == "__main__":
    result = two_sum([2, 7, 11, 15], 9)
    assert result == (0, 1), "Test passed"
    print("Verification passed successfully!")`}</code>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Setup & Vercel Deployment Guide */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">How to Deploy and Automate on Vercel</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Follow these 4 simple steps to have the agent push code every single day for free.
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Create a Practice Repository on GitHub</h3>
                  <p className="text-xs text-slate-400">
                    Go to GitHub and create a new repository (e.g.{' '}
                    <code className="text-emerald-400">daily-code-practice</code>). It can be either public or private.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Generate GitHub Personal Access Token (PAT)</h3>
                  <p className="text-xs text-slate-400">
                    Visit{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      github.com/settings/tokens
                    </a>{' '}
                    and generate a token with the <code className="text-emerald-400">repo</code> scope (or Fine-Grained token with &quot;Contents: Read and Write&quot;).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-amber-300">
                    CRITICAL: Get your verified GitHub Email for the Green Streak
                  </h3>
                  <p className="text-xs text-slate-400">
                    GitHub will ONLY count commits towards your green streak if the author email matches your GitHub account. Check{' '}
                    <a
                      href="https://github.com/settings/emails"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline"
                    >
                      github.com/settings/emails
                    </a>{' '}
                    and copy your primary or noreply email address.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div className="space-y-3 w-full">
                  <h3 className="text-sm font-semibold text-white">Deploy to Vercel & Add Environment Variables</h3>
                  <p className="text-xs text-slate-400">
                    Deploy this project to Vercel (via GitHub repo import or <code className="text-emerald-400">vercel deploy</code>).
                    In your Vercel Project Settings &gt; Environment Variables, add the following:
                  </p>

                  <div className="relative">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                      <p><span className="text-emerald-400">GITHUB_TOKEN</span>=ghp_yourPersonalAccessToken</p>
                      <p><span className="text-emerald-400">GITHUB_OWNER</span>=your-github-username</p>
                      <p><span className="text-emerald-400">GITHUB_REPO</span>=daily-code-practice</p>
                      <p><span className="text-emerald-400">GIT_AUTHOR_NAME</span>=&quot;Your Name&quot;</p>
                      <p><span className="text-amber-400">GIT_AUTHOR_EMAIL</span>=&quot;your-github-email@example.com&quot;</p>
                      <p><span className="text-slate-400">CRON_SECRET</span>=random_secret_string</p>
                      <p><span className="text-slate-400">PREFERRED_LANGUAGE</span>=typescript</p>
                    </div>

                    <button
                      onClick={copyEnvSnippet}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center space-x-1 transition-colors"
                    >
                      {copiedEnv ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Once deployed, Vercel will automatically run <code className="text-emerald-400">/api/cron</code> every day at 10:00 UTC, pushing daily practice solutions to your repo and keeping your streak green forever!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-500">
        <p>GitStreak Agent &bull; Fully Serverless on Vercel &bull; Never miss a daily commit</p>
      </footer>
    </div>
  );
}
