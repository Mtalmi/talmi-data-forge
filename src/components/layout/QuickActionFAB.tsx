import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import {
  Zap,
  Truck,
  Factory,
  ClipboardCheck,
  Package,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTask {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  path: string;
  count?: number;
  priority: 'high' | 'medium' | 'low';
}

export function QuickActionFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Hide on driver view (already simplified) and auth page
  const hiddenPaths = ['/chauffeur', '/auth'];
  const shouldHide = hiddenPaths.includes(location.pathname);

  useEffect(() => {
    if (!shouldHide) {
      fetchPendingTasks();
      const interval = setInterval(fetchPendingTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [shouldHide]);

  const fetchPendingTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const quickTasks: QuickTask[] = [];

      // Check pending production entries
      const { data: productionData } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .eq('workflow_status', 'production')
        .eq('date_livraison', today);

      const productionCount = productionData?.length || 0;
      if (productionCount > 0) {
        quickTasks.push({
          id: 'production',
          label: 'Saisie Production',
          sublabel: `${productionCount} bon(s) en attente`,
          icon: <Factory className="h-4 w-4" />,
          path: '/production',
          count: productionCount,
          priority: 'high',
        });
      }

      // Check pending technical validations
      const { data: validationData } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .eq('workflow_status', 'validation_technique')
        .eq('date_livraison', today);

      const validationCount = validationData?.length || 0;
      if (validationCount > 0) {
        quickTasks.push({
          id: 'validation',
          label: 'Validation Technique',
          sublabel: `${validationCount} à valider`,
          icon: <ClipboardCheck className="h-4 w-4" />,
          path: '/production',
          count: validationCount,
          priority: 'high',
        });
      }

      // Check deliveries in progress
      const { data: deliveryData } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .eq('workflow_status', 'en_livraison')
        .eq('date_livraison', today);

      const deliveryCount = deliveryData?.length || 0;
      if (deliveryCount > 0) {
        quickTasks.push({
          id: 'deliveries',
          label: 'Livraisons en cours',
          sublabel: `${deliveryCount} en route`,
          icon: <Truck className="h-4 w-4" />,
          path: '/chauffeur',
          count: deliveryCount,
          priority: 'medium',
        });
      }

      // Check today's planned deliveries
      const { data: plannedData } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .eq('workflow_status', 'planification')
        .eq('date_livraison', today);

      const plannedCount = plannedData?.length || 0;
      if (plannedCount > 0) {
        quickTasks.push({
          id: 'planning',
          label: 'À Planifier',
          sublabel: `${plannedCount} livraison(s)`,
          icon: <Package className="h-4 w-4" />,
          path: '/planning',
          count: plannedCount,
          priority: 'low',
        });
      }

      // Check clock-in status
      const { data: pointageData } = await supabase
        .from('pointages')
        .select('id')
        .eq('date_pointage', today)
        .is('heure_sortie', null);

      const notClockedOut = pointageData?.length || 0;
      if (notClockedOut > 0) {
        quickTasks.push({
          id: 'pointage',
          label: 'Pointage',
          sublabel: `${notClockedOut} en cours`,
          icon: <Clock className="h-4 w-4" />,
          path: '/pointage',
          count: notClockedOut,
          priority: 'low',
        });
      }

      setTasks(quickTasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));
    } catch (error) {
      console.error('Error fetching quick tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = tasks.reduce((sum, t) => sum + (t.count || 0), 0);
  const hasHighPriority = tasks.some(t => t.priority === 'high');

  if (shouldHide || loading || tasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={cn(
              'h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
              'flex items-center justify-center',
              hasHighPriority 
                ? 'bg-warning hover:bg-warning/90 animate-pulse' 
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            <Zap className="h-6 w-6" />
            {totalTasks > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {totalTasks > 9 ? '9+' : totalTasks}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-72 p-2"
          sideOffset={8}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Mes Tâches
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {tasks.map((task) => (
            <DropdownMenuItem
              key={task.id}
              onClick={() => navigate(task.path)}
              className={cn(
                'flex items-center gap-3 p-3 cursor-pointer rounded-lg my-1',
                task.priority === 'high' && 'bg-warning/10 border-l-2 border-warning',
                task.priority === 'medium' && 'bg-primary/5'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                task.priority === 'high' ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'
              )}>
                {task.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{task.label}</p>
                <p className="text-xs text-muted-foreground">{task.sublabel}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
