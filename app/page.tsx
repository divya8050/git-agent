'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Clock,
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
  FolderGit2,
  Search,
  Star,
  User,
  Filter,
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

interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
  weekday: number;
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: {
    contributionDays: ContributionDay[];
  }[];
  todayCount: number;
  todayDate: string;
  currentStreak: number;
}

interface RepositorySummary {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  defaultBranch: string;
  updatedAt: string;
  isPrivate: boolean;
  starsCount?: number;
  forksCount?: number;
}

interface CommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  date: string;
  repo: string;
  htmlUrl: string;
}

interface SystemStatus {
  status: string;
  timestamp: string;
  dayNumber?: number;
  contributions?: ContributionCalendar | null;
  repositories?: RepositorySummary[];
  recentCommits?: CommitSummary[];
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

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins <= 0 ? 1 : diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getLanguageColor(lang: string | null): string {
  switch (lang?.toLowerCase()) {
    case 'javascript':
      return 'bg-amber-400';
    case 'typescript':
      return 'bg-sky-400';
    case 'html':
      return 'bg-orange-400';
    case 'css':
      return 'bg-blue-400';
    case 'python':
      return 'bg-emerald-400';
    default:
      return 'bg-slate-400';
  }
}

// Minimal Sanket status type used by the dashboard
interface SanketStatus {
  status: string;
  account: string;
  github: { checked: boolean; valid: boolean; error?: string; message?: string; user?: { login: string; name: string; avatar_url: string } };
  environment: { hasToken: boolean; hasOwner: boolean; hasRepo: boolean; owner: string | null; repo: string | null; authorName: string | null; configured: boolean };
  dayNumber?: number;
  todayTopic?: { title: string; category: string; difficulty: string; folder: string; slug: string };
}

export default function Dashboard() {
  const [statusData, setStatusData] = useState<SystemStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<PushResponse | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Sanket account — independent state, no shared state with Divya
  const [sanketStatus, setSanketStatus] = useState<SanketStatus | null>(null);
  const [loadingSanket, setLoadingSanket] = useState<boolean>(false);
  const [pushingSanket, setPushingSanket] = useState<boolean>(false);
  const [sanketPushResult, setSanketPushResult] = useState<PushResponse | null>(null);
  const [sanketPushError, setSanketPushError] = useState<string | null>(null);
  const [sanketCustomTopic, setSanketCustomTopic] = useState<string>('');

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'repos' | 'commits' | 'preview' | 'setup'>('dashboard');

  // Trigger options
  const [selectedTrack, setSelectedTrack] = useState<'both' | 'js' | 'html'>('both');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Commits Filter
  const [commitRepoFilter, setCommitRepoFilter] = useState<string>('all');
  const [commitSearchQuery, setCommitSearchQuery] = useState<string>('');

  // Preview options
  const [previewTrack, setPreviewTrack] = useState<'javascript' | 'htmlCss'>('javascript');
  const [previewFileKey, setPreviewFileKey] = useState<string>('01-core.js');

  // Heatmap hover tooltip state
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    isToday: boolean;
    x: number;
    y: number;
  } | null>(null);

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

  const fetchSanketStatus = async () => {
    setLoadingSanket(true);
    try {
      const res = await fetch('/api/status-sanket');
      if (res.ok) {
        const data = await res.json();
        setSanketStatus(data);
      }
    } catch (err) {
      console.error('Failed to load Sanket status:', err);
    } finally {
      setLoadingSanket(false);
    }
  };

