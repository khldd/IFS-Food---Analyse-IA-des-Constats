'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnalysisForm from '@/components/AnalysisForm';
import AnalysisResult from '@/components/AnalysisResult';
import HistoryPanel from '@/components/HistoryPanel';
import { createClient } from '@/lib/supabase/client';
import type { Analysis } from '@/types';

export default function Home() {
  const router = useRouter();
  const [history, setHistory] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      // RLS scopes this to the signed-in user's own analyses.
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });
      setHistory(data ?? []);
      setLoadingHistory(false);
    }
    init();
  }, []);

  async function handleSubmit(
    observation: string,
    perimetre: string,
    req_text: string,
    req_num: string,
    tv_remarq: string,
    systemPrompt: string
  ) {
    setLoading(true);
    setSelected(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observation, perimetre, req_text, req_num, tv_remarq, systemPrompt }),
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
    // RLS restricts this delete to the current user's own rows.
    await supabase.from('analyses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setHistory([]);
    setSelected(null);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
          <h1 className="text-sm font-semibold text-gray-900 leading-tight">IFS Food — Arbitrage NC (D vs Majeure)</h1>
          <p className="text-xs text-gray-400">Analyse experte IFS Food v8 via Vertex AI</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {userEmail && <span className="hidden sm:inline text-xs text-gray-400">{userEmail}</span>}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-800"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
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
              <p className="text-sm">Saisissez une observation notée «D» pour lancer l&apos;arbitrage</p>
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
