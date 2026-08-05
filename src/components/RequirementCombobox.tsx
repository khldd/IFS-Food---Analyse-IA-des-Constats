'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { IfsRequirement } from '@/types';

interface Props {
  value: string; // selected req_num, '' when none
  onChange: (reqNum: string, reqText: string) => void;
  disabled?: boolean;
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Natural sort so "1.2" < "1.10".
function compareReqNum(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export default function RequirementCombobox({ value, onChange, disabled }: Props) {
  const [requirements, setRequirements] = useState<IfsRequirement[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('ifs_requirements')
      .select('id, req_num, req_text, chapter, ko')
      .then(({ data, error }) => {
        if (error) {
          setLoadState('error');
          return;
        }
        const sorted = (data ?? []).sort((a, b) => compareReqNum(a.req_num, b.req_num));
        setRequirements(sorted as IfsRequirement[]);
        setLoadState('ready');
      });
  }, []);

  const selected = useMemo(
    () => requirements.find((r) => r.req_num === value) ?? null,
    [requirements, value]
  );

  const matches = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return requirements.slice(0, 60);
    return requirements
      .filter((r) => norm(r.req_num).includes(q) || norm(r.req_text).includes(q))
      .slice(0, 60);
  }, [requirements, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  function choose(r: IfsRequirement) {
    onChange(r.req_num, r.req_text);
    setEditing(false);
    setOpen(false);
    setQuery('');
  }

  function startEditing() {
    setEditing(true);
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && matches[highlight]) choose(matches[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  // ── Selected (collapsed) state ────────────────────────────────────────────
  if (selected && !editing) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
        <span className="mt-0.5 shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
          {selected.req_num}
        </span>
        {selected.ko && (
          <span className="mt-0.5 shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
            KO
          </span>
        )}
        <p className="line-clamp-2 flex-1 text-sm text-gray-700">{selected.req_text}</p>
        {!disabled && (
          <button
            type="button"
            onClick={startEditing}
            className="mt-0.5 shrink-0 text-xs font-medium text-gray-400 hover:text-gray-700"
          >
            Changer
          </button>
        )}
      </div>
    );
  }

  // ── Search state ──────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="ifs-req-list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        placeholder={
          loadState === 'loading'
            ? 'Chargement des exigences IFS…'
            : loadState === 'error'
            ? 'Erreur de chargement des exigences'
            : 'Rechercher par numéro (ex. 4.12) ou mot-clé…'
        }
        disabled={disabled || loadState !== 'ready'}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
      />

      {open && loadState === 'ready' && (
        <ul
          ref={listRef}
          id="ifs-req-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-xs text-gray-400">Aucune exigence trouvée</li>
          ) : (
            matches.map((r, i) => (
              <li key={r.id} role="option" aria-selected={i === highlight} data-active={i === highlight}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                    i === highlight ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
                    {r.req_num}
                  </span>
                  {r.ko && (
                    <span className="mt-0.5 shrink-0 rounded bg-red-50 px-1 py-0.5 text-[10px] font-semibold text-red-600">
                      KO
                    </span>
                  )}
                  <span className="line-clamp-2 flex-1 text-sm text-gray-700">{r.req_text}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
