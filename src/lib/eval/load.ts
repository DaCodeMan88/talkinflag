import { createAdminClient } from "./admin-client";

export type RawItem = {
  id: string;
  section_key: string;
  ordinal: number;
  prompt: string;
  style: string;
  options: { label: string; dimension: string; points: number }[];
  science_dimension: string | null;
  taxonomy_trait_id: number | null;
  taxonomy_tier: number | null;
  source_citation: string | null;
};

/** Public-safe item: answer key (dimension/points) stripped from options. */
export type PublicItem = {
  id: string;
  section_key: string;
  ordinal: number;
  prompt: string;
  style: string;
  options: { label: string }[];
};

export function stripAnswers(item: RawItem): PublicItem {
  return {
    id: item.id,
    section_key: item.section_key,
    ordinal: item.ordinal,
    prompt: item.prompt,
    style: item.style,
    options: item.options.map((o) => ({ label: o.label })),
  };
}

/** Load the active questionnaire's items WITH the answer key (server only). */
export async function loadActiveItems(): Promise<{ questionnaireId: string; items: RawItem[] } | null> {
  const db = createAdminClient();
  const { data: q } = await db
    .from("eval_questionnaires")
    .select("id")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!q) return null;
  const { data: items } = await db
    .from("eval_items")
    .select("id, section_key, ordinal, prompt, style, options, science_dimension, taxonomy_trait_id, taxonomy_tier, source_citation")
    .eq("questionnaire_id", q.id)
    .order("ordinal", { ascending: true });
  return { questionnaireId: q.id, items: (items ?? []) as RawItem[] };
}
