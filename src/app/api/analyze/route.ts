import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function parseResponse(text: string) {
  const result = {
    criticite: '',
    risques: '',
    exigences_ifs: '',
    recommandations: '',
    delai: '',
  };

  // Extract numbered sections: "1. CRITICITÉ: [value]" or "1. CRITICITÉ:\n content"
  const sectionPatterns: { key: keyof typeof result; labels: string[] }[] = [
    { key: 'criticite',       labels: ['CRITICITÉ', 'CRITICITE'] },
    { key: 'risques',         labels: ['RISQUES'] },
    { key: 'exigences_ifs',   labels: ['EXIGENCES IFS', 'EXIGENCES'] },
    { key: 'recommandations', labels: ['RECOMMANDATIONS'] },
    { key: 'delai',           labels: ['DÉLAI', 'DELAI'] },
  ];

  for (const section of sectionPatterns) {
    for (const label of section.labels) {
      // Format: "N. LABEL: [bracketed value]"
      const bracketMatch = text.match(
        new RegExp(`${label}\\s*:\\s*\\[([^\\]]+)\\]`, 'i')
      );
      if (bracketMatch) {
        result[section.key] = bracketMatch[1].trim();
        break;
      }

      // Format: numbered section with content until next numbered section or end
      const sectionMatch = text.match(
        new RegExp(
          `\\d+\\.\\s*(?:\\*\\*)?${label}(?:\\*\\*)?[^:\\n]*:([\\s\\S]*?)(?=\\n\\d+\\.|$)`,
          'i'
        )
      );
      if (sectionMatch) {
        result[section.key] = sectionMatch[1].replace(/^\s*\[|\]\s*$/g, '').trim();
        break;
      }
    }
  }

  // Fallback criticité detection from free text
  if (!result.criticite) {
    if (/\bcritique\b/i.test(text)) result.criticite = 'Critique';
    else if (/\bmajeure?\b/i.test(text)) result.criticite = 'Majeure';
    else if (/\bmineure?\b/i.test(text)) result.criticite = 'Mineure';
  }

  return result;
}

function getRiskScore(criticite: string): number {
  if (criticite === 'Critique') return 10;
  if (criticite === 'Majeure') return 7;
  if (criticite === 'Mineure') return 3;
  return 5;
}

export async function POST(req: NextRequest) {
  try {
    const { constat, scope } = await req.json();

    if (!constat?.trim()) {
      return NextResponse.json(
        { error: 'Le champ Constat est requis' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
      systemInstruction: `Tu es un expert auditeur IFS Food v8 avec 15 ans d'expérience en sécurité alimentaire et management de la qualité.

MISSION: Analyser le constat d'audit fourni et produire une évaluation structurée, précise et actionnable.

FORMAT DE RÉPONSE OBLIGATOIRE (respecte exactement ce format numéroté):
1. CRITICITÉ: [Critique/Majeure/Mineure]
2. RISQUES: [Liste des risques identifiés pour la sécurité alimentaire et la conformité IFS]
3. EXIGENCES IFS: [Références précises aux clauses IFS Food v8 concernées, ex: 3.1.1, 4.2.3]
4. RECOMMANDATIONS: [Actions correctives détaillées et pratiques]
5. DÉLAI: [Court terme (< 1 mois) / Moyen terme (1-3 mois) / Long terme (> 3 mois)]

Réponds uniquement en français avec un langage professionnel et technique.`,
    });

    const prompt = `DONNÉES D'AUDIT IFS Food v8:
- Scope: ${scope?.trim() || 'Non spécifié'}
- Constat: ${constat.trim()}

Analyse ce constat selon les standards IFS Food v8 et fournis une évaluation structurée complète.`;

    const geminiResult = await model.generateContent(prompt);
    const fullResponse = geminiResult.response.text();

    const parsed = parseResponse(fullResponse);
    const scoreRisque = getRiskScore(parsed.criticite);

    const supabase = getSupabase();
    const { data: inserted, error: dbError } = await supabase
      .from('analyses')
      .insert({
        constat: constat.trim(),
        scope: scope?.trim() || null,
        criticite: parsed.criticite || null,
        score_risque: scoreRisque,
        risques: parsed.risques || null,
        exigences_ifs: parsed.exigences_ifs || null,
        recommandations: parsed.recommandations || null,
        delai: parsed.delai || null,
        full_response: fullResponse,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('[/api/analyze]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
