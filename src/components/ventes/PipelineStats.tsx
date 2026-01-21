import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  ShoppingCart,
  Truck,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface PipelineStatsProps {
  stats: {
    devisEnAttente: number;
    bcPretProduction: number;
    bcEnProduction: number;
    bcLivre: number;
    totalDevisHT: number;
  };
}

export function PipelineStats({ stats }: PipelineStatsProps) {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.devisEnAttente}</p>
                <p className="text-xs text-muted-foreground">Devis en attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bcPretProduction}</p>
                <p className="text-xs text-muted-foreground">BC prêts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDevisHT.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">DH en devis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Truck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bcLivre}</p>
                <p className="text-xs text-muted-foreground">BC livrés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Flux Commercial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Devis Stage */}
            <div className="flex-1 text-center">
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30">
                <FileText className="h-8 w-8 text-warning" />
                <p className="font-semibold">{stats.devisEnAttente} Devis</p>
                <p className="text-xs text-muted-foreground">En Attente</p>
              </div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            {/* BC Stage */}
            <div className="flex-1 text-center">
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/30">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <p className="font-semibold">{stats.bcPretProduction} BC</p>
                <p className="text-xs text-muted-foreground">Validés</p>
              </div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            {/* Production Stage */}
            <div className="flex-1 text-center">
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-accent/10 border border-accent/30">
                <Loader2 className="h-8 w-8 text-accent" />
                <p className="font-semibold">{stats.bcEnProduction} BC</p>
                <p className="text-xs text-muted-foreground">En Production</p>
              </div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            {/* Delivered Stage */}
            <div className="flex-1 text-center">
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-success/10 border border-success/30">
                <Truck className="h-8 w-8 text-success" />
                <p className="font-semibold">{stats.bcLivre} BC</p>
                <p className="text-xs text-muted-foreground">Livrés</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
