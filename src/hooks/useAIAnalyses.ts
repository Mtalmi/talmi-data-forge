import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const productionSupabase = createClient(
  "https://gvxzqoboimfsqqjzwowp.supabase.co",
  "sb_publishable_uYn8fvLy5h9IN2jRobR88A_jHZ23Stx"
);

export interface AIAnalysis {
  id: number;
  type: string;
  module: string;
  titre: string;
  contenu: Record<string, any> | null;
  resume: string | null;
  score: number | null;
  urgence: string;
  statut: string;
  source: string;
  model: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export function useLatestAnalysis(type: string) {
  return useQuery({
    queryKey: ["ai-analysis-latest", type],
    queryFn: async () => {
      const { data, error } = await productionSupabase
        .from("ai_analyses")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("[AIAnalyses]", type, { data, error });

      if (error) throw error;
      return data as AIAnalysis | null;
    },
    refetchInterval: 60000,
  });
}
