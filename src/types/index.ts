export interface Analysis {
  id: string;
  observation: string;
  perimetre: string;
  req_text: string;
  tv_remarq: string | null;
  grade: 'D' | 'Majeure' | null;
  reasoning: string | null;
  diff: string | null;
  created_at: string;
}

