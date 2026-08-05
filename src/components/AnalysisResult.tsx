'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Analysis } from '@/types';

interface Props {
  analysis: Analysis;
}

export default function AnalysisResult({ analysis }: Props) {
  const [copied, setCopied] = useState(false);

  const fullMarkdown = [
    analysis.reasoning ?? '',
    analysis.diff ? `\n---\n\n**⚖️ Verdict Validateur :** ${analysis.diff}` : '',
  ].join('');

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(fullMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [fullMarkdown]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-end">
        <button
          onClick={copyToClipboard}
          title="Copier en Markdown"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2.5 py-1 rounded border border-gray-200 hover:border-gray-400 bg-white"
        >
          {copied ? (
            <><span>✓</span> Copié</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier MD</>
          )}
        </button>
      </div>

      {/* Markdown canvas */}
      <div className="p-6 prose prose-sm prose-gray max-w-none
        prose-headings:text-gray-900 prose-p:my-2 prose-ul:my-2 prose-ol:my-2
        prose-li:my-0.5 prose-strong:text-gray-900 prose-hr:my-4">
        <ReactMarkdown>{fullMarkdown}</ReactMarkdown>
      </div>

      {/* Input context */}
      <div className="px-6 py-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
        <p><span className="font-medium text-gray-600">Observation :</span> {analysis.observation}</p>
        <p><span className="font-medium text-gray-600">Périmètre :</span> {analysis.perimetre}</p>
        <p><span className="font-medium text-gray-600">Exigence IFS :</span> {analysis.req_num ? `${analysis.req_num} — ` : ''}{analysis.req_text}</p>
        {analysis.tv_remarq && (
          <p><span className="font-medium text-gray-600">Remarque VT :</span> {analysis.tv_remarq}</p>
        )}
      </div>
    </div>
  );
}
