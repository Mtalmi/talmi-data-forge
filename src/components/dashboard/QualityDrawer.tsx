import React, { useEffect, useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface QualityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LabTest {
  id: string;
  bl_id: string | null;
  date_prelevement: string;
  affaissement_mm: number | null;
  affaissement_conforme: boolean | null;
  resistance_7j_mpa: number | null;
  resistance_28j_mpa: number | null;
  resistance_conforme: boolean | null;
  alerte_qualite: boolean | null;
  formule_id: string | null;
}

export const QualityDrawer = forwardRef<HTMLDivElement, QualityDrawerProps>(
  function QualityDrawer({ open, onOpenChange }, ref) {
  const navigate = useNavigate();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTests();
    }
  }, [open]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tests_laboratoire')
        .select(`
          id,
          bl_id,
          date_prelevement,
          affaissement_mm,
          affaissement_conforme,
          resistance_7j_mpa,
          resistance_28j_mpa,
          resistance_conforme,
          alerte_qualite,
          formule_id
        `)
        .gte('date_prelevement', startOfMonth)
        .order('date_prelevement', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLab = () => {
    onOpenChange(false);
    navigate('/laboratoire');
  };

  // Calculate stats
  const totalTests = tests.length;
  const nonConformTests = tests.filter(t => 
    t.alerte_qualite === true || 
    t.resistance_conforme === false ||
    t.affaissement_conforme === false
  );
  const conformTests = totalTests - nonConformTests.length;
  const qualityIndex = totalTests > 0 ? (conformTests / totalTests) * 100 : 100;

  // Categorize non-conformities
  const slumpIssues = tests.filter(t => t.affaissement_conforme === false);
  const resistanceIssues = tests.filter(t => t.resistance_conforme === false);
  const pendingResistance = tests.filter(t => 
    t.resistance_7j_mpa === null || t.resistance_28j_mpa === null
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Détail Qualité - Ce Mois
          </DrawerTitle>
          <DrawerDescription>
            Tests laboratoire et non-conformités
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {/* Quality Score Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Indice de Qualité</span>
                    <Badge variant={qualityIndex >= 100 ? 'default' : qualityIndex >= 95 ? 'secondary' : 'destructive'}>
                      {qualityIndex.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={qualityIndex} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{conformTests} conformes</span>
                    <span>{nonConformTests.length} non-conformes</span>
                  </div>
                </CardContent>
              </Card>

              {/* Issue Breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <Card className={cn(
                  "border",
                  slumpIssues.length > 0 ? "border-warning/50 bg-warning/5" : "border-success/50 bg-success/5"
                )}>
                  <CardContent className="p-3 text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      slumpIssues.length > 0 ? "text-warning" : "text-success"
                    )}>
                      {slumpIssues.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Affaissement</p>
                  </CardContent>
                </Card>
                <Card className={cn(
                  "border",
                  resistanceIssues.length > 0 ? "border-destructive/50 bg-destructive/5" : "border-success/50 bg-success/5"
                )}>
                  <CardContent className="p-3 text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      resistanceIssues.length > 0 ? "text-destructive" : "text-success"
                    )}>
                      {resistanceIssues.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Résistance</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">
                      {pendingResistance.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">En Attente</p>
                  </CardContent>
                </Card>
              </div>

              {/* Non-Conformities List */}
              {nonConformTests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    Non-Conformités
                  </h3>
                  <div className="space-y-2">
                    {nonConformTests.slice(0, 5).map((test) => (
                      <Card key={test.id} className="border-destructive/30 bg-destructive/5">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                                <span className="font-medium text-sm truncate">
                                  BL: {test.bl_id || 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Formule: {test.formule_id || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(test.date_prelevement)}
                              </p>
                              <div className="flex gap-1 mt-1 justify-end">
                                {test.affaissement_conforme === false && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-warning text-warning">
                                    Aff.
                                  </Badge>
                                )}
                                {test.resistance_conforme === false && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-destructive text-destructive">
                                    Rés.
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Values */}
                          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                            {test.affaissement_mm !== null && (
                              <div className={cn(
                                "px-2 py-1 rounded",
                                test.affaissement_conforme === false ? "bg-warning/10" : "bg-muted/50"
                              )}>
                                <span className="text-muted-foreground">Aff: </span>
                                <span className="font-medium">{test.affaissement_mm}mm</span>
                              </div>
                            )}
                            {(test.resistance_7j_mpa !== null || test.resistance_28j_mpa !== null) && (
                              <div className={cn(
                                "px-2 py-1 rounded",
                                test.resistance_conforme === false ? "bg-destructive/10" : "bg-muted/50"
                              )}>
                                <span className="text-muted-foreground">Rés: </span>
                                {test.resistance_7j_mpa !== null && (
                                  <span className="font-medium">{test.resistance_7j_mpa}MPa (7j)</span>
                                )}
                                {test.resistance_28j_mpa !== null && (
                                  <span className="font-medium"> {test.resistance_28j_mpa}MPa (28j)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {nonConformTests.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{nonConformTests.length - 5} autres non-conformités
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Conforming Tests */}
              {conformTests > 0 && nonConformTests.length === 0 && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-success">100% Conformité</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalTests} tests ce mois, tous conformes
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Pending Tests Alert */}
              {pendingResistance.length > 0 && (
                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Tests en Attente</p>
                        <p className="text-xs text-muted-foreground">
                          {pendingResistance.length} tests attendent les résultats de résistance
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>

        <DrawerFooter className="pt-2">
          <Button onClick={handleGoToLab} className="w-full gap-2">
            Voir Tous les Tests
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

QualityDrawer.displayName = 'QualityDrawer';
