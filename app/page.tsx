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
  Layers,
  FileCode,
} from 'lucide-react';

interface PushItemResult {
  track: string;
  repo: string;
  part: number;
  topic: string;
  filePath: string;
  commitSha?: string;
  commitUrl?: string;
  commitDate?: string;
}

interface PushResponse {
  success: boolean;
  message?: string;
  date?: string;
  totalCommits?: number;
  results?: PushItemResult[];
  topic?: string;
  filePath?: string;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}

interface TrackPreview {
  repo: string;
  stage: string;
  topic: string;
  category?: string;
  difficulty?: string;
  files: Record<string, string>;
}

interface SystemStatus {
  status: string;
  timestamp: string;
  dayNumber?: number;
  environment: {
    hasToken: boolean;
    hasOwner: boolean;
    hasRepo: boolean;
    hasAuthorEmail: boolean;
    hasCronSecret: boolean;
    hasGeminiKey: boolean;
    owner: string | null;
    repo: string | null;
    htmlCssRepo?: string | null;
    authorEmail: string | null;
    minCommits?: number;
    maxCommits?: number;
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
  tracks?: {
    javascript: TrackPreview;
    htmlCss: TrackPreview;
  };
}

export default function Dashboard() {
  const [statusData, setStatusData] = useState<SystemStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<PushResponse | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Trigger options
  const [selectedTrack, setSelectedTrack] = useState<'both' | 'js' | 'html'>('both');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'preview'>('dashboard');

  // Preview options
  const [previewTrack, setPreviewTrack] = useState<'javascript' | 'htmlCss'>('javascript');
  const [previewFileKey, setPreviewFileKey] = useState<string>('01-core.js');

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

  // Update preview file selection when switching tracks
  useEffect(() => {
    if (previewTrack === 'javascript') {
      setPreviewFileKey('01-core.js');
    } else {
      setPreviewFileKey('index.html');
    }
  }, [previewTrack]);

  const handleManualPush = async () => {
    setPushing(true);
    setPushResult(null);
    setPushError(null);

    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          customTopic: customTopic.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.results)) {
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
GITHUB_OWNER=divya8050
GITHUB_REPO=javascript
HTML_CSS_REPO=html-css
GIT_AUTHOR_NAME="Divya"
GIT_AUTHOR_EMAIL="your-verified-github-email@example.com"
CRON_SECRET=super_secret_cron_key_99
MIN_COMMITS_PER_DAY=2
MAX_COMMITS_PER_DAY=8`;
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const copyActiveCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const owner = statusData?.environment.owner || 'divya8050';
  const jsRepo = statusData?.environment.repo || 'javascript';
  const htmlCssRepo = statusData?.environment.htmlCssRepo || 'html-css';
  const currentDay = statusData?.dayNumber || 1;

  const currentTrackData = statusData?.tracks?.[previewTrack];
  const currentFileContent = currentTrackData?.files?.[previewFileKey] || '// Code loading...';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base">GitStreak</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                Dual Track &bull; {owner}/{jsRepo} &amp; {owner}/{htmlCssRepo}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today&apos;s Real Code
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'setup'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vercel Setup
              </button>
            </div>

            <button
              onClick={fetchStatus}
              title="Refresh status"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 transition-colors border border-slate-700"
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
                <span>180-Day Dual Learning Streak Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Daily Code Practice &amp; Study Tracker
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl">
                Parallel learning across JavaScript and HTML5/CSS with randomized schedules (2 to 8 commits/day)
                spaced realistically throughout daytime and evening sessions.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm self-start md:self-auto">
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Curriculum Day
                </span>
                <div className="text-emerald-400 font-bold text-lg flex items-center justify-center space-x-1">
                  <span>Day {currentDay}</span>
                </div>
                <span className="text-[11px] text-slate-500">of 180 Days</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Daily Volume
                </span>
                <div className="text-emerald-400 font-bold text-lg flex items-center justify-center space-x-1">
                  <span>2 &ndash; 8</span>
                </div>
                <span className="text-[11px] text-slate-500">Commits / Day</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Cron Times
                </span>
                <div className="text-emerald-400 font-bold text-lg flex items-center justify-center space-x-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  <span>Random</span>
                </div>
                <span className="text-[11px] text-slate-500">Day &amp; Evening</span>
              </div>
            </div>
          </div>

          {/* Real GitHub Contribution Matrix Embed */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-300">Live GitHub Streak:</span>
                <a
                  href={`https://github.com/${owner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                >
                  <span>github.com/{owner}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <span className="text-[11px] text-slate-500">Updated in real-time from GitHub</span>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-center min-h-[110px]">
              {/* Live GitHub contribution graph from rshah.org */}
              <a href={`https://github.com/${owner}`} target="_blank" rel="noreferrer" className="block max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://ghchart.rshah.org/22c55e/${owner}`}
                  alt={`${owner}'s GitHub Contributions`}
                  className="max-w-full h-auto filter contrast-125"
                  onError={(e) => {
                    // Fallback to text link if image server is unreachable
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </a>
            </div>
          </div>
        </div>

        {/* Tab 1: Main Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Manual Push & Today's Curriculum Snapshot */}
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
                        Manually trigger commits right now to verify credentials or push today&apos;s pack.
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
                      Target Learning Track
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTrack('both')}
                        className={`px-2 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                          selectedTrack === 'both'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        Both Tracks
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTrack('js')}
                        className={`px-2 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                          selectedTrack === 'js'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        JavaScript
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTrack('html')}
                        className={`px-2 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                          selectedTrack === 'html'
                            ? 'bg-sky-600/20 border-sky-500 text-sky-400 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        HTML &amp; CSS
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Custom Topic (Optional Override)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Promises, Flexbox, Closures"
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
                        <span>Push Practice Commits Now</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Pushing to:{' '}
                    <code className="text-emerald-400">
                      {selectedTrack === 'both'
                        ? `${owner}/${jsRepo} & ${owner}/${htmlCssRepo}`
                        : selectedTrack === 'js'
                        ? `${owner}/${jsRepo}`
                        : `${owner}/${htmlCssRepo}`}
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
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold text-white">
                          Pushed Successfully to GitHub!
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 rounded">
                        {pushResult.totalCommits || (pushResult.results ? pushResult.results.length : 1)} Commits
                      </span>
                    </div>

                    {pushResult.results && pushResult.results.length > 0 ? (
                      <div className="space-y-2">
                        {pushResult.results.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">
                                [{item.track.toUpperCase()}] {owner}/{item.repo}
                              </span>
                              {item.commitUrl && (
                                <a
                                  href={item.commitUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                                >
                                  <span>View Commit</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-slate-300">{item.filePath}</p>
                            {item.commitSha && (
                              <p className="text-slate-500 text-[10px]">
                                SHA: {item.commitSha.slice(0, 7)} &bull; {item.commitDate}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                        <p>
                          <span className="text-slate-500">Topic:</span>{' '}
                          <span className="text-slate-200">{pushResult.topic}</span>
                        </p>
                        <p>
                          <span className="text-slate-500">File:</span>{' '}
                          <span className="text-emerald-400">{pushResult.filePath}</span>
                        </p>
                        {pushResult.commitUrl && (
                          <a
                            href={pushResult.commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline mt-1"
                          >
                            <span>View Commit on GitHub</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Today's Dual Curriculum Snapshot */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white text-sm">Today&apos;s Dual Curriculum Snapshot</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Day #{currentDay} of 180
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* JS Card */}
                  <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                        Track 1: JavaScript
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        {statusData?.tracks?.javascript?.difficulty || 'Beginner'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {statusData?.tracks?.javascript?.topic || 'Execution Context and Scope'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Repo: <code className="text-slate-300">{owner}/{jsRepo}</code>
                    </p>
                    <p className="text-xs text-slate-500">
                      Files: <code className="text-slate-400">01-core.js</code>, <code className="text-slate-400">02-practical.js</code>, <code className="text-slate-400">03-tests.js</code>
                    </p>
                  </div>

                  {/* HTML/CSS Card */}
                  <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 font-mono">
                        Track 2: HTML5 &amp; CSS
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                        Foundations
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {statusData?.tracks?.htmlCss?.topic || 'Semantic HTML5 Document Structure'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Repo: <code className="text-slate-300">{owner}/{htmlCssRepo}</code>
                    </p>
                    <p className="text-xs text-slate-500">
                      Files: <code className="text-slate-400">index.html</code>, <code className="text-slate-400">styles.css</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: System Diagnostics & Credentials */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white text-sm">Deployment &amp; Env Status</h3>
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

                  {/* JavaScript Repo */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-300 font-mono">JS_REPO</span>
                    <span className="text-amber-400 font-mono">
                      {owner}/{jsRepo}
                    </span>
                  </div>

                  {/* HTML/CSS Repo */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-300 font-mono">HTML_CSS_REPO</span>
                    <span className="text-sky-400 font-mono">
                      {owner}/{htmlCssRepo}
                    </span>
                  </div>

                  {/* GIT_AUTHOR_EMAIL */}
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
                      Attribution verified for your personal GitHub account.
                    </p>
                  </div>

                  {/* Schedule & Commits */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-300 font-mono">DAILY_COMMITS</span>
                    <span className="text-emerald-400 font-mono">
                      {statusData?.environment.minCommits || 2} to {statusData?.environment.maxCommits || 8} (Randomized)
                    </span>
                  </div>

                  {/* AI Generator */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300 font-mono">AI Generator</span>
                    </div>
                    {statusData?.environment.hasGeminiKey ? (
                      <span className="text-emerald-400">Gemini 2.5 Flash</span>
                    ) : (
                      <span className="text-slate-400">180-Day Built-in Roadmap</span>
                    )}
                  </div>
                </div>

                {/* Connection verification info */}
                {statusData?.github.checked && (
                  <div className="pt-2 border-t border-slate-800">
                    {statusData.github.valid ? (
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Connected to @{statusData.github.user?.login}&apos;s GitHub account!</span>
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
                  Schedule: &quot;0 10 * * *&quot; (10:00 AM UTC Daily)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Code Preview (Real Code for Today) */}
        {activeTab === 'preview' && (
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>Today&apos;s Real Practice Code (Day #{currentDay})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real code generated for your dual tracks with natural 1-line comments.
                </p>
              </div>

              {/* Track Selector */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewTrack('javascript')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
                    previewTrack === 'javascript'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>JavaScript ({owner}/{jsRepo})</span>
                </button>
                <button
                  onClick={() => setPreviewTrack('htmlCss')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
                    previewTrack === 'htmlCss'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>HTML &amp; CSS ({owner}/{htmlCssRepo})</span>
                </button>
              </div>
            </div>

            {/* Sub-Header & File Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-emerald-400">
                  {currentTrackData?.stage}
                </span>
                <h3 className="text-sm font-bold text-white">
                  {currentTrackData?.topic}
                </h3>
              </div>

              {/* File switcher buttons */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {currentTrackData?.files &&
                  Object.keys(currentTrackData.files).map((fileName) => (
                    <button
                      key={fileName}
                      onClick={() => setPreviewFileKey(fileName)}
                      className={`px-2.5 py-1 text-xs rounded font-mono flex items-center space-x-1 transition-colors ${
                        previewFileKey === fileName
                          ? 'bg-slate-800 text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3 h-3" />
                      <span>{fileName}</span>
                    </button>
                  ))}

                <button
                  onClick={() => copyActiveCode(currentFileContent)}
                  title="Copy code to clipboard"
                  className="px-2 py-1 text-xs rounded bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center space-x-1 ml-2 transition-colors border border-slate-700/60"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed shadow-inner">
              <pre className="font-mono">
                <code>{currentFileContent}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Setup & Vercel Deployment Guide */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">How to Deploy to Vercel</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Follow these 4 simple steps to run your daily practice companion on Vercel.
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Practice Repositories on GitHub</h3>
                  <p className="text-xs text-slate-400">
                    You already have both repositories configured on GitHub:{' '}
                    <a
                      href="https://github.com/divya8050/javascript"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      divya8050/javascript
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://github.com/divya8050/html-css"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      divya8050/html-css
                    </a>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">GitHub Personal Access Token (PAT)</h3>
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
                    and generate a classic token with the <code className="text-emerald-400">repo</code> scope.
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
                    Verified GitHub Email Attribution
                  </h3>
                  <p className="text-xs text-slate-400">
                    GitHub attributes commits to your developer profile when the author email matches your registered GitHub account. Check{' '}
                    <a
                      href="https://github.com/settings/emails"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline"
                    >
                      github.com/settings/emails
                    </a>{' '}
                    and copy your primary email address into <code className="text-amber-400">GIT_AUTHOR_EMAIL</code>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div className="space-y-3 w-full">
                  <h3 className="text-sm font-semibold text-white">Deploy to Vercel &amp; Add Environment Variables</h3>
                  <p className="text-xs text-slate-400">
                    Deploy this project to Vercel.
                    In your Vercel Project Settings &gt; Environment Variables, paste the following:
                  </p>

                  <div className="relative">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                      <p><span className="text-emerald-400">GITHUB_TOKEN</span>=ghp_yourPersonalAccessToken</p>
                      <p><span className="text-emerald-400">GITHUB_OWNER</span>=divya8050</p>
                      <p><span className="text-emerald-400">GITHUB_REPO</span>=javascript</p>
                      <p><span className="text-emerald-400">HTML_CSS_REPO</span>=html-css</p>
                      <p><span className="text-emerald-400">GIT_AUTHOR_NAME</span>=&quot;divya adsare&quot;</p>
                      <p><span className="text-amber-400">GIT_AUTHOR_EMAIL</span>=&quot;your-verified-github-email@example.com&quot;</p>
                      <p><span className="text-slate-400">CRON_SECRET</span>=super_secret_cron_key_99</p>
                      <p><span className="text-slate-400">MIN_COMMITS_PER_DAY</span>=2</p>
                      <p><span className="text-slate-400">MAX_COMMITS_PER_DAY</span>=8</p>
                      <p><span className="text-slate-400">GEMINI_API_KEY</span>=your_gemini_api_key</p>
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
                    Once deployed, Vercel will trigger the daily cron schedule in <code className="text-emerald-400">vercel.json</code>, maintaining your daily learning exercises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-500">
        <p>GitStreak &bull; Dual Track JavaScript &amp; HTML/CSS Practice Tracker</p>
      </footer>
    </div>
  );
}
