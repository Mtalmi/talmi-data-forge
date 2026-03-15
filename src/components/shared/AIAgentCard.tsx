import { useLatestAnalysis } from "@/hooks/useAIAnalyses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Brain, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface AIAgentCardProps {
  type: string;
  title: string;
  icon?: React.ReactNode;
}

const urgenceConfig: Record<string, { color: string; bg: string; icon: typeof Info; label: string }> = {
  info: { color: "text-[#22C55E]", bg: "bg-[#22C55E]/10", icon: Info, label: "Info" },
  warning: { color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", icon: AlertTriangle, label: "Attention" },
  critique: { color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", icon: AlertCircle, label: "Critique" },
};

export function AIAgentCard({ type, title, icon }: AIAgentCardProps) {
  const { data, isLoading, refetch, isFetching } = useLatestAnalysis(type);
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-analysis-latest", type] });
    refetch();
  };

  const urgence = data?.urgence && urgenceConfig[data.urgence] ? urgenceConfig[data.urgence] : urgenceConfig.info;
  const UrgenceIcon = urgence.icon;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  return (
    <div className="rounded-lg border border-[#D4A843]/20 border-t-2 border-t-[#D4A843] bg-[#0B1120]/80 p-4 font-mono backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon || <Brain className="h-4 w-4 text-[#D4A843]" />}
          <span className="text-sm font-bold text-[#D4A843] tracking-wide">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Badge variant="outline" className={`${urgence.bg} ${urgence.color} border-0 text-[10px] font-semibold`}>
              <UrgenceIcon className="h-3 w-3 mr-1" />
              {urgence.label}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 text-[#D4A843]/60 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-[#D4A843]/10 rounded w-3/4" />
          <div className="h-3 bg-[#D4A843]/5 rounded w-1/2" />
        </div>
      ) : data ? (
        <>
          {data.score !== null && (
            <div className="text-3xl font-extralight text-[#D4A843] mb-2" style={{ textShadow: '0 0 20px rgba(212,168,67,0.2)' }}>
              {data.score}/100
            </div>
          )}
          <p className="text-xs text-slate-300 leading-relaxed mb-2">
            {data.resume || data.titre}
          </p>
          {data.model && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#D4A843]/10">
              <span className="text-[10px] text-[#D4A843]/50 font-medium">
                Généré par IA · {data.model === "claude-opus-4-6" ? "Claude Opus" : data.model === "calculated" ? "Calculé" : data.model}
              </span>
              <span className="text-[10px] text-slate-500">
                {formatTimeAgo(data.created_at)}
              </span>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500 italic">
          Aucune analyse disponible. L'agent n'a pas encore été exécuté.
        </p>
      )}
    </div>
  );
}
