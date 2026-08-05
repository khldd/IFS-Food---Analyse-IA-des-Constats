export interface Analysis {
  id: string;
  user_id: string | null;
  observation: string;
  perimetre: string;
  req_text: string;
  req_num: string | null;
  tv_remarq: string | null;
  grade: 'D' | 'Majeure' | null;
  reasoning: string | null;
  diff: string | null;
  created_at: string;
}

export interface IfsRequirement {
  id: string;
  req_num: string;
  req_text: string;
  chapter: string | null;
  ko: boolean;
}
