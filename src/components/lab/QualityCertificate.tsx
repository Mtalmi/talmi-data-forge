import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  Building2,
  FlaskConical,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabTests } from '@/hooks/useLabTests';

interface Client {
  client_id: string;
  nom_client: string;
  adresse?: string | null;
  contact_personne?: string | null;
}

interface QualityCertificateProps {
  client: Client;
}

interface LabTest {
  id: string;
  bl_id: string;
  formule_id: string;
  date_prelevement: string;
  affaissement_mm: number | null;
  affaissement_conforme: boolean | null;
  resistance_7j_mpa: number | null;
  resistance_28j_mpa: number | null;
  resistance_conforme: boolean | null;
}

export function QualityCertificate({ client }: QualityCertificateProps) {
  const { getClientTests } = useLabTests();
  const [open, setOpen] = useState(false);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    const clientTests = await getClientTests(client.client_id);
    setTests(clientTests);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getConformityStats = () => {
    const total = tests.length;
    const slumpConform = tests.filter(t => t.affaissement_conforme === true).length;
    const resistanceConform = tests.filter(t => t.resistance_conforme === true).length;
    const resistanceTested = tests.filter(t => t.resistance_28j_mpa !== null).length;
    
    return {
      total,
      slumpConform,
      slumpRate: total > 0 ? ((slumpConform / total) * 100).toFixed(1) : '0',
      resistanceConform,
      resistanceTested,
      resistanceRate: resistanceTested > 0 ? ((resistanceConform / resistanceTested) * 100).toFixed(1) : 'N/A',
    };
  };

  const stats = getConformityStats();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          <FileText className="h-4 w-4 mr-2" />
          Rapport Qualité
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:h-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Rapport Qualité Client
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Header - Print Friendly */}
            <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    CERTIFICAT DE QUALITÉ
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Résumé des Contrôles Laboratoire
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Date d'émission</p>
                  <p className="font-semibold">
                    {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Informations Client</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom:</span>
                    <span className="font-medium">{client.nom_client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-mono">{client.client_id}</span>
                  </div>
                  {client.contact_personne && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span>{client.contact_personne}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Bilan Conformité</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tests:</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Affaissement:</span>
                    <span className={cn(
                      'font-semibold',
                      parseFloat(stats.slumpRate) >= 95 ? 'text-success' : 'text-warning'
                    )}>
                      {stats.slumpConform}/{stats.total} ({stats.slumpRate}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Résistance 28j:</span>
                    <span className={cn(
                      'font-semibold',
                      stats.resistanceRate !== 'N/A' && parseFloat(stats.resistanceRate) >= 95 
                        ? 'text-success' 
                        : 'text-warning'
                    )}>
                      {stats.resistanceConform}/{stats.resistanceTested} ({stats.resistanceRate}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tests Table */}
            {tests.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Aucun test enregistré pour ce client
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° BL</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Formule</TableHead>
                      <TableHead className="text-center">Affaissement</TableHead>
                      <TableHead className="text-center">Rés. 7j</TableHead>
                      <TableHead className="text-center">Rés. 28j</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map(test => (
                      <TableRow key={test.id}>
                        <TableCell className="font-mono">{test.bl_id}</TableCell>
                        <TableCell>
                          {format(new Date(test.date_prelevement), 'dd/MM/yy', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{test.formule_id}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1',
                            test.affaissement_conforme === false && 'text-destructive'
                          )}>
                            {test.affaissement_mm || '-'} mm
                            {test.affaissement_conforme === false && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {test.resistance_7j_mpa ? `${test.resistance_7j_mpa} MPa` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1',
                            test.resistance_conforme === false && 'text-destructive font-semibold'
                          )}>
                            {test.resistance_28j_mpa ? `${test.resistance_28j_mpa} MPa` : '-'}
                            {test.resistance_conforme === false && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {test.resistance_conforme === true ? (
                            <Badge variant="default" className="bg-success">Conforme</Badge>
                          ) : test.resistance_conforme === false ? (
                            <Badge variant="destructive">Non Conforme</Badge>
                          ) : (
                            <Badge variant="secondary">En Attente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t print:hidden">
              <p className="text-xs text-muted-foreground">
                Ce rapport est généré automatiquement par le système de gestion qualité.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-2" />
                  Imprimer / PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
