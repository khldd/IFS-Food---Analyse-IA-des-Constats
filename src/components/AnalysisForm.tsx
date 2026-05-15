'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (constat: string, scope: string) => Promise<void>;
  loading: boolean;
}

export default function AnalysisForm({ onSubmit, loading }: Props) {
  const [constat, setConstat] = useState('');
  const [scope, setScope] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!constat.trim()) return;
    await onSubmit(constat, scope);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Nouveau Constat</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Scope <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="ex: Production, Stockage, Hygiène du personnel…"
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          disabled={loading}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Constat <span className="text-red-500">*</span>
        </label>
        <textarea
          value={constat}
          onChange={(e) => setConstat(e.target.value)}
          placeholder="Décrivez le constat d'audit IFS Food v8 à analyser…"
          rows={5}
          required
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !constat.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analyse en cours…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyser avec Gemini
          </>
        )}
      </button>
    </form>
  );
}