  const handleSanketPush = async () => {
    setPushingSanket(true);
    setSanketPushResult(null);
    setSanketPushError(null);
    try {
      const res = await fetch('/api/push-sanket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customTopic: sanketCustomTopic.trim() || undefined, count: 2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSanketPushError(data.error || 'Sanket push failed.');
      } else {
        setSanketPushResult(data);
        fetchSanketStatus();
      }
    } catch (err: unknown) {
      setSanketPushError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setPushingSanket(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSanketStatus();
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
GIT_AUTHOR_NAME="divya adsare"
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

  const allRepositories = useMemo(() => statusData?.repositories || [], [statusData?.repositories]);
  const allCommits = useMemo(() => statusData?.recentCommits || [], [statusData?.recentCommits]);
  const calendar = statusData?.contributions;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayCount = calendar?.todayCount ?? 0;
  const totalContributions = calendar?.totalContributions ?? 0;
  const currentStreak = calendar?.currentStreak ?? 0;

  // Filter commits
  const filteredCommits = useMemo(() => {
    return allCommits.filter((c) => {
      const matchesRepo = commitRepoFilter === 'all' || c.repo.toLowerCase() === commitRepoFilter.toLowerCase();
      const matchesSearch =
        !commitSearchQuery ||
        c.message.toLowerCase().includes(commitSearchQuery.toLowerCase()) ||
        c.authorName.toLowerCase().includes(commitSearchQuery.toLowerCase()) ||
        c.shortSha.toLowerCase().includes(commitSearchQuery.toLowerCase());
      return matchesRepo && matchesSearch;
    });
  }, [allCommits, commitRepoFilter, commitSearchQuery]);

  // Weeks for contribution grid (last 52 weeks or fallback)
  const weeksToDisplay = useMemo(() => {
    if (calendar?.weeks && calendar.weeks.length > 0) {
      return calendar.weeks;
    }
    // Fallback dummy calendar
    const fallbackWeeks = [];
    const now = new Date();
    for (let w = 52; w >= 0; w--) {
      const days: ContributionDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now.getTime() - (w * 7 + (6 - d)) * 24 * 60 * 60 * 1000);
        const dStr = date.toISOString().split('T')[0];
        days.push({
          date: dStr,
          contributionCount: dStr === todayStr ? todayCount : 0,
          color: dStr === todayStr && todayCount > 0 ? '#26a641' : '#161b22',
          weekday: d,
        });
      }
      fallbackWeeks.push({ contributionDays: days });
    }
    return fallbackWeeks;
  }, [calendar, todayStr, todayCount]);

  // Color helper for squares
  const getCellColor = (count: number) => {
    if (count <= 0) return 'bg-[#161b22] border border-slate-800/80 hover:border-slate-600';
    if (count <= 2) return 'bg-[#0e4429] hover:bg-[#14532d]';
    if (count <= 5) return 'bg-[#006d32] hover:bg-[#166534]';
    if (count <= 9) return 'bg-[#26a641] hover:bg-[#22c55e]';
    return 'bg-[#39d353] hover:bg-[#4ade80]';
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
      {/* Fixed Floating Tooltip on Hovering Contribution Squares */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoveredDay.x, top: hoveredDay.y - 8 }}
        >
          <div className="bg-[#0d1322] border border-slate-700/90 text-slate-200 text-xs px-3 py-2 rounded-xl shadow-2xl backdrop-blur-xl whitespace-nowrap flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                hoveredDay.count > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            {hoveredDay.isToday ? (
              <div>
                <span className="font-bold text-emerald-400">
                  {hoveredDay.count} {hoveredDay.count === 1 ? 'commit' : 'commits'} today
                </span>
                <span className="text-slate-400 ml-1">({formatDisplayDate(hoveredDay.date)})</span>
              </div>
            ) : (
              <div>
                <span className="font-semibold text-white">
                  {hoveredDay.count > 0
                    ? `${hoveredDay.count} ${hoveredDay.count === 1 ? 'commit' : 'commits'}`
                    : 'No commits'}
                </span>
                <span className="text-slate-400 ml-1">on {formatDisplayDate(hoveredDay.date)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base">GitStreak</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline font-mono">
                @{owner}
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
                onClick={() => setActiveTab('repos')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                  activeTab === 'repos'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Repositories</span>
                {allRepositories.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-200">
                    {allRepositories.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('commits')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                  activeTab === 'commits'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Past Commits</span>
                {allCommits.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-200">
                    {allCommits.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today&apos;s Code
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
        {/* Streak Hero Banner with Interactive Heatmap */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0d1527] to-[#0a1320] p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Title & Stats Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <Flame className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>Daily Practice Tracker Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                GitHub Practice &amp; Study Activity
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl">
                Real-time contribution heatmap and past commit log across your practice repositories.
                Hover over any green square below to inspect today&apos;s and past daily commit counts.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm self-start md:self-auto">
              {/* Today's Commits Counter */}
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Today&apos;s Commits
                </span>
                <div className="text-emerald-400 font-extrabold text-xl flex items-center justify-center space-x-1">
                  <span>{todayCount}</span>
                </div>
                <span className="text-[11px] text-emerald-500 font-medium">
                  {todayCount > 0 ? 'Active Today' : 'Pending Push'}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800" />

              {/* Current Streak */}
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Streak
                </span>
                <div className="text-emerald-400 font-bold text-lg flex items-center justify-center space-x-1">
                  <Flame className="w-4 h-4 fill-emerald-400 inline mr-0.5" />
                  <span>{currentStreak} Days</span>
                </div>
                <span className="text-[11px] text-slate-500">Consecutive</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />

              {/* Total Contributions */}
              <div className="text-center px-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Total Year
                </span>
                <div className="text-white font-bold text-lg flex items-center justify-center space-x-1">
                  <span>{totalContributions}</span>
                </div>
                <span className="text-[11px] text-slate-500">Contributions</span>
              </div>
            </div>
          </div>

          {/* Interactive GitHub Contribution Matrix */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-200">Interactive Contribution Heatmap:</span>
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

              <div className="flex items-center space-x-3 text-[11px]">
                <span className="text-emerald-400 font-mono flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
                  Today: <strong>{todayCount} commits</strong>
                </span>
                <span className="text-slate-500 hidden sm:inline">Hover over any square for details</span>
              </div>
            </div>

            {/* Matrix Container */}
            <div className="overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div className="min-w-[780px]">
                {/* Heatmap Grid */}
                <div className="flex gap-[3.5px]">
                  {/* Day of Week Labels (Mon, Wed, Fri) */}
                  <div className="flex flex-col justify-between py-[1px] pr-2 text-[10px] text-slate-500 font-mono select-none">
                    <span className="h-3 leading-3">Sun</span>
                    <span className="h-3 leading-3 text-slate-400 font-semibold">Mon</span>
                    <span className="h-3 leading-3">Tue</span>
                    <span className="h-3 leading-3 text-slate-400 font-semibold">Wed</span>
                    <span className="h-3 leading-3">Thu</span>
                    <span className="h-3 leading-3 text-slate-400 font-semibold">Fri</span>
                    <span className="h-3 leading-3">Sat</span>
                  </div>

                  {/* Weeks Columns */}
                  {weeksToDisplay.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-[3.5px]">
                      {week.contributionDays.map((day) => {
                        const isToday = day.date === todayStr;
                        const cellColor = getCellColor(day.contributionCount);

                        return (
                          <div
                            key={day.date}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredDay({
                                date: day.date,
                                count: day.contributionCount,
                                isToday,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`w-3 h-3 rounded-[2.5px] cursor-pointer transition-all duration-150 ${cellColor} ${
                              isToday
                                ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                                : ''
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                  <div className="flex items-center space-x-2 font-mono text-[10px]">
                    <span className="text-slate-400 font-semibold">Today&apos;s Square:</span>
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/50 text-emerald-400">
                      <span className="w-2 h-2 rounded-[2px] bg-[#26a641] ring-1 ring-emerald-400 inline-block" />
                      <span>{todayCount} commits today</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#161b22] border border-slate-800" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0e4429]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#006d32]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#26a641]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#39d353]" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Main Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Repositories Quick Cards Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderGit2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">All Practice Repositories</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {allRepositories.length} repos
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('repos')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <span>View All Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allRepositories.map((repo) => (
                  <div
                    key={repo.name}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <h3 className="font-bold text-white text-base font-mono">{repo.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {repo.description || 'Personal coding and study repository.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)}`} />
                        <span>{repo.language || 'Code'}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatRelativeTime(repo.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Commits Feed Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GitCommit className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Recent Commits Across Repositories</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {allCommits.length} commits
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('commits')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <span>Browse Full Commit History</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-900/60 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                {allCommits.slice(0, 6).map((commit) => (
                  <div
                    key={commit.sha}
                    className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] font-semibold">
                          {commit.repo}
                        </span>
                        <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                          {commit.shortSha}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{commit.authorName}</span>
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white tracking-wide">
                        {commit.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 self-start sm:self-auto font-mono">
                      <span>{formatRelativeTime(commit.date)}</span>
                      <a
                        href={commit.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center space-x-1 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Trigger & Diagnostics Grid */}
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
                          Manually trigger commits to your practice repositories right now.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
                      /api/push
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

                      {pushResult.results && pushResult.results.length > 0 && (
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
                            </div>
                          ))}
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Diagnostics */}
              <div className="space-y-6">
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold text-white text-sm">Deployment &amp; Status</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Vercel Ready</span>
                  </div>

                  <div className="space-y-3 text-xs">
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

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-300 font-mono">TARGET_REPOS</span>
                      <span className="text-emerald-400 font-mono">{allRepositories.length} Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-300 font-mono">AUTHOR</span>
                      <span className="text-slate-200 font-mono">
                        {statusData?.github.user?.name || owner}
                      </span>
                    </div>
                  </div>

                  {statusData?.github.checked && statusData.github.valid && (
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Authenticated as @{statusData.github.user?.login}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white text-sm">Automated Schedule</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Runs daily exercises via Vercel Cron (<code className="text-emerald-400">vercel.json</code>).
                  </p>
                  <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-300 border border-slate-800">
                    Schedule: &quot;0 10 * * *&quot; (10:00 AM UTC Daily)
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sanket Account Panel ──────────────────────────────── */}
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-[#0f0d1a] to-slate-900 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white text-base">
                      Sanket&#39;s Account — System Design Track
                    </h2>
                    <p className="text-xs text-slate-400">
                      Independent second account · sanket8050/system-design
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchSanketStatus}
                  title="Refresh Sanket status"
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSanket ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Config status */}
              {sanketStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-mono">SANKET_TOKEN</span>
                    {sanketStatus.environment.hasToken ? (
                      <span className="flex items-center space-x-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /><span>Set</span></span>
                    ) : (
                      <span className="flex items-center space-x-1 text-rose-400"><AlertCircle className="w-3.5 h-3.5" /><span>Missing</span></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-mono">TARGET_REPO</span>
                    <span className="text-violet-300 font-mono">
                      {sanketStatus.environment.owner}/{sanketStatus.environment.repo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-mono">STATUS</span>
                    {sanketStatus.environment.configured ? (
                      <span className="text-emerald-400 font-mono">Active</span>
                    ) : (
                      <span className="text-amber-400 font-mono">Needs Setup</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono p-3 bg-slate-950 rounded-lg border border-slate-800">
                  Loading Sanket account status...
                </div>
              )}

              {/* Today&#39;s planned topic */}
              {sanketStatus?.todayTopic && (
                <div className="p-4 rounded-lg bg-slate-950/80 border border-violet-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-mono">
                      Today&#39;s Topic · Day #{sanketStatus.dayNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-mono">
                      {sanketStatus.todayTopic.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{sanketStatus.todayTopic.title}</h4>
                  <p className="text-xs text-slate-400">
                    Category: <code className="text-violet-300">{sanketStatus.todayTopic.category}</code>
                    {' · '}Folder: <code className="text-slate-300">{sanketStatus.todayTopic.folder}/{sanketStatus.todayTopic.slug}</code>
                  </p>
                </div>
              )}

              {/* Manual push for Sanket */}
              {sanketStatus?.environment.configured ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Custom Topic (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. consistent hashing, JWT refresh tokens"
                      value={sanketCustomTopic}
                      onChange={(e) => setSanketCustomTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <button
                      id="sanket-push-btn"
                      onClick={handleSanketPush}
                      disabled={pushingSanket}
                      className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {pushingSanket ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /><span>Pushing Sanket...</span></>
                      ) : (
                        <><GitCommit className="w-4 h-4" /><span>Push Sanket&#39;s Commits Now</span></>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      → <code className="text-violet-300">sanket8050/system-design</code> (protected endpoint)
                    </span>
                  </div>

                  {sanketPushError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                      <span>{sanketPushError}</span>
                    </div>
                  )}

                  {sanketPushResult && (
                    <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-violet-400" />
                        <span className="font-semibold text-white">Sanket push successful!</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-500/20 rounded">
                          {(sanketPushResult as unknown as { totalCommitsPushed: number }).totalCommitsPushed} commits
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <p className="font-semibold">Sanket&#39;s account is not yet configured.</p>
                  <p className="text-slate-400">Add <code className="text-amber-300">SANKET_GITHUB_TOKEN</code>, <code className="text-amber-300">SANKET_GITHUB_OWNER</code>, and <code className="text-amber-300">SANKET_GITHUB_REPO</code> to your Vercel environment variables to activate this account.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: All Repositories Detailed View */}
        {activeTab === 'repos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <FolderGit2 className="w-5 h-5 text-emerald-400" />
                  <span>All Repositories (@{owner})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  All active GitHub practice and project repositories linked to your account.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400">
                Total Repositories: {allRepositories.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRepositories.map((repo) => (
                <div
                  key={repo.name}
                  className="bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <FolderGit2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-base text-white font-mono">{repo.name}</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 min-h-[36px]">
                      {repo.description || 'Personal software engineering and study repository.'}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(repo.language)}`} />
                        <span>{repo.language || 'Code'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 text-slate-500" />
                        <span>{repo.starsCount || 0}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Updated {formatRelativeTime(repo.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCommitRepoFilter(repo.name);
                        setActiveTab('commits');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>View Commits</span>
                    </button>

                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Open on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: All Past Commits & Activity Feed */}
        {activeTab === 'commits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <GitCommit className="w-5 h-5 text-emerald-400" />
                  <span>All Past Commits &amp; Activity Log</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Full log of commit names, author attribution, and timestamps across all repositories.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by commit name or author..."
                    value={commitSearchQuery}
                    onChange={(e) => setCommitSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Repo Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 font-mono flex items-center space-x-1 mr-1">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              <button
                onClick={() => setCommitRepoFilter('all')}
                className={`px-3 py-1 rounded-lg font-mono transition-colors ${
                  commitRepoFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Repos ({allCommits.length})
              </button>
              {allRepositories.map((repo) => (
                <button
                  key={repo.name}
                  onClick={() => setCommitRepoFilter(repo.name)}
                  className={`px-3 py-1 rounded-lg font-mono transition-colors whitespace-nowrap ${
                    commitRepoFilter.toLowerCase() === repo.name.toLowerCase()
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {repo.name}
                </button>
              ))}
            </div>

            {/* Commits List */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-xl">
              {filteredCommits.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No commits match the selected filter.
                </div>
              ) : (
                filteredCommits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] font-semibold">
                          {commit.repo}
                        </span>
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {commit.shortSha}
                        </span>
                        <span className="text-xs text-slate-300 flex items-center space-x-1 font-mono">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{commit.authorName}</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white tracking-wide">
                        {commit.message}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 self-start md:self-auto font-mono">
                      <div className="text-right">
                        <p className="text-slate-300">{formatDisplayDate(commit.date.split('T')[0])}</p>
                        <p className="text-[11px] text-slate-500">{formatRelativeTime(commit.date)}</p>
                      </div>
                      <a
                        href={commit.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                      >
                        <span>View Commit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Code Preview (Real Code for Today) */}
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

        {/* Tab 5: Setup & Vercel Deployment Guide */}
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
                    You have active repositories configured on GitHub:{' '}
                    <a
                      href={`https://github.com/${owner}/${jsRepo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      {owner}/{jsRepo}
                    </a>{' '}
                    and{' '}
                    <a
                      href={`https://github.com/${owner}/${htmlCssRepo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      {owner}/{htmlCssRepo}
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
                      <p><span className="text-emerald-400">GITHUB_OWNER</span>={owner}</p>
                      <p><span className="text-emerald-400">GITHUB_REPO</span>={jsRepo}</p>
                      <p><span className="text-emerald-400">HTML_CSS_REPO</span>={htmlCssRepo}</p>
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
        <p>GitStreak &bull; Daily JavaScript &amp; HTML/CSS Practice Tracker</p>
      </footer>
    </div>
  );
}
