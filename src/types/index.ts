export interface Analysis {
  id: string;
  constat: string;
  scope: string | null;
  criticite: string | null;
  score_risque: number | null;
  risques: string | null;
  exigences_ifs: string | null;
  recommandations: string | null;
  delai: string | null;
  full_response: string | null;
  created_at: string;
}
