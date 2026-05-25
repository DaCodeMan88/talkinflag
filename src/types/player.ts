export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  level?: string | null;
  school_or_team?: string | null;
  grad_year?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  country_code?: string | null;
  height_in?: number | null;
  weight_lbs?: number | null;
  stats?: Record<string, unknown>;
  highlight_url?: string | null;
  instagram?: string | null;
  ranking_national?: number | null;
  ranking_position?: number | null;
  gender?: "male" | "female" | null;
  bio?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}
