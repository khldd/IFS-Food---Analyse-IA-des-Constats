'use client';

import ReactMarkdown from 'react-markdown';
import type { Analysis } from '@/types';

interface Props {
  analysis: Analysis;
}

const GRADE_STYLES: Record<string, { badge: string; border: string }> = {
  D:       { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', border: 'border-l-yellow-400' },
  Majeure: { badge: 'bg-red-100 text-red-800 border-red-200',          border: 'border-l-red-500' },
};

const GRADE_LABELS: Record<string, string> = {
  D:       'D maintenu',
  Majeure: 'Requalifié MAJEURE',
};

function getDiffStyle(diff: string | null): string {
  if (!diff) return 'bg-gray-50 border-gray-200 text-gray-700';
  return diff.toLowerCase().includes('ne valide pas')
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-green-50 border-green-200 text-green-800';
}

export default function AnalysisResult({ analysis }: Props) {
  const style = analysis.grade ? GRADE_STYLES[analysis.grade] : null;

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
            {analysis.perimetre && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">
                {analysis.perimetre}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{analysis.observation}</p>
        </div>
        {analysis.grade && style && (
          <span className={`shrink-0 text-sm font-bold border rounded-full px-4 py-1.5 whitespace-nowrap ${style.badge}`}>
            {GRADE_LABELS[analysis.grade] ?? analysis.grade}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* AI Reasoning */}
        {analysis.reasoning && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🔍</span> Analyse IA
            </h3>
            <div className="text-sm text-gray-800 leading-relaxed prose prose-sm prose-gray max-w-none
              prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-gray-900">
              <ReactMarkdown>{analysis.reasoning}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Validator verdict */}
        {analysis.diff && (
          <div className={`rounded-lg border p-4 ${getDiffStyle(analysis.diff)}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 opacity-60">
              <span>⚖️</span> Verdict Validateur
            </h3>
            <p className="text-sm font-medium leading-relaxed">{analysis.diff}</p>
          </div>
        )}

        {/* Collapsible context */}
        {analysis.req_text && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 transition-colors select-none">
              Voir le contexte de l&apos;analyse
            </summary>
            <div className="mt-3 space-y-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p><span className="font-medium text-gray-700">Exigence IFS :</span> {analysis.req_text}</p>
              {analysis.tv_remarq && (
                <p><span className="font-medium text-gray-700">Remarque VT :</span> {analysis.tv_remarq}</p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
