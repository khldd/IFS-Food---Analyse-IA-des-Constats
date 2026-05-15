'use client';

import type { Analysis } from '@/types';

interface Props {
  history: Analysis[];
  loading: boolean;
  selected: Analysis | null;
  onSelect: (a: Analysis) => void;
  onClear: () => void;
}

const CRITICITE_DOT: Record<string, string> = {
  Critique: 'bg-red-500',
  Majeure:  'bg-orange-500',
  Mineure:  'bg-yellow-400',
};

export default function HistoryPanel({ history, loading, selected, onSelect, onClear }: Props) {
  function handleClear() {
    if (window.confirm(`Supprimer les ${history.length} analyse(s) ? Cette action est irréversible.`)) {
      onClear();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Historique</h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">
              {history.length} analyse{history.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {history.length > 0 && !loading && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : history.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-400">Aucune analyse pour l&apos;instant</p>
            <p className="text-xs text-gray-300 mt-1">Soumettez un constat pour commencer</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((item) => {
              const isSelected = selected?.id === item.id;
              const dotColor = item.criticite
                ? (CRITICITE_DOT[item.criticite] ?? 'bg-gray-300')
                : 'bg-gray-300';
              const date = new Date(item.created_at).toLocaleString('fr-FR', {
                day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-xs text-gray-400 truncate flex-1">{date}</span>
                      {item.score_risque !== null && (
                        <span className="text-xs font-medium text-gray-500">
                          {item.score_risque}/10
                        </span>
                      )}
                    </div>
                    {item.scope && (
                      <p className="text-xs text-blue-600 mb-0.5 truncate">{item.scope}</p>
                    )}
                    <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                      {item.constat}
                    </p>
                    {item.criticite && (
                      <p className={`text-xs font-medium mt-1 ${
                        item.criticite === 'Critique' ? 'text-red-600' :
                        item.criticite === 'Majeure'  ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {item.criticite}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
