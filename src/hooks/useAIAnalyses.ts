import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await (supabase as any)
        .from("ai_analyses")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AIAnalysis | null;
    },
    refetchInterval: 60000,
  });
}
