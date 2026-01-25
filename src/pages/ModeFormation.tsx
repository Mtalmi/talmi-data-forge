import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import {
  SimulationCard,
  StockReceptionSim,
  ExpenseEntrySim,
  MidnightProtocolSim,
  SimulationType,
} from '@/components/ModeFormation';
import { cn } from '@/lib/utils';

const SIMULATIONS = [
  {
    type: 'stock_reception' as SimulationType,
    title: 'Réception Stock',
    description:
      'Maîtrisez le workflow complet: commande, photo obligatoire, vérification quantités, validation.',
    duration: '~5 min',
  },
  {
    type: 'expense_entry' as SimulationType,
    title: 'Saisie Dépense',
    description:
      'Apprenez la gestion du budget 15k DH, catégories, justificatifs et approbation CEO.',
    duration: '~4 min',
  },
  {
    type: 'midnight_protocol' as SimulationType,
    title: 'Protocole Minuit',
    description:
      'Simulez une transaction hors-heures avec justification d\'urgence et override CEO.',
    duration: '~3 min',
  },
];

export default function ModeFormation() {
  const [completedSims, setCompletedSims] = useState<SimulationType[]>([]);
  const [activeSim, setActiveSim] = useState<SimulationType | null>(null);

  const handleComplete = (type: SimulationType) => {
    if (!completedSims.includes(type)) {
      setCompletedSims((prev) => [...prev, type]);
    }
    setActiveSim(null);
  };

  const handleReset = () => {
    setCompletedSims([]);
  };

  const progressPct = (completedSims.length / SIMULATIONS.length) * 100;
  const allComplete = completedSims.length === SIMULATIONS.length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 flex items-center justify-center border border-amber-500/30">
              <GraduationCap className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Mode Formation
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Sandbox
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Simulations interactives - Aucune donnée réelle affectée
              </p>
            </div>
          </div>

          {completedSims.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Progress Card */}
        <div
          className={cn(
            'p-4 rounded-xl border transition-all',
            allComplete
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {allComplete ? (
                <Trophy className="h-5 w-5 text-emerald-500" />
              ) : (
                <BookOpen className="h-5 w-5 text-amber-500" />
              )}
              <span className="font-medium">
                {allComplete ? 'Formation Complète!' : 'Progression'}
              </span>
            </div>
            <span className="text-sm font-mono">
              {completedSims.length}/{SIMULATIONS.length}
            </span>
          </div>
          <Progress
            value={progressPct}
            className={cn(
              'h-2',
              allComplete ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'
            )}
          />
          {allComplete && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
              🎉 Félicitations! Vous avez terminé toutes les simulations.
            </p>
          )}
        </div>

        {/* Simulation Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIMULATIONS.map((sim) => (
            <SimulationCard
              key={sim.type}
              type={sim.type}
              title={sim.title}
              description={sim.description}
              duration={sim.duration}
              isCompleted={completedSims.includes(sim.type)}
              onStart={() => setActiveSim(sim.type)}
            />
          ))}
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            À propos du Mode Formation
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Toutes les données sont fictives (préfixe DEMO-)</li>
            <li>• Aucune écriture en base de données</li>
            <li>• Les logs affichent le préfixe "SIMULATION"</li>
            <li>• Vous pouvez répéter chaque simulation autant de fois que nécessaire</li>
          </ul>
        </div>
      </div>

      {/* Active Simulation Modals */}
      {activeSim === 'stock_reception' && (
        <StockReceptionSim
          onComplete={() => handleComplete('stock_reception')}
          onClose={() => setActiveSim(null)}
        />
      )}
      {activeSim === 'expense_entry' && (
        <ExpenseEntrySim
          onComplete={() => handleComplete('expense_entry')}
          onClose={() => setActiveSim(null)}
        />
      )}
      {activeSim === 'midnight_protocol' && (
        <MidnightProtocolSim
          onComplete={() => handleComplete('midnight_protocol')}
          onClose={() => setActiveSim(null)}
        />
      )}
    </MainLayout>
  );
}
