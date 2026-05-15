import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { observation, perimetre, req_text, tv_remarq } = await req.json();

    if (!observation?.trim()) {
      return NextResponse.json({ error: "Le champ Observation est requis" }, { status: 400 });
    }
    if (!perimetre?.trim()) {
      return NextResponse.json({ error: "Le champ Périmètre est requis" }, { status: 400 });
    }
    if (!req_text?.trim()) {
      return NextResponse.json({ error: "Le champ Exigence IFS est requis" }, { status: 400 });
    }

    // ── Call 1: analyze agent ────────────────────────────────────────────────
    const analyzeModel = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            reasoning: { type: SchemaType.STRING },
            grade:     { type: SchemaType.STRING, enum: ['D', 'Majeure'] },
          },
          required: ['reasoning', 'grade'],
        },
      },
      systemInstruction: `### RÔLE
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
3. **Justification Constructive :** Rédige une explication technique concise expliquant pourquoi la note est maintenue ou aggravée.`,
    });

    const analyzeUserPrompt = `### DONNÉES D'ENTRÉE
- **Exigence :** ${req_text.trim()}
- **Périmètre (Scope) :** ${perimetre.trim()}
- **Observation de l'Auditeur :** ${observation.trim()}

Analyse cette observation en utilisant STRICTEMENT le format markdown avec les 3 sections numérotées.`;

    const analyzeResult = await analyzeModel.generateContent(analyzeUserPrompt);
    const analyzeJson = JSON.parse(analyzeResult.response.text()) as { reasoning: string; grade: string };
    const { reasoning, grade } = analyzeJson;

    // ── Call 2: critic agent ─────────────────────────────────────────────────
    const criticModel = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            diff: { type: SchemaType.STRING },
          },
          required: ['diff'],
        },
      },
      systemInstruction: `Tu es l'Expert Validateur Technique pour IFS Food v8.

TA MISSION :
Lire l'analyse de l'IA (Output_AI) avec le commentaire du professionnel (TV remarq).

Tu dois confirmer si l'analyse de l'IA confirme la notation en "D" ou propose une non conformité majeure.
Tu dois analyser le commentaire dans la colonne (TV remarq), et donner un avis technique sur ce commentaire, s'il est en adéquation avec l'analyse de l'IA (Output AI).
ta réponse doit être une de ces 3 phrases (ne pas donner un autre avis) :

Si la réponse de l'IA (Output Ai), conclus que la notation "D" est appropriée, tu réponds : L'analyse de l'IA valide la notation "D"

Si la réponse de l'IA (Output Ai), conclus qu'une non conformité majeure est recommandée, et que dans la colonne (TV remarq) il y a un commentaire pertinent avec cette analyse, tu réponds : L'analyse de l'IA ne valide pas la notation en D, et la demande de la VT est pertinente

Si la réponse de l'IA (Output Ai), conclus qu'une non conformité majeure est recommandée, et que dans la colonne (TV remarq) il n'y a pas de commentaire (Null), tu réponds : L'analyse de l'IA ne valide pas la notation en D, Pas de remarque de la VT`,
    });

    const criticUserPrompt = `DONNÉES À COMPARER :
- Observation : ${observation.trim()}
- Commentaire Pro (VT) : ${tv_remarq?.trim() || 'Null'}
- Analyse IA : ${reasoning}

Critique l'analyse de l'IA par rapport au commentaire pro.`;

    const criticResult = await criticModel.generateContent(criticUserPrompt);
    const criticJson = JSON.parse(criticResult.response.text()) as { diff: string };
    const { diff } = criticJson;

    // ── Save to Supabase ─────────────────────────────────────────────────────
    const supabase = getSupabase();
    const { data: inserted, error: dbError } = await supabase
      .from('analyses')
      .insert({
        observation: observation.trim(),
        perimetre:   perimetre.trim(),
        req_text:    req_text.trim(),
        tv_remarq:   tv_remarq?.trim() || null,
        grade,
        reasoning,
        diff,
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
