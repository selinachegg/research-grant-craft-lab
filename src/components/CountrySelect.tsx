'use client';

/**
 * CountrySelect — Searchable single-select country picker with flag emojis.
 *
 * Usage:
 *   <CountrySelect value={partner.country} onChange={(code) => update(code)} />
 *
 * Selected country shows as a chip with flag + name + clear button.
 * Dropdown has a search input and lists countries in the fixed order from countries.ts.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { countries, getFlagEmoji, getCountryName } from '@/lib/countries';

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select country…',
  id,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const selected = countries.find((c) => c.code === value);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    setFocusedIdx(-1);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [close]);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
    else setSearch('');
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault();
      onChange(filtered[focusedIdx].code);
      close();
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="field-input flex items-center justify-between gap-2 cursor-pointer text-left"
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none shrink-0">{getFlagEmoji(selected.code)}</span>
            <span className="text-slate-900 dark:text-slate-100 truncate">{selected.name}</span>
            <span className="text-slate-400 text-xs shrink-0">({selected.code})</span>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
        <ChevronIcon
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900
                     border border-slate-200 dark:border-slate-700 rounded-2xl
                     shadow-dropdown overflow-hidden animate-slide-down"
        >
          {/* Search */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setFocusedIdx(-1); }}
                placeholder="Search countries…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl
                           bg-slate-50 dark:bg-slate-800
                           border border-slate-200 dark:border-slate-700
                           text-slate-900 dark:text-slate-100
                           placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={(e) => e.stopPropagation()}
                aria-label="Search countries"
              />
            </div>
          </div>

          {/* List */}
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Countries"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.map((c, idx) => {
              const isSelected = value === c.code;
              const isFocused = focusedIdx === idx;
              return (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { onChange(c.code); close(); }}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={`flex items-center gap-3 px-3.5 py-2 text-sm cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-medium'
                      : isFocused
                      ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg leading-none w-6 text-center shrink-0">
                    {getFlagEmoji(c.code)}
                  </span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                    {c.code}
                  </span>
                  {isSelected && (
                    <CheckIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-sm text-slate-400 text-center">
                No countries match "{search}"
              </li>
            )}
          </ul>

          {/* Clear */}
          {value && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-2">
              <button
                type="button"
                onClick={() => { onChange(''); close(); }}
                className="w-full text-xs text-slate-500 hover:text-red-500 py-1.5 rounded-lg
                           hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chip (shown below the trigger when a country is selected — for visibility) */}
      {selected && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                       bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300
                       border border-brand-200 dark:border-brand-800"
          >
            <span>{getFlagEmoji(selected.code)}</span>
            <span>{selected.name}</span>
            <button
              type="button"
              aria-label={`Remove ${selected.name}`}
              onClick={() => onChange('')}
              className="ml-0.5 hover:text-red-500 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────

function ChevronIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Standalone flag + country chip (for display-only use). */
export function CountryChip({ code }: { code: string }) {
  const name = getCountryName(code);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                     bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
      <span>{getFlagEmoji(code)}</span>
      <span>{name}</span>
    </span>
  );
}
