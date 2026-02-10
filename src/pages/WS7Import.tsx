import { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Link2, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImportSummary {
  total_rows: number;
  imported: number;
  failed: number;
  auto_linked: number;
  pending_link: number;
}

export default function WS7Import() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // Recent imports
  const { data: recentImports, refetch: refetchImports } = useQuery({
    queryKey: ['ws7-import-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ws7_import_log')
        .select('*')
        .order('import_datetime', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && !selected.name.endsWith('.csv')) {
      toast({ title: 'Format invalide', description: 'Fichier CSV requis', variant: 'destructive' });
      return;
    }
    setFile(selected || null);
    setSummary(null);
  };

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    setProgress(10);
    setSummary(null);

    try {
      const csvText = await file.text();
      setProgress(30);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      setProgress(50);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ws7-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ csv_content: csvText, filename: file.name }),
        }
      );

      setProgress(80);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import échoué');
      }

      setProgress(100);
      setSummary(result.summary);
      refetchImports();

      toast({
        title: 'Import réussi',
        description: `${result.summary.imported} batch(es) importé(s), ${result.summary.auto_linked} lié(s) automatiquement`,
      });
    } catch (err: any) {
      toast({ title: 'Erreur d\'import', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }, [file, toast, refetchImports]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/logistique')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              Import WS7
            </h1>
            <p className="text-sm text-muted-foreground">Importer les données de production depuis la centrale WS7</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Fichier CSV WS7</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Glissez-déposez ou sélectionnez le fichier CSV de la centrale WS7
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block mx-auto text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium file:cursor-pointer"
              />
              {file && (
                <p className="mt-3 text-sm font-medium text-foreground">
                  📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Import en cours...</span>
                  <span className="font-mono text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full sm:w-auto"
              size="lg"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {importing ? 'Import en cours...' : 'Lancer l\'import'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Summary */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border/50 bg-card">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{summary.total_rows}</p>
                <p className="text-xs text-muted-foreground mt-1">Total lignes</p>
              </CardContent>
            </Card>
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">{summary.imported}</p>
                <p className="text-xs text-muted-foreground mt-1">Importés</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Link2 className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-primary">{summary.auto_linked}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Auto-liés</p>
              </CardContent>
            </Card>
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-2xl font-bold text-warning">{summary.pending_link}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">À réviser</p>
              </CardContent>
            </Card>
          </div>
        )}

        {summary && summary.pending_link > 0 && (
          <Button variant="outline" onClick={() => navigate('/ws7-batches?filter=pending')}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Voir les {summary.pending_link} batch(es) à réviser
          </Button>
        )}

        {/* Recent Imports */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Imports récents</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentImports?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun import récent</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fichier</TableHead>
                      <TableHead className="text-right">Importés</TableHead>
                      <TableHead className="text-right">Échoués</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentImports.map((imp: any) => (
                      <TableRow key={imp.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Clock className="h-3 w-3 inline mr-1 text-muted-foreground" />
                          {format(new Date(imp.import_datetime), 'dd MMM HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{imp.filename}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default" className="bg-success/20 text-success border-0">
                            {imp.rows_imported}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {imp.rows_failed > 0 ? (
                            <Badge variant="destructive">{imp.rows_failed}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
