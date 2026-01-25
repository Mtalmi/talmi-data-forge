import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2, Clock, Package, Wallet, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulationType } from './types';

interface SimulationCardProps {
  type: SimulationType;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  onStart: () => void;
}

const iconMap = {
  stock_reception: Package,
  expense_entry: Wallet,
  midnight_protocol: Moon,
};

const categoryMap = {
  stock_reception: 'Opérations',
  expense_entry: 'Finance',
  midnight_protocol: 'Sécurité',
};

export function SimulationCard({
  type,
  title,
  description,
  duration,
  isCompleted,
  onStart,
}: SimulationCardProps) {
  const Icon = iconMap[type];
  const category = categoryMap[type];

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50",
      "hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-700",
      isCompleted && "ring-2 ring-emerald-500/50"
    )}>
      {/* Category Badge */}
      <div className="absolute top-3 right-3">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs font-medium",
            type === 'stock_reception' && "bg-yellow-200 text-yellow-800",
            type === 'expense_entry' && "bg-orange-200 text-orange-800",
            type === 'midnight_protocol' && "bg-pink-200 text-pink-800"
          )}
        >
          {category}
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
        <p className="text-sm text-muted-foreground leading-relaxed">
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
