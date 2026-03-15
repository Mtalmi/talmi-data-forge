import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const productionSupabase = createClient(
  "https://gvxzqoboimfsqqjzwowp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2eHpxb2JvaW1mc3Fxanp3b3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDM5MjksImV4cCI6MjA4NDY3OTkyOX0.DWiwfxIH8YGxa26vqgCp7id5JDaFuF_vUuYJnzc2jq4"
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

      

      if (error) throw error;
      return data as AIAnalysis | null;
    },
    refetchInterval: 60000,
  });
}
