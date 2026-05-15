'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Analysis } from '@/types';

interface Props {
  analysis: Analysis;
}

const CRITICITE_STYLES: Record<string, { badge: string; bar: string; border: string }> = {
  Critique: { badge: 'bg-red-100 text-red-800 border-red-200',    bar: 'bg-red-500',    border: 'border-l-red-500' },
  Majeure:  { badge: 'bg-orange-100 text-orange-800 border-orange-200', bar: 'bg-orange-500', border: 'border-l-orange-500' },
  Mineure:  { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', bar: 'bg-yellow-400', border: 'border-l-yellow-400' },
};

function MarkdownSection({ title, icon, content }: { title: string; icon: string; content: string | null }) {
  if (!content) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h3>
      <div className="text-sm text-gray-800 leading-relaxed prose prose-sm prose-gray max-w-none
        prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-gray-900">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function AnalysisResult({ analysis }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const style = analysis.criticite ? CRITICITE_STYLES[analysis.criticite] : null;
  const scoreWidth = `${((analysis.score_risque ?? 5) / 10) * 100}%`;

  const date = new Date(analysis.created_at).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 ${style?.border ?? 'border-l-gray-200'}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-xs text-gray-400">{date}</p>
            {analysis.scope && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">
                {analysis.scope}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{analysis.constat}</p>
        </div>
        {analysis.criticite && style && (
          <span className={`shrink-0 text-sm font-bold border rounded-full px-4 py-1.5 ${style.badge}`}>
            {analysis.criticite}
          </span>
        )}
      </div>

      {/* Risk score bar */}
      {analysis.score_risque !== null && (
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 w-24 shrink-0">Score de risque</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className={`h-2 rounded-full transition-all ${style?.bar ?? 'bg-gray-400'}`} style={{ width: scoreWidth }} />
          </div>
          <span className="text-sm font-bold text-gray-800 w-10 text-right">{analysis.score_risque}/10</span>
        </div>
      )}

      {/* Structured sections */}
      <div className="p-6 grid gap-3">
        <MarkdownSection title="Risques identifiés" icon="⚠️" content={analysis.risques} />
        <MarkdownSection title="Exigences IFS Food v8" icon="📋" content={analysis.exigences_ifs} />
        <MarkdownSection title="Recommandations" icon="✅" content={analysis.recommandations} />
        <MarkdownSection title="Délai de traitement" icon="🕐" content={analysis.delai} />
      </div>

      {/* Raw toggle */}
      {analysis.full_response && (
        <div className="px-6 pb-5">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            {showRaw ? 'Masquer' : 'Voir'} la réponse brute
          </button>
          {showRaw && (
            <pre className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-4 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {analysis.full_response}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
