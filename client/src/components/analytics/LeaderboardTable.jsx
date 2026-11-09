import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/useAuthStore';

export default function LeaderboardTable() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [totalRanked, setTotalRanked] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/analytics/leaderboard');
        if (res.data?.success) {
          setLeaderboard(res.data.leaderboard || []);
          setUserRank(res.data.userRank || null);
          setTotalRanked(res.data.totalRankedCandidates || 0);
        } else {
          throw new Error(res.data?.message || 'Could not load leaderboard.');
        }
      } catch (err) {
        console.error('Leaderboard error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch leaderboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-800 shadow-2xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 shadow-2xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-500 font-bold text-xs border border-amber-300/60 dark:border-amber-800/60 shadow-2xs">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
        {rank}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-3" />
        <p className="text-xs text-slate-400">Compiling official leaderboard rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Disclaimer / Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Global Official Standings
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Official attempts only · Practice tests excluded
          </span>
          <span className="text-[11px] text-slate-400">
            {totalRanked} Ranked candidates
          </span>
        </div>
      </div>

      {/* User's Current Rank Card (if authenticated and has rank) */}
      {userRank && (
        <div className="p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">
              #{userRank.rank}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Your Official Ranking</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium">
                  Active Candidate
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated across {userRank.attemptsCount} official submission(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Avg Score</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{userRank.avgScore}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Best</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{userRank.bestScore}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Accuracy</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{userRank.avgAccuracy}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No official test submissions recorded yet. Be the first to appear on the leaderboard!
        </div>
      ) : (
        <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4 text-center">Tests</th>
                  <th className="py-3 px-4 text-right">Avg Score</th>
                  <th className="py-3 px-4 text-right">Best Score</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {leaderboard.map((item) => {
                  const isCurrentCandidate = user && item.userId === user._id;

                  return (
                    <tr
                      key={item.userId}
                      className={`transition-colors ${
                        isCurrentCandidate
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-medium'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {getRankBadge(item.rank)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold">
                              {item.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[160px] sm:max-w-xs">
                            {item.name} {isCurrentCandidate && <span className="text-[10px] text-indigo-600 dark:text-indigo-400">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                        {item.attemptsCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {item.avgScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {item.bestScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {item.avgAccuracy}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

