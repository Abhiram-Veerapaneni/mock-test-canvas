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
  const [notified, setNotified] = React.useState(false);  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: config.title }]} />

        {/* Hero Card */}
        <div className="rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none p-6 sm:p-8 space-y-6 shadow-none">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{config.tag}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {config.badge}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {config.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
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
                className={notified ? 'btn-secondary text-xs py-2 px-3.5 text-emerald-600 dark:text-emerald-400' : 'btn-primary text-xs py-2 px-3.5'}
              >
                {notified ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Notification Request Logged</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Notify Me on Release</span>
                  </span>
                )}
              </button>

              <Link
                to="/dashboard"
                className="btn-secondary text-xs py-2 px-3.5"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Planned Capabilities in this Module
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none space-y-2 shadow-none"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                  <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  <span>{h.title}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Available Capabilities Banner */}
        <div className="p-5 rounded-lg bg-slate-50/70 dark:bg-[#131926]/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Ready to test the live examination features right now?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can immediately compose KaTeX papers with AI ingestion or run candidate proctored sessions.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/create-test"
              className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
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
