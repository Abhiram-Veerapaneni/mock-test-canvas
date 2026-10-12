import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import {
  Database,
  BarChart3,
  Layers,
  Activity,
  Sparkles,
  ArrowRight,
  Construction,
  Clock,
  CheckCircle2,
  BellRing,
  Cpu,
  ChevronRight
} from 'lucide-react';

const FEATURE_CONFIGS = {
  '/question-bank': {
    title: 'Centralized Question Bank',
    tag: 'Feature Under Active Development',
    badge: 'Roadmap Milestone',
    icon: Database,
    accentColor: 'blue',
    description:
      'Curate, organize, and reuse thousands of LaTeX & diagram-rich questions across JEE, NEET, and GATE test series with automated versioning.',
    highlights: [
      {
        title: 'Multi-Subject Taxonomy',
        desc: 'Organize items by Subject, Chapter, Topic, and Sub-topic with granular difficulty tagging.'
      },
      {
        title: 'Instant KaTeX & Media Reusability',
        desc: 'Pull pre-verified formulas and high-resolution diagrams directly into new question papers.'
      },
      {
        title: 'AI Similarity & Deduplication',
        desc: 'Automated vector similarity checks to detect redundant questions across your institutional vault.'
      }
    ]
  },
  '/analytics': {
    title: 'Advanced Candidate & Test Analytics',
    tag: 'Feature Under Active Development',
    badge: 'Engine Integration',
    icon: BarChart3,
    accentColor: 'indigo',
    description:
      'Deep pedagogical insights, Item Response Theory (IRT) difficulty discrimination curves, cohort performance distributions, and time-per-question telemetry.',
    highlights: [
      {
        title: 'Item Discrimination & Difficulty Index',
        desc: 'Determine whether individual questions effectively separate top percentile candidates from low scorers.'
      },
      {
        title: 'Time & Heatmap Telemetry',
        desc: 'Understand exactly where candidates spent excessive time or experienced high drop-off.'
      },
      {
        title: 'Exportable Institutional Reports',
        desc: 'Generate branded PDF and CSV performance audits for educators, tutors, and candidates.'
      }
    ]
  },
  '/assessments-overview': {
    title: 'Assessments Portfolio Overview',
    tag: 'Feature Under Active Development',
    badge: 'Coming Soon',
    icon: Layers,
    accentColor: 'sky',
    description:
      'A bird’s-eye administrative cockpit to monitor multi-batch test schedules, cohort enrollment limits, exam expiration windows, and active participation rates.',
    highlights: [
      {
        title: 'Multi-Batch Schedule Tracker',
        desc: 'Live countdown to opening and closing windows across all simultaneous institutional exam series.'
      },
      {
        title: 'Seat Allocation & Capacity Rules',
        desc: 'Fine-grained quotas for concurrent candidate sessions and proctored streaming capacity.'
      },
      {
        title: 'Historical Lifecycle Logs',
        desc: 'Full audit history of drafts, published tests, retake allowances, and archived papers.'
      }
    ]
  },
  '/telemetry': {
    title: 'Real-time Session Telemetry & Hardware Logs',
    tag: 'Feature Under Active Development',
    badge: 'Proctor Core v2',
    icon: Activity,
    accentColor: 'violet',
    description:
      'Aggregated streaming client diagnostics, WebAssembly frame processing latencies, WebRTC connection health, and audio/video packet stability across candidate feeds.',
    highlights: [
      {
        title: 'WebAssembly & WebGL Performance',
        desc: 'Real-time FPS and face-mesh inference metrics on low-end candidate laptops.'
      },
      {
        title: 'Network Packet Jitter Monitoring',
        desc: 'Proactive detection of unstable candidate connectivity before video degradation occurs.'
      },
      {
        title: 'Acoustic Baseline Logs',
        desc: 'Decibel threshold frequency analysis for accurate ambient noise filtering.'
      }
    ]
  }
};

export default function UnderDevelopmentPage({ featureKey }) {
  const location = useLocation();
  const path = featureKey || location.pathname;
  const config =
    FEATURE_CONFIGS[path] || {
      title: 'Module Under Development',
      tag: 'Coming Soon',
      badge: 'In Development',
      icon: Construction,
      accentColor: 'blue',
      description: 'This assessment platform module is currently being built and tested for production release.',
      highlights: [
        {
          title: 'High-Precision Architecture',
          desc: 'Engineered for competitive examination reliability and instant scalability.'
        },
        {
          title: 'Full Theme & Accessibility Parity',
          desc: 'Tested for light and dark environments with keyboard ergonomics.'
        }
      ]
    };

  const Icon = config.icon;
  const [notified, setNotified] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: config.title }]} />

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Construction className="w-3.5 h-3.5" />
                <span>{config.tag}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                <Sparkles className="w-3 h-3" />
                <span>{config.badge}</span>
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <Icon className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {config.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Notification Subscription & Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setNotified(true)}
                disabled={notified}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  notified
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'btn-primary'
                }`}
              >
                {notified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Notification Request Logged</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>Notify Me on Module Release</span>
                  </>
                )}
              </button>

              <Link
                to="/dashboard"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#1f2937] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Planned Capabilities in this Module
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-mono">
                    {idx + 1}
                  </span>
                  <span>{h.title}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Available Capabilities Banner */}
        <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-[#111827]/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Ready to test the live examination features right now?</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can immediately compose KaTeX papers with AI ingestion or run candidate proctored sessions.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/create-test"
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <span>Open Authoring Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
