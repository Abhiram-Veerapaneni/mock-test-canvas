import React, { useState, useEffect } from 'react';
import { Filter, X, Check, BookOpen, Tag, RotateCcw } from 'lucide-react';
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
    <aside className="w-full lg:w-64 shrink-0 space-y-5">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                {activeFilterCount}
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Stream Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Subject Stream</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <label
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                !selectedStream || selectedStream === 'ALL'
                  ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stream-filter"
                  checked={!selectedStream || selectedStream === 'ALL'}
                  onChange={() => onSelectStream('ALL')}
                  className="w-3.5 h-3.5 text-zinc-900 border-zinc-300 focus:ring-0 cursor-pointer"
                />
                <span>All Streams</span>
              </div>
            </label>

            {isLoadingStreams ? (
              <div className="py-2 text-center text-xs text-zinc-400">Loading streams...</div>
            ) : (
              streams.map((st) => {
                const isSelected = selectedStream?.toLowerCase() === st.toLowerCase();
                return (
                  <label
                    key={st}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="stream-filter"
                        checked={isSelected}
                        onChange={() => onSelectStream(st)}
                        className="w-3.5 h-3.5 text-zinc-900 border-zinc-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{st}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Topic Tags Selector */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Topic Tags</span>
            </div>
            {selectedTags.length > 0 && (
              <span className="text-[10px] text-zinc-500 font-medium">
                {selectedTags.length} selected
              </span>
            )}
          </div>

          {tags.length > 5 && (
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
            />
          )}

          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {isLoadingTags ? (
              <div className="py-2 text-center text-xs text-zinc-400">Loading tags...</div>
            ) : filteredTags.length === 0 ? (
              <div className="py-3 text-center text-xs text-zinc-400">
                {tagSearch ? 'No matching tags' : 'No tags available'}
              </div>
            ) : (
              filteredTags.map((t) => {
                const isChecked = selectedTags.includes(t);
                return (
                  <label
                    key={t}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleTag(t)}
                        className="w-3.5 h-3.5 rounded text-zinc-900 border-zinc-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{t}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
