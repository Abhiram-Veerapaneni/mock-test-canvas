import React, { useState, useEffect } from 'react';
import { Filter, X, Check, BookOpen, Tag, RotateCcw, Search } from 'lucide-react';
import api from '../../services/api';

export default function QuestionBankSidebar({
  selectedStream,
  onSelectStream,
  selectedTags,
  onToggleTag,
  onClearFilters
}) {
  const [streams, setStreams] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  // Fetch distinct streams once on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingStreams(true);
    api.get('/questions/meta/streams')
      .then((res) => {
        if (isMounted && res.data?.success) {
          setStreams(res.data.streams || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching question bank streams:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStreams(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch distinct tags whenever stream changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingTags(true);
    const params = selectedStream && selectedStream !== 'ALL' ? { stream: selectedStream } : {};
    api.get('/questions/meta/tags', { params })
      .then((res) => {
        if (isMounted && res.data?.success) {
          setTags(res.data.tags || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching question bank tags:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTags(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStream]);

  const activeFilterCount = (selectedStream && selectedStream !== 'ALL' ? 1 : 0) + selectedTags.length;

  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase().trim())
  );

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4 font-sans">
      <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-4 shadow-sm space-y-4">
        {/* Header with Active Badge & Reset Action */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">
                {activeFilterCount}
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Subject Stream Navigation List (No ugly browser radios) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Subject Stream</span>
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSelectStream('ALL')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                !selectedStream || selectedStream === 'ALL'
                  ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#162030] hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>All Streams</span>
              {(!selectedStream || selectedStream === 'ALL') && (
                <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              )}
            </button>

            {isLoadingStreams ? (
              <div className="py-2.5 text-center text-xs text-slate-400">Loading streams...</div>
            ) : (
              streams.map((st) => {
                const isSelected = selectedStream?.toLowerCase() === st.toLowerCase();
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onSelectStream(st)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#162030] hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Topic Tags Chips & Filter Pool (No ugly browser checkboxes) */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Topic Tags</span>
            </div>
            {selectedTags.length > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                {selectedTags.length} active
              </span>
            )}
          </div>

          {/* Slim Search Input */}
          {tags.length > 5 && (
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Filter topics..."
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
          )}

          {/* Tag Interactive Chips */}
          <div className="max-h-56 overflow-y-auto pr-1">
            {isLoadingTags ? (
              <div className="py-2.5 text-center text-xs text-slate-400">Loading tags...</div>
            ) : filteredTags.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                {tagSearch ? 'No matching topics' : 'No topics available'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {filteredTags.map((t) => {
                  const isChecked = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onToggleTag(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium inline-flex items-center gap-1.5 select-none ${
                        isChecked
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{t}</span>
                      {isChecked && <X className="w-2.5 h-2.5 opacity-70 hover:opacity-100" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
