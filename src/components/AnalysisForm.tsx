'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

export const DEFAULT_SYSTEM_PROMPT = `### RÔLE
Tu es un Expert en Conformité IFS Food v8, en Europe. Ta mission est d'agir en tant que réviseur technique pour arbitrer des « observation » d'audit initialement notées en "D". chaque observation est liée à un périmètre d'audit, le process decrit dans le périmètre a une conséquence directe avec le risque et dangers identifié dans l'observation. qui doit etre pris en compte comme contexte.

### OBJECTIF DE L'ANALYSE
Déterminer si la note "D" est appropriée ou si l'observation doit être requalifiée en "Non-conformité Majeure" en fonction du risque résiduel pour la sécurité alimentaire, qualité, légalité et/ou authenticité du produit.

### CONTEXTE TECHNIQUE
1. **Scope:** C'est le cadre de fabrication. Tout manquement doit être analysé à travers le prisme des dangers (biologiques, chimiques, physiques) spécifiques à ce périmètre.
2. **Définition D (Not Implemented) :** L'exigence du standards IFS est absente ou non appliquée, mais n'entraîne pas de rupture immédiate de la sécurité alimentaire.
3. **Définition MAJEURE :** Une non-conformité majeure est une défaillance significative démontrant un manquement substantiel aux exigences du référentiel IFS Food, incluant notamment, sans s'y limiter, les exigences relatives à la sécurité des aliments et/ou aux obligations légales applicables dans les pays de production et/ou de mise sur le marché.
Elle est caractérisée par au moins l'un des critères suivants :
1. Manquement substantiel : non-respect d'une exigence avec un impact potentiel ou avéré sur la conformité du système, y compris sur la sécurité des aliments et/ou la conformité réglementaire/légale.
2. Perte de maîtrise d'un procédé : situation indiquant que le procédé n'est plus contrôlé (ou que les mesures de maîtrise ne sont pas efficacement mises en œuvre), susceptible d'affecter la sécurité des aliments.
Indicateurs attendus pour conclure "majeure" :
• Existence d'éléments probants montrant une rupture du système (application non conforme, contrôle non réalisé, critères non respectés, actions non efficaces).
• Risque de sécurité des aliments et/ou de non-conformité légale plausible compte tenu du contexte produit/procédé.
• Maîtrise insuffisante : absence, non-application ou inefficacité des PRP/OPRP/CCP (selon le système en place) ou des contrôles clés.

### MÉTHODOLOGIE D'ÉVALUATION
Pour chaque observation soumise, tu dois suivre ce raisonnement :
1. **Analyse du Risque lié au Scope :** Compte tenu du périmètre de fabrication, quel est le danger principal si cette exigence n'est pas respectée ?
2. **Arbitrage D vs Majeure :**
   - Si l'absence (D) crée un danger direct, immédiat et non maîtrisé pour la santé du consommateur, la qualité du produit, ou la légalité du produit : **Requalifier en MAJEURE**.
   - Si l'absence est un manquement administratif ou structurel sans impact direct sur la sécurité immédiate du lot : **Maintenir en D**.
3. **Justification Constructive :** Rédige une explication technique concise expliquant pourquoi la note est maintenue ou aggravée.`;

interface Props {
  onSubmit: (observation: string, perimetre: string, req_text: string, tv_remarq: string, systemPrompt: string) => Promise<void>;
  loading: boolean;
}

export default function AnalysisForm({ onSubmit, loading }: Props) {
  const [observation, setObservation] = useState('');
  const [perimetre, setPerimetre] = useState('');
  const [reqText, setReqText] = useState('');
  const [tvRemarq, setTvRemarq] = useState('');
  const [systemPrompt, setSystemPrompt] = useState<string>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('ifs_system_prompt') ?? DEFAULT_SYSTEM_PROMPT)
      : DEFAULT_SYSTEM_PROMPT
  );
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase on mount (Supabase is source of truth)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          setSystemPrompt(data.value);
          localStorage.setItem('ifs_system_prompt', data.value);
        }
      });
  }, []);

  // Debounce save to Supabase + keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('ifs_system_prompt', systemPrompt);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase
        .from('settings')
        .upsert({ key: 'system_prompt', value: systemPrompt });
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [systemPrompt]);

  const isModified = systemPrompt !== DEFAULT_SYSTEM_PROMPT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!observation.trim() || !perimetre.trim() || !reqText.trim()) return;
    await onSubmit(observation, perimetre, reqText, tvRemarq, systemPrompt);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Nouvelle Observation</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Exigence IFS <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={reqText}
          onChange={(e) => setReqText(e.target.value)}
          placeholder="ex: L'organisation doit définir et mettre en œuvre un programme de nettoyage…"
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          required
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Périmètre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={perimetre}
          onChange={(e) => setPerimetre(e.target.value)}
          placeholder="ex: Production de viande fraîche, Conditionnement sous atmosphère modifiée…"
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          required
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Observation de l&apos;auditeur <span className="text-red-500">*</span>
        </label>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Décrivez l'observation d'audit notée «D»…"
          rows={4}
          required
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          disabled={loading}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Remarque VT <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <textarea
          value={tvRemarq}
          onChange={(e) => setTvRemarq(e.target.value)}
          placeholder="Commentaire du validateur technique, si disponible…"
          rows={3}
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          disabled={loading}
        />
      </div>

      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowPromptEditor((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${showPromptEditor ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          Prompt système
          {isModified && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full">modifié</span>
          )}
        </button>

        {showPromptEditor && (
          <div className="mt-2">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 text-xs font-mono text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
              disabled={loading}
            />
            {isModified && (
              <button
                type="button"
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                className="mt-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Réinitialiser au prompt par défaut
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !observation.trim() || !perimetre.trim() || !reqText.trim()}
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
