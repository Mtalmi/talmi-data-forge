import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, CheckCircle2, Clock, Package, Wallet, Moon,
  FileText, Truck, PieChart, FlaskConical, MapPin,
  Factory, Shield, Key, Search, BarChart3, Users, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulationType, SimulationDifficulty } from './types';

interface SimulationCardProps {
  type: SimulationType;
  title: string;
  description: string;
  duration: string;
  difficulty: SimulationDifficulty;
  isCompleted: boolean;
  onStart: () => void;
}

const iconMap: Record<SimulationType, React.ElementType> = {
  stock_reception: Package,
  expense_entry: Wallet,
  midnight_protocol: Moon,
  create_quote: FileText,
  validate_delivery: Truck,
  budget_management: PieChart,
  quality_control: FlaskConical,
  fleet_predator: MapPin,
  production_management: Factory,
  audit_compliance: Shield,
  ai_receipt_verification: Bot,
  ceo_override: Key,
  forensic_analysis: Search,
  financial_reporting: BarChart3,
  client_management: Users,
};

const difficultyConfig: Record<SimulationDifficulty, { label: string; className: string }> = {
  easy: { label: 'Facile', className: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' },
  medium: { label: 'Moyen', className: 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  hard: { label: 'Avancé', className: 'bg-rose-200 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300' },
};

export function SimulationCard({
  type,
  title,
  description,
  duration,
  difficulty,
  isCompleted,
  onStart,
}: SimulationCardProps) {
  const Icon = iconMap[type];
  const diffConfig = difficultyConfig[difficulty];

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50",
      "hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-700",
      isCompleted && "ring-2 ring-emerald-500/50"
    )}>
      {/* Difficulty Badge */}
      <div className="absolute top-3 right-3">
        <Badge 
          variant="secondary" 
          className={cn("text-xs font-medium", diffConfig.className)}
        >
          {diffConfig.label}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl transition-all",
            "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
            "group-hover:from-amber-500/30 group-hover:to-amber-600/20"
          )}>
            <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-semibold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
              {title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between">
          {/* Duration */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{duration}</span>
          </div>

          {/* Status / Action */}
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Terminé</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onStart}
              className="gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              <Play className="h-3.5 w-3.5" />
              Démarrer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
