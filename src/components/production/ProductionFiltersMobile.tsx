import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Clock, 
  Factory, 
  CheckCircle, 
  Truck,
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface ProductionFiltersMobileProps {
  activeFilters: string[];
  onFilterChange: (filter: string) => void;
  onClearFilters: () => void;
}

export function ProductionFiltersMobile({
  activeFilters,
  onFilterChange,
  onClearFilters
}: ProductionFiltersMobileProps) {
  const { t } = useI18n();
  const pf = t.productionFilters;
  const c = t.common;
  const activeCount = activeFilters.length;

  const FILTER_OPTIONS = [
    { value: 'pret_production', label: pf.ready, icon: Clock, color: 'bg-blue-500' },
    { value: 'production', label: pf.inProduction, icon: Factory, color: 'bg-orange-500' },
    { value: 'validation_technique', label: pf.validation, icon: CheckCircle, color: 'bg-purple-500' },
    { value: 'en_livraison', label: pf.inDelivery, icon: Truck, color: 'bg-yellow-500' },
    { value: 'livre', label: pf.delivered, icon: CheckCircle, color: 'bg-green-500' },
    { value: 'alerte_ecart', label: pf.deviationAlerts, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative h-12 w-full md:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          <span>{c.filters}</span>
          {activeCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>{pf.filterLots}</SheetTitle>
          <SheetDescription>{pf.selectStatuses}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {FILTER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = activeFilters.includes(option.value);

            return (
              <Button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "w-full h-14 justify-start text-left",
                  isActive && option.color
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="flex-1">{option.label}</span>
                {isActive && <CheckCircle className="h-5 w-5" />}
              </Button>
            );
          })}
        </div>

        {activeCount > 0 && (
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={onClearFilters}
              variant="ghost"
              className="w-full h-12 text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              {pf.clearAllFilters}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
