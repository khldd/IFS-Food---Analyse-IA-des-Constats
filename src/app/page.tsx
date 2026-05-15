'use client';

import { useState, useEffect } from 'react';
import AnalysisForm from '@/components/AnalysisForm';
import AnalysisResult from '@/components/AnalysisResult';
import HistoryPanel from '@/components/HistoryPanel';
import { createClient } from '@/lib/supabase';
import type { Analysis } from '@/types';

export default function Home() {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const supabase = createClient();
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });
      setHistory(data ?? []);
      setLoadingHistory(false);
    }
    fetchHistory();
  }, []);

  async function handleSubmit(constat: string, scope: string) {
    setLoading(true);
    setSelected(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constat, scope }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue');
      setSelected(data as Analysis);
      setHistory((prev) => [data as Analysis, ...prev]);
    } catch (err) {
      alert('Erreur : ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    const supabase = createClient();
    await supabase.from('analyses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setHistory([]);
    setSelected(null);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 leading-tight">IFS Food — Analyse IA des Constats</h1>
          <p className="text-xs text-gray-400">Analyse experte IFS Food v8 par Gemini</p>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          <AnalysisForm onSubmit={handleSubmit} loading={loading} />
          {selected && <AnalysisResult analysis={selected} />}
          {!selected && !loading && (
            <div className="flex flex-col items-center justify-center text-center py-20 text-gray-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm">Saisissez un constat pour lancer l&apos;analyse</p>
            </div>
          )}
        </main>

        <aside className="w-72 shrink-0 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          <HistoryPanel history={history} loading={loadingHistory} selected={selected} onSelect={setSelected} onClear={handleClear} />
        </aside>
      </div>
    </div>
  );
}
